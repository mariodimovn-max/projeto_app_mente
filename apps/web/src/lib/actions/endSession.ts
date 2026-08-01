"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agent/client.server";
import { buildConversationMessages } from "@/lib/agent/memory";
import { generateSessionSynthesis } from "@/lib/agent/synthesis";
import { updateUserPatterns } from "@/lib/patterns/userPatterns";
import type { SessionSynthesis } from "@/types/synthesis";

const GENERIC_ERROR = "Não consegui gerar a síntese desta sessão agora. Tente novamente.";
const NO_EXCHANGE_ERROR = "É preciso pelo menos uma troca de mensagens para gerar uma síntese.";

// Código de erro do Postgres para violação de constraint única.
const UNIQUE_VIOLATION_CODE = "23505";

const sessionIdSchema = z.string().uuid();
const depthSchema = z.number().int().min(0);

type SynthesisRow = {
  id: string;
  title: string;
  themes: string[];
  explored: string;
  patterns: string[];
  open_question: string;
  depth: number;
  created_at: string;
};

function mapSynthesisRow(
  row: SynthesisRow,
  extra: { durationMinutes: number; exchangeCount: number }
): SessionSynthesis {
  return {
    id: row.id,
    title: row.title,
    themes: row.themes,
    explored: row.explored,
    patterns: row.patterns,
    openQuestion: row.open_question,
    depth: row.depth,
    durationMinutes: extra.durationMinutes,
    exchangeCount: extra.exchangeCount,
    createdAt: row.created_at,
  };
}

export async function endSession(
  sessionId: string,
  depth: number
): Promise<
  | { synthesis: SessionSynthesis; showPatternPrivacyNotice: boolean }
  | { error: string }
> {
  const parsedSessionId = sessionIdSchema.safeParse(sessionId);
  const parsedDepth = depthSchema.safeParse(depth);
  if (!parsedSessionId.success || !parsedDepth.success) {
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
    // Ownership is also enforced by RLS, but checking explicitly here lets an
    // unowned or nonexistent session fail loudly instead of silently reading
    // zero rows further down.
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, created_at")
      .eq("id", parsedSessionId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError || !session) {
      return { error: GENERIC_ERROR };
    }

    const conversation = await buildConversationMessages(supabase, parsedSessionId.data);
    const exchangeCount = conversation.filter((message) => message.role === "user").length;
    const hasExchange = exchangeCount > 0 && conversation.some((message) => message.role === "assistant");

    if (!hasExchange) {
      return { error: NO_EXCHANGE_ERROR };
    }

    const durationMinutes = Math.max(
      0,
      Math.round((Date.now() - new Date(session.created_at as string).getTime()) / 60000)
    );

    const content = await generateSessionSynthesis(getAnthropicClient(), conversation);

    const { data: row, error: insertError } = await supabase
      .from("session_syntheses")
      .insert({
        session_id: parsedSessionId.data,
        title: content.title,
        themes: content.themes,
        explored: content.explored,
        patterns: content.patterns,
        open_question: content.openQuestion,
        depth: parsedDepth.data,
      })
      .select("id, title, themes, explored, patterns, open_question, depth, created_at")
      .single();

    if (insertError) {
      // Duas chamadas concorrentes para a mesma sessão (clique manual coincidindo com o
      // timer de inatividade, ou duplo clique) esbarram no índice único de session_id —
      // nesse caso a síntese já existe, então buscamos e devolvemos ela em vez de um erro.
      if (insertError.code === UNIQUE_VIOLATION_CODE) {
        const { data: existing } = await supabase
          .from("session_syntheses")
          .select("id, title, themes, explored, patterns, open_question, depth, created_at")
          .eq("session_id", parsedSessionId.data)
          .single();

        if (existing) {
          // Não atualiza user_patterns aqui: a chamada vencedora (que de fato inseriu a
          // síntese) já cuidou disso, e agregar de novo aqui contaria a mesma sessão duas
          // vezes no acumulado.
          return {
            synthesis: mapSynthesisRow(existing as SynthesisRow, { durationMinutes, exchangeCount }),
            showPatternPrivacyNotice: false,
          };
        }
      }

      console.error("Erro ao salvar síntese da sessão:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return { error: GENERIC_ERROR };
    }

    if (!row) {
      return { error: GENERIC_ERROR };
    }

    // Story 3.3, AC1/AC2: atualiza o agregado incremental de padrões longitudinais junto
    // ao encerramento da sessão. Melhor esforço — se a agregação falhar, a síntese já foi
    // salva e continua útil ao usuário, então o erro é logado em vez de descartar o
    // resultado da sessão inteira por causa de uma atualização secundária.
    let showPatternPrivacyNotice = false;
    try {
      const { isFirstAnalysis } = await updateUserPatterns(supabase, user.id, {
        themes: content.themes,
        emotions: content.emotions,
        triggers: content.triggers,
      });
      showPatternPrivacyNotice = isFirstAnalysis;
    } catch (patternError) {
      console.error(
        "Erro ao atualizar o agregado de padrões do usuário:",
        patternError instanceof Error
          ? { message: patternError.message, stack: patternError.stack }
          : patternError
      );
    }

    return {
      synthesis: mapSynthesisRow(row as SynthesisRow, { durationMinutes, exchangeCount }),
      showPatternPrivacyNotice,
    };
  } catch (error) {
    console.error(
      "Erro ao gerar síntese da sessão:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_ERROR };
  }
}
