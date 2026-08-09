import type { createClient } from "@/lib/supabase/server";
import { getUserPatterns } from "@/lib/patterns/userPatterns";

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
// Cobre bem mais que qualquer streak real de um beta fechado — não é um teto de
// negócio, só evita buscar o histórico inteiro de um usuário de longa data.
const STREAK_LOOKBACK_SESSIONS = 90;

interface SessionDateRow {
  created_at: string;
}

function toDayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Conta dias consecutivos de presença (Story 4.2, AC1) a partir das datas em que o
// usuário abriu ao menos uma sessão — não exige que a sessão tenha sido encerrada com
// síntese, só que tenha existido. Não haver sessão hoje ainda não quebra o streak (o
// usuário pode voltar à noite); só quebra quando falta um dia inteiro sem nenhuma sessão.
export function computeStreakDays(sessionDates: string[], referenceDate: Date = new Date()): number {
  const uniqueDays = new Set(sessionDates.map(toDayKey));

  const cursor = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  if (!uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
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
  const [patterns, sessionDatesResult] = await Promise.all([
    getUserPatterns(supabase, userId),
    supabase
      .from("sessions")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(STREAK_LOOKBACK_SESSIONS)
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
