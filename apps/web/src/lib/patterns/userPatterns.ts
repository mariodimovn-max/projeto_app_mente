import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface SessionPatternInput {
  themes: string[];
  emotions: string[];
  triggers: string[];
}

export interface UpdateUserPatternsResult {
  // Story 3.3 AC3: verdadeiro só na primeira vez que o histórico deste usuário é
  // agregado — usado para decidir se o aviso de privacidade deve ser exibido.
  isFirstAnalysis: boolean;
}

export type PatternCounts = Record<string, number>;

interface UserPatternsRow {
  themes: PatternCounts | null;
  emotions: PatternCounts | null;
  triggers: PatternCounts | null;
  session_count: number | null;
}

export interface UserPatternsSummary {
  themes: PatternCounts;
  emotions: PatternCounts;
  triggers: PatternCounts;
  sessionCount: number;
}

// Rótulos são normalizados (trim + lowercase) antes de contar, para que variações de
// capitalização da IA entre sessões ("Sono" vs "sono") acumulem no mesmo rótulo em vez
// de fragmentar a contagem. Deduplicados dentro da própria lista da sessão primeiro —
// sem isso, uma sessão que retornasse ["Sono", "sono"] contaria 2 para a mesma sessão
// em vez de 1.
function mergeCounts(existing: PatternCounts, items: string[]): PatternCounts {
  const merged = { ...existing };
  const uniqueKeys = new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean));
  for (const key of uniqueKeys) {
    merged[key] = (merged[key] ?? 0) + 1;
  }
  return merged;
}

// Agrega temas/emoções/gatilhos de uma sessão recém-sintetizada ao agregado acumulado do
// usuário em `user_patterns` (Story 3.3, AC1/AC2) — nunca recriado, sempre incrementado.
// Não é atômico (lê, funde em memória, faz upsert): duas sessões do mesmo usuário
// terminando no mesmo instante poderiam perder um incremento; aceitável para o volume de
// uso de um beta fechado, mesmo compromisso já assumido em outras partes do MVP.
export async function updateUserPatterns(
  supabase: SupabaseServerClient,
  userId: string,
  input: SessionPatternInput
): Promise<UpdateUserPatternsResult> {
  const { data: existing, error: selectError } = await supabase
    .from("user_patterns")
    .select("themes, emotions, triggers, session_count")
    .eq("user_id", userId)
    .maybeSingle<UserPatternsRow>();

  if (selectError) {
    throw selectError;
  }

  const isFirstAnalysis = !existing;

  const { error: upsertError } = await supabase.from("user_patterns").upsert(
    {
      user_id: userId,
      themes: mergeCounts(existing?.themes ?? {}, input.themes),
      emotions: mergeCounts(existing?.emotions ?? {}, input.emotions),
      triggers: mergeCounts(existing?.triggers ?? {}, input.triggers),
      session_count: (existing?.session_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    throw upsertError;
  }

  return { isFirstAnalysis };
}

// Story 3.4 (AC1): leitura do agregado para compor a memória em camadas do prompt do
// agente. Retorna null quando o usuário ainda não tem nenhuma sessão sintetizada — a
// mesma condição usada por updateUserPatterns para decidir isFirstAnalysis.
export async function getUserPatterns(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserPatternsSummary | null> {
  const { data, error } = await supabase
    .from("user_patterns")
    .select("themes, emotions, triggers, session_count")
    .eq("user_id", userId)
    .maybeSingle<UserPatternsRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    themes: data.themes ?? {},
    emotions: data.emotions ?? {},
    triggers: data.triggers ?? {},
    sessionCount: data.session_count ?? 0,
  };
}
