import { describe, expect, it, vi } from "vitest";
import { generateSessionSynthesis } from "./synthesis";

function createAnthropicStub(parsed_output: unknown) {
  const parse = vi.fn().mockResolvedValue({ parsed_output });
  return { messages: { parse } } as unknown as Parameters<typeof generateSessionSynthesis>[0];
}

const conversation = [
  { role: "user" as const, content: "Tenho tido dificuldade para dormir." },
  { role: "assistant" as const, content: "O que você acha que está afetando seu sono?" },
];

describe("generateSessionSynthesis", () => {
  it("chama a Anthropic API com o modelo, thinking desabilitado e o schema estruturado, retornando o conteúdo interpretado", async () => {
    const content = {
      title: "Hoje o sono virou espelho da sua rotina.",
      themes: ["Sono", "Rotina"],
      explored: "A dificuldade para dormir e sua rotina noturna.",
      patterns: ["Pequenas vitórias recentes parecem reduzir a ansiedade."],
      openQuestion: "O que mudaria se você desse à sua rotina noturna a mesma atenção que dá ao dia?",
      emotions: ["ansiedade"],
      triggers: ["rotina noturna irregular"],
    };
    const anthropic = createAnthropicStub(content);

    const result = await generateSessionSynthesis(anthropic, conversation);

    expect(result).toEqual(content);
    const call = vi.mocked(anthropic.messages.parse).mock.calls[0]![0];
    expect(call.model).toBe("claude-sonnet-5");
    expect(call.thinking).toEqual({ type: "disabled" });
    expect(call.messages.slice(0, conversation.length)).toEqual(conversation);
    expect(call.output_config?.format).toBeDefined();
  });

  it("sempre termina a lista de mensagens com uma mensagem do usuário, mesmo quando a conversa real termina com a resposta do agente", async () => {
    // Modelos atuais rejeitam com 400 ("assistant message prefill") uma conversa cuja
    // última mensagem é do assistente — o histórico real quase sempre termina assim.
    const anthropic = createAnthropicStub({
      title: "...",
      themes: [],
      explored: "...",
      patterns: ["..."],
      openQuestion: "...?",
      emotions: ["..."],
      triggers: [],
    });

    await generateSessionSynthesis(anthropic, conversation);

    const call = vi.mocked(anthropic.messages.parse).mock.calls[0]![0];
    const lastMessage = call.messages[call.messages.length - 1];
    expect(lastMessage?.role).toBe("user");
  });

  it("lança erro quando a IA não retorna um conteúdo interpretável", async () => {
    const anthropic = createAnthropicStub(null);

    await expect(generateSessionSynthesis(anthropic, conversation)).rejects.toThrow(
      "Resposta da IA não pôde ser interpretada como síntese válida."
    );
  });
});
