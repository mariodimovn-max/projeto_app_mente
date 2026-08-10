"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeeklySummaryData, type WeeklySummaryData } from "@/lib/summaries/weeklySummary";

const GENERIC_ERROR = "Não consegui gerar o resumo agora. Tente novamente.";
const NO_SESSIONS_ERROR =
  "Você ainda não teve conversas nesta última semana. Volte quando tiver algumas sessões para ver seu resumo.";

// Story 4.4 (AC1): gera o resumo semanal sob demanda a partir de `session_syntheses` do
// próprio usuário — RLS já restringe a leitura, o filtro por user_id em
// getWeeklySummaryData só torna a intenção explícita.
export async function generateWeeklySummary(): Promise<
  { summary: WeeklySummaryData } | { error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: GENERIC_ERROR };
    }

    const summary = await getWeeklySummaryData(supabase, user.id);

    if (summary.sessionCount === 0) {
      return { error: NO_SESSIONS_ERROR };
    }

    return { summary };
  } catch (error) {
    console.error(
      "Erro ao gerar resumo semanal:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_ERROR };
  }
}
