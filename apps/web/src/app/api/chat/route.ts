import { NextResponse } from "next/server";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agent/client.server";
import { analyzeEmotionalState } from "@/lib/agent/emotional-state";
import { buildConversationMessages } from "@/lib/agent/memory";
import { buildSystemPrompt, resolveMaxTokens } from "@/lib/agent/prompts";
import { chatRequestSchema } from "@/lib/validation/message";

export const runtime = "nodejs";

const GENERIC_ERROR = {
  error: {
    code: "chat_failed",
    message: "Não consegui processar sua mensagem agora. Pode tentar novamente?",
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

  const { message, sessionId: existingSessionId } = parsed.data;

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
