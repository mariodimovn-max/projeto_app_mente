"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const GENERIC_MARK_ERROR = "Não consegui atualizar essa sessão agora. Tente novamente.";
const GENERIC_DELETE_ERROR = "Não consegui excluir essa sessão agora. Tente novamente.";

const sessionIdSchema = z.string().uuid();
const markedSchema = z.boolean();

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

async function assertOwnsSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string
): Promise<boolean> {
  // Ownership is also enforced by RLS, but checking explicitly here lets an unowned or
  // nonexistent session fail loudly instead of silently touching zero rows further down —
  // mesmo padrão de lib/actions/endSession.ts e lib/actions/synthesisReaction.ts.
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

export async function setSessionMarked(
  sessionId: string,
  marked: boolean
): Promise<{ success: true } | { error: string }> {
  const parsedId = sessionIdSchema.safeParse(sessionId);
  const parsedMarked = markedSchema.safeParse(marked);
  if (!parsedId.success || !parsedMarked.success) {
    return { error: GENERIC_MARK_ERROR };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: GENERIC_MARK_ERROR };
    }

    if (!(await assertOwnsSession(supabase, user.id, parsedId.data))) {
      return { error: GENERIC_MARK_ERROR };
    }

    const { error } = await supabase
      .from("sessions")
      .update({ marked: parsedMarked.data })
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      logSupabaseError("Erro ao marcar/desmarcar sessão:", error);
      return { error: GENERIC_MARK_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao marcar/desmarcar sessão:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_MARK_ERROR };
  }
}

export async function deleteSession(
  sessionId: string
): Promise<{ success: true } | { error: string }> {
  const parsedId = sessionIdSchema.safeParse(sessionId);
  if (!parsedId.success) {
    return { error: GENERIC_DELETE_ERROR };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: GENERIC_DELETE_ERROR };
    }

    if (!(await assertOwnsSession(supabase, user.id, parsedId.data))) {
      return { error: GENERIC_DELETE_ERROR };
    }

    // `on delete cascade` nas FKs de messages/session_syntheses/session_synthesis_reactions
    // apaga a conversa e a síntese junto — não há soft-delete (ver migration da Story 3.5).
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      logSupabaseError("Erro ao excluir sessão:", error);
      return { error: GENERIC_DELETE_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao excluir sessão:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_DELETE_ERROR };
  }
}
