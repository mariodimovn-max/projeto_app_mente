import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import { analyzeEmotionalState } from "../apps/web/src/lib/agent/emotional-state";
import { TONE_MAP, buildSystemPrompt, resolveMaxTokens } from "../apps/web/src/lib/agent/prompts";

const client = new Anthropic();

async function chat(userMessage: string): Promise<void> {
  const { state, intensity } = analyzeEmotionalState(userMessage);
  const toneConfig = TONE_MAP[state];

  console.log(`\n[Estado detectado: ${toneConfig.description} | Intensidade: ${intensity}]\n`);

  const systemPrompt = buildSystemPrompt(state, intensity);
  const maxTokens = resolveMaxTokens(state, intensity);

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  process.stdout.write("Agente: ");

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }

  const final = await stream.finalMessage();
  console.log(`\n\n[Tokens usados: ${final.usage.input_tokens} entrada, ${final.usage.output_tokens} saída]\n`);
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Erro: defina a variável de ambiente ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const arg = process.argv[2];
  if (arg) {
    await chat(arg);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=== Agente Diário Digital — Teste ===");
  console.log("Digite sua mensagem (ou 'sair' para encerrar)\n");

  const ask = (): void => {
    rl.question("Você: ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed.toLowerCase() === "sair") {
        rl.close();
        return;
      }
      try {
        await chat(trimmed);
      } catch (error) {
        console.error("\n[Erro ao chamar o agente]:", error instanceof Error ? error.message : error);
      }
      ask();
    });
  };

  ask();
}

main().catch(console.error);
