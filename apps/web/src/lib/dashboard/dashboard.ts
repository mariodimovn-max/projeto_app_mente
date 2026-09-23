import type { createClient } from "@/lib/supabase/server";
import { getUserPatterns } from "@/lib/patterns/userPatterns";
import { toDayKey } from "@/lib/dashboard/date";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface DashboardTheme {
  label: string;
  count: number;
}

export interface DashboardData {
  streakDays: number;
  sessionCount: number;
  themes: DashboardTheme[];
}

const MAX_THEMES = 6;

// Cobre bem mais dias do que qualquer streak real de um beta fechado deveria alcançar,
// filtrando por data (não por quantidade de linhas) — um usuário com várias sessões no
// mesmo dia não deve "gastar" essa janela mais rápido que um com uma sessão por dia. O
// limite de linhas abaixo é só uma salvaguarda contra volume anômalo, não o teto real.
const STREAK_LOOKBACK_DAYS = 120;
const STREAK_LOOKBACK_ROW_CAP = 3000;

interface SessionDateRow {
  created_at: string;
}

// Conta dias consecutivos de presença (Story 4.2, AC1) a partir das datas em que o
// usuário abriu ao menos uma sessão — não exige que a sessão tenha sido encerrada com
// síntese, só que tenha existido. Não haver sessão hoje ainda não quebra o streak (o
// usuário pode voltar à noite); só quebra quando falta um dia inteiro sem nenhuma sessão.
export function computeStreakDays(sessionDates: string[], referenceDate: Date = new Date()): number {
  const uniqueDays = new Set(sessionDates.map((iso) => toDayKey(new Date(iso))));

  const cursor = new Date(referenceDate);
  if (!uniqueDays.has(toDayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (uniqueDays.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function topThemes(themes: Record<string, number>, limit: number): DashboardTheme[] {
  return Object.entries(themes)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit);
}

// Fonte dos indicadores da tela Início (Story 4.2). Sessões concluídas e temas vêm do
// agregado pré-computado `user_patterns` (AC2) — nenhuma mensagem bruta é lida aqui. O
// streak não tem uma coluna própria em user_patterns, então é calculado a partir de
// `sessions.created_at` (datas apenas, não conteúdo de conversa), que é o dado mais leve
// disponível para essa métrica.
export async function getDashboardData(
  supabase: SupabaseServerClient,
  userId: string
): Promise<DashboardData> {
  const lookbackCutoff = new Date(
    Date.now() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [patterns, sessionDatesResult] = await Promise.all([
    getUserPatterns(supabase, userId),
    supabase
      .from("sessions")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", lookbackCutoff)
      .order("created_at", { ascending: false })
      .limit(STREAK_LOOKBACK_ROW_CAP)
      .returns<SessionDateRow[]>(),
  ]);

  if (sessionDatesResult.error) {
    throw sessionDatesResult.error;
  }

  const streakDays = computeStreakDays(
    (sessionDatesResult.data ?? []).map((row) => row.created_at)
  );

  return {
    streakDays,
    sessionCount: patterns?.sessionCount ?? 0,
    themes: topThemes(patterns?.themes ?? {}, MAX_THEMES),
  };
}
