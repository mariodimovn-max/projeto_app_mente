import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_TOPICS_LIMIT = 5;
const TOP_EMOTIONS_LIMIT = 5;

// Cobre 14 dias de sínteses de um único usuário — bem acima do volume real de um beta
// fechado, só como salvaguarda contra volume anômalo (mesmo padrão de
// lib/dashboard/dashboard.ts).
const LOOKBACK_ROW_CAP = 500;

export interface WeeklySummaryEntry {
  label: string;
  count: number;
}

export interface WeeklySummaryTimelineEntry {
  sessionId: string;
  title: string;
  createdAt: string;
}

export interface WeeklySummaryData {
  periodStart: string;
  periodEnd: string;
  sessionCount: number;
  previousSessionCount: number;
  topics: WeeklySummaryEntry[];
  emotions: WeeklySummaryEntry[];
  timeline: WeeklySummaryTimelineEntry[];
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

function topEntries(counts: Record<string, number>, limit: number): WeeklySummaryEntry[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// Texto honesto sobre o ritmo da semana (sem gamification — FR7): compara só a contagem de
// sessões com a semana anterior, nunca insinua "meta" ou julgamento de desempenho.
function buildProgressNote(currentCount: number, previousCount: number): string {
  const currentLabel = `${currentCount} ${pluralize(currentCount, "sessão", "sessões")}`;

  if (previousCount === 0) {
    return `${currentLabel} nesta semana — um começo.`;
  }

  const previousArticle = pluralize(previousCount, "a", "as");

  if (currentCount > previousCount) {
    return `${currentLabel} nesta semana, mais que ${previousArticle} ${previousCount} da semana passada.`;
  }
  if (currentCount < previousCount) {
    return `${currentLabel} nesta semana, menos que ${previousArticle} ${previousCount} da semana passada — o ritmo é seu.`;
  }
  return `${currentLabel} nesta semana, no mesmo ritmo da semana passada.`;
}

// Resumo semanal sob demanda (Story 4.4, AC1): calculado deterministicamente a partir de
// `session_syntheses` (temas e emoções já abstraídos pela síntese de cada sessão, nunca
// mensagens brutas — AC3), sem nova chamada à IA. Busca 14 dias de uma vez e divide em
// memória entre a semana atual e a anterior, para computar a comparação de ritmo em uma
// única consulta.
export async function getWeeklySummaryData(
  supabase: SupabaseServerClient,
  userId: string,
  referenceDate: Date = new Date()
): Promise<WeeklySummaryData> {
  const periodEnd = referenceDate;
  const periodStart = new Date(periodEnd.getTime() - WEEK_MS);
  const previousPeriodStart = new Date(periodStart.getTime() - WEEK_MS);
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
  // Comparação por instante (epoch), não por string: o `created_at` retornado pelo Postgres
  // não usa necessariamente o mesmo formato do `toISOString()` do JS (ex.: sufixo "+00:00" em
  // vez de "Z") — comparar como string classificaria linhas incorretamente mesmo quando
  // representam o mesmo instante. O limite superior evita incluir linhas além de `periodEnd`
  // caso `referenceDate` não seja "agora".
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
