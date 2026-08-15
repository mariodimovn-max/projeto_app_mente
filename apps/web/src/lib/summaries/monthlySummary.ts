import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const TOP_TOPICS_LIMIT = 5;
const TOP_EMOTIONS_LIMIT = 5;

// Cobre 60 dias de sínteses de um único usuário — bem acima do volume real de um beta
// fechado, só como salvaguarda contra volume anômalo (mesmo padrão de
// lib/summaries/weeklySummary.ts).
const LOOKBACK_ROW_CAP = 1000;

export interface MonthlySummaryEntry {
  label: string;
  count: number;
}

export interface MonthlySummaryTimelineEntry {
  sessionId: string;
  title: string;
  createdAt: string;
}

export interface MonthlySummaryData {
  periodStart: string;
  periodEnd: string;
  sessionCount: number;
  previousSessionCount: number;
  topics: MonthlySummaryEntry[];
  emotions: MonthlySummaryEntry[];
  timeline: MonthlySummaryTimelineEntry[];
  progressNote: string;
}

interface SessionSynthesisSummaryRow {
  session_id: string;
  title: string;
  themes: string[] | null;
  emotions: string[] | null;
  created_at: string;
}

function countLabels(rows: (string[] | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const labels of rows) {
    const uniqueKeys = new Set((labels ?? []).map((label) => label.trim().toLowerCase()).filter(Boolean));
    for (const key of uniqueKeys) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

function topEntries(counts: Record<string, number>, limit: number): MonthlySummaryEntry[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// Texto honesto sobre o ritmo do mês (sem gamification — FR7): compara só a contagem de
// sessões com o mês anterior, nunca insinua "meta" ou julgamento de desempenho.
function buildProgressNote(currentCount: number, previousCount: number): string {
  const currentLabel = `${currentCount} ${pluralize(currentCount, "sessão", "sessões")}`;

  if (previousCount === 0) {
    return `${currentLabel} neste mês — um começo.`;
  }

  const previousArticle = pluralize(previousCount, "o", "os");

  if (currentCount > previousCount) {
    return `${currentLabel} neste mês, mais que ${previousArticle} ${previousCount} do mês passado.`;
  }
  if (currentCount < previousCount) {
    return `${currentLabel} neste mês, menos que ${previousArticle} ${previousCount} do mês passado — o ritmo é seu.`;
  }
  return `${currentLabel} neste mês, no mesmo ritmo do mês passado.`;
}

// Resumo mensal sob demanda (Story 4.5, AC1): calculado deterministicamente a partir de
// `session_syntheses` (temas e emoções já abstraídos pela síntese de cada sessão, nunca
// mensagens brutas — AC3), sem nova chamada à IA. Busca 60 dias de uma vez e divide em
// memória entre o mês atual e o anterior, para computar a comparação de ritmo em uma única
// consulta — mesma estratégia de lib/summaries/weeklySummary.ts, só com janela maior.
export async function getMonthlySummaryData(
  supabase: SupabaseServerClient,
  userId: string,
  referenceDate: Date = new Date()
): Promise<MonthlySummaryData> {
  const periodEnd = referenceDate;
  const periodStart = new Date(periodEnd.getTime() - MONTH_MS);
  const previousPeriodStart = new Date(periodStart.getTime() - MONTH_MS);
  const periodStartMs = periodStart.getTime();
  const periodEndMs = periodEnd.getTime();

  const { data, error } = await supabase
    .from("session_syntheses")
    .select("session_id, title, themes, emotions, created_at, sessions!inner(user_id)")
    .eq("sessions.user_id", userId)
    .gte("created_at", previousPeriodStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(LOOKBACK_ROW_CAP)
    .returns<SessionSynthesisSummaryRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  // Comparação por instante (epoch), não por string — mesmo motivo documentado em
  // lib/summaries/weeklySummary.ts: o `created_at` do Postgres não usa necessariamente o
  // mesmo formato do `toISOString()` do JS.
  const rowsWithMs = rows.map((row) => ({ row, ms: new Date(row.created_at).getTime() }));
  const currentRows = rowsWithMs
    .filter(({ ms }) => ms >= periodStartMs && ms <= periodEndMs)
    .map(({ row }) => row);
  const previousRows = rowsWithMs.filter(({ ms }) => ms < periodStartMs).map(({ row }) => row);

  const timeline = [...currentRows]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((row) => ({ sessionId: row.session_id, title: row.title, createdAt: row.created_at }));

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    sessionCount: currentRows.length,
    previousSessionCount: previousRows.length,
    topics: topEntries(countLabels(currentRows.map((row) => row.themes)), TOP_TOPICS_LIMIT),
    emotions: topEntries(countLabels(currentRows.map((row) => row.emotions)), TOP_EMOTIONS_LIMIT),
    timeline,
    progressNote: buildProgressNote(currentRows.length, previousRows.length),
  };
}
