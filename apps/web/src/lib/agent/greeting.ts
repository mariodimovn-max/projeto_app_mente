import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { dailyGreetingContentSchema, type DailyGreetingContent } from "@/lib/validation/greeting";

const GREETING_MAX_TOKENS = 200;

export const GREETING_SYSTEM_PROMPT = `Você é um espelho reflexivo digital escrevendo uma frase curta de boas-vindas para
a tela inicial de um diário pessoal — não terapêutico, não prescritivo.

Escreva 1 frase curta (até 16 palavras), em português, num tom sereno, caloroso e direto.
Sem clichês de app de produtividade, sem emojis, sem ponto de exclamação, sem citar números
ou métricas (elas já aparecem em outro lugar da tela). Não dê conselhos nem instruções —
apenas acolha a volta da pessoa a este espaço, eventualmente ecoando (sem citar
literalmente) um tema que ela tem explorado, se fizer sentido. Varie a frase a cada dia
para não soar repetitiva; se uma mensagem de um dia anterior for fornecida, não a repita
nem produza algo muito parecido.`;

export interface DailyGreetingContext {
  topTheme: string | null;
  previousMessage: string | null;
}

function buildUserPrompt(context: DailyGreetingContext): string {
  const lines = [
    context.topTheme
      ? `Tema mais recorrente nas conversas recentes: "${context.topTheme}".`
      : "Ainda sem um tema claramente recorrente.",
    context.previousMessage
      ? `Mensagem de um dia anterior (não repita nem parafraseie de perto): "${context.previousMessage}"`
      : "Sem mensagem anterior registrada.",
  ];

  return `${lines.join("\n")}\n\nGere a frase de boas-vindas de hoje agora.`;
}

export async function generateDailyGreeting(
  anthropic: Anthropic,
  context: DailyGreetingContext,
  options?: { timeoutMs?: number }
): Promise<DailyGreetingContent> {
  const response = await anthropic.messages.parse(
    {
      model: "claude-sonnet-5",
      max_tokens: GREETING_MAX_TOKENS,
      thinking: { type: "disabled" },
      system: GREETING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(context) }],
      output_config: {
        format: zodOutputFormat(dailyGreetingContentSchema),
      },
    },
    options?.timeoutMs ? { timeout: options.timeoutMs } : undefined
  );

  if (!response.parsed_output) {
    throw new Error("Resposta da IA não pôde ser interpretada como saudação válida.");
  }

  return response.parsed_output;
}
