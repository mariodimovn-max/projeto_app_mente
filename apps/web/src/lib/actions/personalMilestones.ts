"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizeThemeLabel } from "@/lib/milestones/milestones";
import type { PersonalMilestoneInput } from "@/types/personalMilestone";

const SAVE_GENERIC_ERROR = "Não consegui salvar seu marco agora. Tente novamente.";
const DELETE_GENERIC_ERROR = "Não consegui remover seu marco agora. Tente novamente.";

const TITLE_MAX_LENGTH = 140;
const THEME_MAX_LENGTH = 40;

const milestoneIdSchema = z.string().uuid();
const milestoneInputSchema = z.object({
  title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
  theme: z.string().trim().min(1).max(THEME_MAX_LENGTH),
});

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

async function assertOwnsMilestone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  milestoneId: string
): Promise<boolean> {
  // Ownership também é garantida por RLS, mas checar aqui explicitamente faz um marco
  // inexistente ou de outro usuário falhar alto em vez de silenciosamente afetar zero
  // linhas mais adiante — mesmo padrão de lib/actions/sessionHistory.ts.
  const { data, error } = await supabase
    .from("personal_milestones")
    .select("id")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

export async function createPersonalMilestone(
  input: PersonalMilestoneInput
): Promise<{ success: true; id: string } | { error: string }> {
  const parsedInput = milestoneInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: SAVE_GENERIC_ERROR };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: SAVE_GENERIC_ERROR };
    }

    const { data, error } = await supabase
      .from("personal_milestones")
      .insert({
        user_id: user.id,
        title: parsedInput.data.title,
        theme: normalizeThemeLabel(parsedInput.data.theme),
      })
      .select("id")
      .single();

    if (error || !data) {
      logSupabaseError(
        "Erro ao criar marco pessoal:",
        error ?? { message: "insert sem retorno" }
      );
      return { error: SAVE_GENERIC_ERROR };
    }

    return { success: true, id: data.id as string };
  } catch (error) {
    console.error(
      "Erro ao criar marco pessoal:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: SAVE_GENERIC_ERROR };
  }
}

export async function updatePersonalMilestone(
  milestoneId: string,
  input: PersonalMilestoneInput
): Promise<{ success: true } | { error: string }> {
  const parsedId = milestoneIdSchema.safeParse(milestoneId);
  const parsedInput = milestoneInputSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return { error: SAVE_GENERIC_ERROR };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: SAVE_GENERIC_ERROR };
    }

    if (!(await assertOwnsMilestone(supabase, user.id, parsedId.data))) {
      return { error: SAVE_GENERIC_ERROR };
    }

    const { error } = await supabase
      .from("personal_milestones")
      .update({
        title: parsedInput.data.title,
        theme: normalizeThemeLabel(parsedInput.data.theme),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      logSupabaseError("Erro ao atualizar marco pessoal:", error);
      return { error: SAVE_GENERIC_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao atualizar marco pessoal:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: SAVE_GENERIC_ERROR };
  }
}

export async function deletePersonalMilestone(
  milestoneId: string
): Promise<{ success: true } | { error: string }> {
  const parsedId = milestoneIdSchema.safeParse(milestoneId);
  if (!parsedId.success) {
    return { error: DELETE_GENERIC_ERROR };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: DELETE_GENERIC_ERROR };
    }

    if (!(await assertOwnsMilestone(supabase, user.id, parsedId.data))) {
      return { error: DELETE_GENERIC_ERROR };
    }

    const { error } = await supabase
      .from("personal_milestones")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      logSupabaseError("Erro ao remover marco pessoal:", error);
      return { error: DELETE_GENERIC_ERROR };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Erro ao remover marco pessoal:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: DELETE_GENERIC_ERROR };
  }
}
