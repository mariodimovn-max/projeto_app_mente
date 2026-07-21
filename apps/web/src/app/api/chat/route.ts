import { NextResponse } from "next/server";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agent/client.server";
import { CRISIS_RESPONSE_MESSAGE, detectCrisisSignal } from "@/lib/agent/crisis";
import { analyzeEmotionalState } from "@/lib/agent/emotional-state";
import { buildConversationMessages } from "@/lib/agent/memory";
import { buildSystemPrompt, resolveMaxTokens } from "@/lib/agent/prompts";
import { hasReachedDailyMessageLimit } from "@/lib/rate-limit";
import { chatRequestSchema, MAX_MESSAGE_LENGTH } from "@/lib/validation/message";

export const runtime = "nodejs";

const GENERIC_ERROR = {
  error: {
    code: "chat_failed",
    message: "Não consegui processar sua mensagem agora. Pode tentar novamente?",
  },
};

const DAILY_LIMIT_ERROR = {
  error: {
    code: "daily_limit_reached",
    message:
      "Você chegou ao limite de mensagens de hoje. Isso ajuda a manter o espaço saudável para todos — volte amanhã para continuar a conversa.",
  },
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function ensureSessionId(
  supabase: SupabaseServerClient,
  userId: string,
  providedSessionId: string | undefined
): Promise<string | null> {
  if (providedSessionId) {
    return providedSessionId;
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !session) {
    console.error("Erro ao criar sessão de chat:", error);
    return null;
  }

  return session.id as string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sessão expirada. Faça login novamente." } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);

  // Crisis signals are checked on the raw body first, ahead of the normal length
  // validation below — otherwise a terse crisis-only message (e.g. "overdose", under the
  // general 10-character minimum) would be rejected with a generic validation error
  // before ever reaching detectCrisisSignal. This check is also positioned ahead of any
  // future gating (e.g. Story 2.6's daily message limit), so a crisis reply can never be
  // blocked — that limit must consult this flag and bypass.
  const rawMessage =
    typeof (body as { message?: unknown } | null)?.message === "string"
      ? (body as { message: string }).message.trim()
      : "";
  const isCrisis =
    rawMessage.length > 0 && rawMessage.length <= MAX_MESSAGE_LENGTH && detectCrisisSignal(rawMessage);

  let message: string;
  let existingSessionId: string | undefined;

  if (isCrisis) {
    message = rawMessage;
    const sessionIdResult = chatRequestSchema.shape.sessionId.safeParse(
      (body as { sessionId?: unknown } | null)?.sessionId
    );
    existingSessionId = sessionIdResult.success ? sessionIdResult.data : undefined;
  } else {
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_message",
            message: parsed.error.issues[0]?.message ?? "Mensagem inválida.",
          },
        },
        { status: 400 }
      );
    }

    message = parsed.data.message;
    existingSessionId = parsed.data.sessionId;
  }

  // Crisis replies must never be blocked (Story 2.5 requirement), so the daily cost-control
  // limit only applies to the normal reflective flow — checked here, after crisis detection
  // but before any persistence, so a blocked message is neither saved nor sent to the API.
  if (!isCrisis && (await hasReachedDailyMessageLimit(supabase, user.id))) {
    return NextResponse.json(DAILY_LIMIT_ERROR, { status: 429 });
  }

  const sessionId = await ensureSessionId(supabase, user.id, existingSessionId);
  if (!sessionId) {
    return NextResponse.json(GENERIC_ERROR, { status: 500 });
  }

  const { error: userMessageError } = await supabase
    .from("messages")
    .insert({ session_id: sessionId, role: "user", content: message });

  if (userMessageError) {
    console.error("Erro ao salvar mensagem do usuário:", userMessageError);
    return NextResponse.json(GENERIC_ERROR, { status: 500 });
  }

  if (isCrisis) {
    // Persist before delivering: the safety text must reach the user even if this insert
    // fails, so a persistence hiccup is logged (not surfaced as a stream error) instead of
    // showing a "tentar novamente" banner underneath an already-delivered crisis message —
    // which would also resubmit the same message and duplicate the user-message row.
    try {
      const { error: assistantMessageError } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "assistant", content: CRISIS_RESPONSE_MESSAGE });

      if (assistantMessageError) {
        console.error("Erro ao salvar resposta de crise:", assistantMessageError);
      }
    } catch (error) {
      console.error("Erro ao salvar resposta de crise:", error);
    }

    return new Response(CRISIS_RESPONSE_MESSAGE, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Session-Id": sessionId,
        // Lets the client skip the "depth" progression it applies to real reflective
        // exchanges — a safety redirect isn't reflective depth.
        "X-Crisis-Response": "true",
      },
    });
  }

  const conversation: MessageParam[] = await buildConversationMessages(supabase, sessionId);
  const { state: emotionalState, intensity: emotionalIntensity } = analyzeEmotionalState(message);
  const systemPrompt = buildSystemPrompt(emotionalState, emotionalIntensity);
  const maxTokens = resolveMaxTokens(emotionalState, emotionalIntensity);
  const anthropic = getAnthropicClient();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        const messageStream = anthropic.messages.stream({
          model: "claude-sonnet-5",
          max_tokens: maxTokens,
          thinking: { type: "disabled" },
          system: systemPrompt,
          messages: conversation,
        });

        messageStream.on("text", (delta) => {
          fullText += delta;
          controller.enqueue(encoder.encode(delta));
        });

        const finalMessage = await messageStream.finalMessage();

        if (finalMessage.stop_reason === "max_tokens") {
          // The response was cut off by maxTokens before the model finished — surfaced here
          // (not silently swallowed) so a solo dev can notice if the token budgets in
          // resolveMaxTokens are too tight for real conversations, especially for melancholy.
          console.warn("Resposta do agente truncada pelo limite de tokens", {
            sessionId,
            emotionalState,
            emotionalIntensity,
            maxTokens,
          });
        }

        if (fullText.trim().length > 0) {
          const { error: assistantMessageError } = await supabase
            .from("messages")
            .insert({ session_id: sessionId, role: "assistant", content: fullText });

          if (assistantMessageError) {
            controller.error(assistantMessageError);
            return;
          }
        }

        controller.close();
      } catch (error) {
        console.error("Erro ao gerar resposta do agente:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": sessionId,
    },
  });
}
