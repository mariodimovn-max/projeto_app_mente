"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/chat";

const GENERIC_ERROR = "Não consegui recuperar essa conversa.";

const sessionIdSchema = z.string().uuid();

interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Story 4.1, AC1: retoma uma sessão de chat em andamento ao navegar de volta para
// /chat via PrimaryNav — sem isso, sair do chat e voltar reiniciaria a conversa do
// zero mesmo com as mensagens já persistidas no banco (Story 2.1). Uma sessão que já
// tem síntese (Story 3.1) está encerrada e não é retomável.
export async function resumeSession(
  sessionId: string
): Promise<{ messages: ChatMessage[] } | { error: string }> {
  const parsedSessionId = sessionIdSchema.safeParse(sessionId);
  if (!parsedSessionId.success) {
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: GENERIC_ERROR };
  }

  try {
    // Ownership também é garantido por RLS, mas checar aqui deixa uma sessão alheia ou
    // inexistente falhar alto em vez de silenciosamente devolver zero mensagens.
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", parsedSessionId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError || !session) {
      return { error: GENERIC_ERROR };
    }

    const { data: synthesis, error: synthesisError } = await supabase
      .from("session_syntheses")
      .select("id")
      .eq("session_id", parsedSessionId.data)
      .maybeSingle();

    if (synthesisError) {
      return { error: GENERIC_ERROR };
    }
    if (synthesis) {
      // Sessão já encerrada — nada para retomar.
      return { error: GENERIC_ERROR };
    }

    const { data: messageRows, error: messagesError } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("session_id", parsedSessionId.data)
      .order("created_at", { ascending: true })
      .returns<MessageRow[]>();

    if (messagesError) {
      return { error: GENERIC_ERROR };
    }

    const messages: ChatMessage[] = (messageRows ?? []).map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));

    return { messages };
  } catch (error) {
    console.error(
      "Erro ao retomar sessão de chat:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_ERROR };
  }
}
