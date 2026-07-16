import { describe, expect, it } from "vitest";
import { buildConversationMessages } from "./memory";

function createSupabaseStub(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[]> = {};
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      calls.select = args;
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq = args;
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.order = args;
      return builder;
    },
    returns: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };

  const from = (table: string) => {
    calls.from = [table];
    return builder;
  };

  return { supabase: { from }, calls };
}

describe("buildConversationMessages", () => {
  it("busca as mensagens da sessão ordenadas por created_at e mapeia para o formato da Anthropic API", async () => {
    const { supabase, calls } = createSupabaseStub({
      data: [
        { role: "user", content: "Olá", created_at: "2026-07-16T10:00:00Z" },
        { role: "assistant", content: "Oi, como você está?", created_at: "2026-07-16T10:00:05Z" },
      ],
      error: null,
    });

    const result = await buildConversationMessages(
      supabase as unknown as Parameters<typeof buildConversationMessages>[0],
      "session-123"
    );

    expect(result).toEqual([
      { role: "user", content: "Olá" },
      { role: "assistant", content: "Oi, como você está?" },
    ]);
    expect(calls.from).toEqual(["messages"]);
    expect(calls.eq).toEqual(["session_id", "session-123"]);
    expect(calls.order).toEqual(["created_at", { ascending: true }]);
  });

  it("retorna lista vazia quando a sessão ainda não tem mensagens", async () => {
    const { supabase } = createSupabaseStub({ data: null, error: null });

    const result = await buildConversationMessages(
      supabase as unknown as Parameters<typeof buildConversationMessages>[0],
      "session-123"
    );

    expect(result).toEqual([]);
  });

  it("propaga o erro quando a consulta ao Supabase falha", async () => {
    const { supabase } = createSupabaseStub({ data: null, error: new Error("boom") });

    await expect(
      buildConversationMessages(
        supabase as unknown as Parameters<typeof buildConversationMessages>[0],
        "session-123"
      )
    ).rejects.toThrow("boom");
  });
});
