import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { sessionSynthesisContentSchema, type SessionSynthesisContent } from "@/lib/validation/synthesis";

const SYNTHESIS_MAX_TOKENS = 600;

export const SYNTHESIS_SYSTEM_PROMPT = `Você é um espelho reflexivo digital gerando uma síntese ao final de uma sessão de conversa.
Não diagnostique, não prescreva, não atue como terapeuta.

Leia a conversa e produza uma síntese estruturada com:
- title: uma frase única, poética e específica desta sessão (não genérica), que capture o cerne
  do que foi tocado — no estilo "Hoje você tocou no medo de não dar conta — e descobriu de quem
  era essa conta." Nunca invente algo que não apareceu na conversa.
- themes: 1 a 4 temas centrais da sessão, em palavras ou expressões curtas
- explored: 1-2 frases sobre o que foi explorado na conversa
- patterns: 1 a 3 observações curtas e independentes sobre padrões, repetições ou conexões
  identificados (cada uma como um item separado da lista, não um parágrafo único); se não houver
  um padrão claro, inclua pelo menos uma observação honesta sobre a sessão
- openQuestion: uma pergunta aberta e genuína para reflexão futura, não retórica
- emotions: 1 a 3 emoções centrais expressas na sessão, em palavras curtas (ex: "ansiedade", "alívio");
  numa sessão sem carga emocional clara, descreva honestamente o tom predominante (ex: "neutralidade",
  "calma") em vez de inventar uma emoção que não apareceu
- triggers: 0 a 3 gatilhos identificados — situações, pessoas ou pensamentos específicos que
  antecederam uma reação emocional na conversa; deixe a lista vazia se nenhum gatilho claro apareceu,
  em vez de inventar um

Responda em português. Baseie-se apenas no conteúdo real da conversa — nunca invente temas, padrões, emoções ou gatilhos que não apareceram.`;

export async function generateSessionSynthesis(
  anthropic: Anthropic,
  conversation: MessageParam[]
): Promise<SessionSynthesisContent> {
  const response = await anthropic.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: SYNTHESIS_MAX_TOKENS,
    thinking: { type: "disabled" },
    system: SYNTHESIS_SYSTEM_PROMPT,
    // A conversa real quase sempre termina com a resposta do agente (role "assistant") —
    // enviá-la assim é tratado como prefill de resposta pela API e rejeitado com 400 nos
    // modelos atuais ("a conversa deve terminar com uma mensagem do usuário"). Uma
    // instrução final do usuário garante a alternância correta independentemente de como
    // a conversa terminou.
    messages: [
      ...conversation,
      {
        role: "user",
        content: "Gere a síntese desta sessão agora, seguindo o formato estruturado indicado.",
      },
    ],
    output_config: {
      format: zodOutputFormat(sessionSynthesisContentSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Resposta da IA não pôde ser interpretada como síntese válida.");
  }

  return response.parsed_output;
}
