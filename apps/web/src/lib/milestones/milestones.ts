import type { createClient } from "@/lib/supabase/server";
import { getUserPatterns } from "@/lib/patterns/userPatterns";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface PersonalMilestone {
  id: string;
  title: string;
  theme: string;
  progress: number;
  createdAt: string;
}

interface PersonalMilestoneRow {
  id: string;
  title: string;
  theme: string;
  created_at: string;
}

// Mesma normalização usada em lib/patterns/userPatterns.ts (mergeCounts) para as chaves de
// user_patterns.themes — sem isto, um marco salvo com tema "Dinheiro" nunca encontraria a
// contagem guardada sob a chave "dinheiro". lib/actions/personalMilestones.ts já normaliza
// antes de gravar; exportada aqui para os dois lados (escrita e leitura) usarem a mesma regra.
export function normalizeThemeLabel(theme: string): string {
  return theme.trim().toLowerCase();
}

// Story 4.3 (AC1/AC2): lista os marcos pessoais do usuário com o progresso calculado na
// hora — quantas vezes o tema do marco aparece no agregado `user_patterns.themes`. Não há
// coluna de progresso persistida: ela é sempre derivada do agregado mais recente, então um
// marco criado antes de uma sessão nova já reflete a sessão assim que `user_patterns` for
// atualizado (ver lib/patterns/userPatterns.ts), sem precisar recalcular nada aqui.
export async function getPersonalMilestones(
  supabase: SupabaseServerClient,
  userId: string
): Promise<PersonalMilestone[]> {
  const [milestonesResult, patterns] = await Promise.all([
    supabase
      .from("personal_milestones")
      .select("id, title, theme, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<PersonalMilestoneRow[]>(),
    getUserPatterns(supabase, userId),
  ]);

  if (milestonesResult.error) {
    throw milestonesResult.error;
  }

  const themeCounts = patterns?.themes ?? {};

  return (milestonesResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    theme: row.theme,
    progress: themeCounts[normalizeThemeLabel(row.theme)] ?? 0,
    createdAt: row.created_at,
  }));
}
