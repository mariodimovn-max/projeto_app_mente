"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  SYNTHESIS_REACTION_COMMENT_MAX_LENGTH,
  SYNTHESIS_REACTION_EMOJI_KEYS,
} from "@/lib/synthesis/reactions";
import type { SynthesisReactionInput } from "@/types/synthesisReaction";

const SAVE_GENERIC_ERROR = "Não consegui salvar sua reação agora. Tente novamente.";
const UNDO_GENERIC_ERROR = "Não consegui desfazer sua reação agora. Tente novamente.";

const synthesisIdSchema = z.string().uuid();

// Emoji e comentário são mutuamente exclusivos (ver migration) — espelhado aqui via union
// de objetos .strict() para rejeitar tanto payloads sem nenhuma das duas chaves quanto
// payloads que mandem as duas (sem .strict() o union aceitaria a primeira chave que bater
// e descartaria a outra silenciosamente, em vez de rejeitar).
const reactionInputSchema = z.union([
  z.object({ emoji: z.enum(SYNTHESIS_REACTION_EMOJI_KEYS) }).strict(),
  z
    .object({ comment: z.string().trim().min(1).max(SYNTHESIS_REACTION_COMMENT_MAX_LENGTH) })
    .strict(),
]);

function logSupabaseError(
  message: string,
  error: { message: string; code?: string; details?: string; hint?: string }
): void {
  console.error(message, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

async function assertOwnsSynthesis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  synthesisId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Ownership is also enforced by RLS, but checking explicitly here lets an unowned or
  // nonexistent synthesis fail loudly instead of silently touching zero rows further down —
  // mesmo padrão de lib/actions/endSession.ts.
  const { data: synthesis, error } = await supabase
    .from("session_syntheses")
    .select("id, sessions!inner(user_id)")
    .eq("id", synthesisId)
    .eq("sessions.user_id", user.id)
    .maybeSingle();

  return !error && !!synthesis;
}

export async function saveSynthesisReaction(
  synthesisId: string,
  input: SynthesisReactionInput
): Promise<{ success: true } | { error: string }> {
  const parsedId = synthesisIdSchema.safeParse(synthesisId);
  const parsedInput = reactionInputSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return { error: SAVE_GENERIC_ERROR };
  }

  try {
    const supabase = await createClient();

    if (!(await assertOwnsSynthesis(supabase, parsedId.data))) {
      return { error: SAVE_GENERIC_ERROR };
    }

    const payload: { synthesis_id: string; emoji: string | null; comment: string | null } =
      "emoji" in parsedInput.data
        ? { synthesis_id: parsedId.data, emoji: parsedInput.data.emoji, comment: null }
        : { synthesis_id: parsedId.data, emoji: null, comment: parsedInput.data.comment };

    const { error: upsertError } = await supabase
      .from("session_synthesis_reactions")
      .upsert(payload, { onConflict: "synthesis_id" });

    if (upsertError) {
      logSupabaseError("Erro ao salvar reação da síntese:", upsertError);
      return { error: SAVE_GENERIC_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao salvar reação da síntese:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: SAVE_GENERIC_ERROR };
  }
}

export async function deleteSynthesisReaction(
  synthesisId: string
): Promise<{ success: true } | { error: string }> {
  const parsedId = synthesisIdSchema.safeParse(synthesisId);
  if (!parsedId.success) {
    return { error: UNDO_GENERIC_ERROR };
  }

  try {
    const supabase = await createClient();

    if (!(await assertOwnsSynthesis(supabase, parsedId.data))) {
      return { error: UNDO_GENERIC_ERROR };
    }

    const { error: deleteError } = await supabase
      .from("session_synthesis_reactions")
      .delete()
      .eq("synthesis_id", parsedId.data);

    if (deleteError) {
      logSupabaseError("Erro ao remover reação da síntese:", deleteError);
      return { error: UNDO_GENERIC_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao remover reação da síntese:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: UNDO_GENERIC_ERROR };
  }
}
