import { describe, expect, it } from "vitest";
import { countUserMessagesToday, DAILY_MESSAGE_LIMIT, hasReachedDailyMessageLimit } from "./rate-limit";

function createSupabaseStub(result: { count: number | null; error: unknown }) {
  const calls: Record<string, unknown[]> = {};
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      calls.select = args;
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq = [...(calls.eq ?? []), args];
      return builder;
    },
    gte: (...args: unknown[]) => {
      calls.gte = args;
      return builder;
    },
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };

  const from = (table: string) => {
    calls.from = [table];
    return builder;
  };

  return { supabase: { from }, calls };
}

describe("countUserMessagesToday", () => {
  it("conta mensagens de usuário do dia corrente, filtrando por user_id via join com sessions", async () => {
    const { supabase, calls } = createSupabaseStub({ count: 7, error: null });

    const result = await countUserMessagesToday(
      supabase as unknown as Parameters<typeof countUserMessagesToday>[0],
      "user-1"
    );

    expect(result).toBe(7);
    expect(calls.from).toEqual(["messages"]);
    expect(calls.eq).toContainEqual(["sessions.user_id", "user-1"]);
    expect(calls.eq).toContainEqual(["role", "user"]);
    expect(calls.gte?.[0]).toBe("created_at");
  });

  it("retorna 0 quando a contagem vem nula", async () => {
    const { supabase } = createSupabaseStub({ count: null, error: null });

    const result = await countUserMessagesToday(
      supabase as unknown as Parameters<typeof countUserMessagesToday>[0],
      "user-1"
    );

    expect(result).toBe(0);
  });

  it("propaga o erro quando a consulta ao Supabase falha", async () => {
    const { supabase } = createSupabaseStub({ count: null, error: new Error("boom") });

    await expect(
      countUserMessagesToday(
        supabase as unknown as Parameters<typeof countUserMessagesToday>[0],
        "user-1"
      )
    ).rejects.toThrow("boom");
  });
});

describe("hasReachedDailyMessageLimit", () => {
  it("retorna false quando a contagem está abaixo do limite", async () => {
    const { supabase } = createSupabaseStub({ count: DAILY_MESSAGE_LIMIT - 1, error: null });

    const result = await hasReachedDailyMessageLimit(
      supabase as unknown as Parameters<typeof hasReachedDailyMessageLimit>[0],
      "user-1"
    );

    expect(result).toBe(false);
  });

  it("retorna true quando a contagem atinge exatamente o limite", async () => {
    const { supabase } = createSupabaseStub({ count: DAILY_MESSAGE_LIMIT, error: null });

    const result = await hasReachedDailyMessageLimit(
      supabase as unknown as Parameters<typeof hasReachedDailyMessageLimit>[0],
      "user-1"
    );

    expect(result).toBe(true);
  });

  it("retorna true quando a contagem ultrapassa o limite", async () => {
    const { supabase } = createSupabaseStub({ count: DAILY_MESSAGE_LIMIT + 5, error: null });

    const result = await hasReachedDailyMessageLimit(
      supabase as unknown as Parameters<typeof hasReachedDailyMessageLimit>[0],
      "user-1"
    );

    expect(result).toBe(true);
  });
});
