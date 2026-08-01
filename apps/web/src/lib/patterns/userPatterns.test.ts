import { describe, expect, it } from "vitest";
import { getUserPatterns, updateUserPatterns } from "./userPatterns";

function createSupabaseStub(options: {
  existing: { data: unknown; error: unknown };
  upsertError?: unknown;
}) {
  const upsertPayloads: unknown[] = [];
  const upsertOptions: unknown[] = [];

  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => options.existing,
    upsert: (payload: unknown, upsertOpts?: unknown) => {
      upsertPayloads.push(payload);
      upsertOptions.push(upsertOpts);
      return { error: options.upsertError ?? null };
    },
  };

  const from = (table: string) => {
    if (table !== "user_patterns") {
      throw new Error(`Tabela inesperada: ${table}`);
    }
    return builder;
  };

  return { supabase: { from }, upsertPayloads, upsertOptions };
}

type SupabaseStub = Parameters<typeof updateUserPatterns>[0];

describe("updateUserPatterns", () => {
  it("cria o agregado com contagem 1 por rótulo e sinaliza primeira análise quando não existe linha prévia", async () => {
    const { supabase, upsertPayloads, upsertOptions } = createSupabaseStub({
      existing: { data: null, error: null },
    });

    const result = await updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
      themes: ["Sono", "Rotina"],
      emotions: ["ansiedade"],
      triggers: [],
    });

    expect(result).toEqual({ isFirstAnalysis: true });
    expect(upsertPayloads[0]).toEqual({
      user_id: "user-1",
      themes: { sono: 1, rotina: 1 },
      emotions: { ansiedade: 1 },
      triggers: {},
      session_count: 1,
      updated_at: expect.any(String),
    });
    expect(upsertOptions[0]).toEqual({ onConflict: "user_id" });
  });

  it("incrementa contagens existentes e soma session_count, sem sinalizar primeira análise", async () => {
    const { supabase, upsertPayloads } = createSupabaseStub({
      existing: {
        data: {
          themes: { sono: 2, rotina: 1 },
          emotions: { ansiedade: 3 },
          triggers: { "conflito no trabalho": 1 },
          session_count: 4,
        },
        error: null,
      },
    });

    const result = await updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
      themes: ["Sono"],
      emotions: ["alívio"],
      triggers: ["conflito no trabalho"],
    });

    expect(result).toEqual({ isFirstAnalysis: false });
    expect(upsertPayloads[0]).toEqual({
      user_id: "user-1",
      themes: { sono: 3, rotina: 1 },
      emotions: { ansiedade: 3, "alívio": 1 },
      triggers: { "conflito no trabalho": 2 },
      session_count: 5,
      updated_at: expect.any(String),
    });
  });

  it("normaliza rótulos por trim + lowercase antes de contar, unindo variações de capitalização", async () => {
    const { supabase, upsertPayloads } = createSupabaseStub({
      existing: {
        data: { themes: { sono: 1 }, emotions: {}, triggers: {}, session_count: 1 },
        error: null,
      },
    });

    await updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
      themes: [" Sono "],
      emotions: [],
      triggers: [],
    });

    expect(upsertPayloads[0]).toMatchObject({ themes: { sono: 2 } });
  });

  it("deduplica rótulos repetidos dentro da mesma sessão antes de contar, em vez de somar um por ocorrência", async () => {
    const { supabase, upsertPayloads } = createSupabaseStub({
      existing: { data: null, error: null },
    });

    await updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
      themes: ["Sono", "sono", " SONO "],
      emotions: [],
      triggers: [],
    });

    expect(upsertPayloads[0]).toMatchObject({ themes: { sono: 1 } });
  });

  it("propaga o erro quando a leitura do agregado existente falha", async () => {
    const { supabase } = createSupabaseStub({
      existing: { data: null, error: new Error("boom") },
    });

    await expect(
      updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
        themes: [],
        emotions: [],
        triggers: [],
      })
    ).rejects.toThrow("boom");
  });

  it("propaga o erro quando o upsert do agregado falha", async () => {
    const { supabase } = createSupabaseStub({
      existing: { data: null, error: null },
      upsertError: new Error("upsert failed"),
    });

    await expect(
      updateUserPatterns(supabase as unknown as SupabaseStub, "user-1", {
        themes: [],
        emotions: [],
        triggers: [],
      })
    ).rejects.toThrow("upsert failed");
  });
});

function createReadOnlySupabaseStub(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[]> = {};
  const builder = {
    select: (...args: unknown[]) => {
      calls.select = args;
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq = args;
      return builder;
    },
    maybeSingle: async () => result,
  };

  const from = (table: string) => {
    if (table !== "user_patterns") {
      throw new Error(`Tabela inesperada: ${table}`);
    }
    calls.from = [table];
    return builder;
  };

  return { supabase: { from }, calls };
}

type ReadOnlySupabaseStub = Parameters<typeof getUserPatterns>[0];

describe("getUserPatterns", () => {
  it("retorna o agregado normalizado quando existe uma linha para o usuário", async () => {
    const { supabase, calls } = createReadOnlySupabaseStub({
      data: {
        themes: { sono: 3, rotina: 1 },
        emotions: { ansiedade: 2 },
        triggers: {},
        session_count: 4,
      },
      error: null,
    });

    const result = await getUserPatterns(supabase as unknown as ReadOnlySupabaseStub, "user-1");

    expect(result).toEqual({
      themes: { sono: 3, rotina: 1 },
      emotions: { ansiedade: 2 },
      triggers: {},
      sessionCount: 4,
    });
    expect(calls.eq).toEqual(["user_id", "user-1"]);
  });

  it("retorna null quando o usuário ainda não tem nenhum agregado", async () => {
    const { supabase } = createReadOnlySupabaseStub({ data: null, error: null });

    const result = await getUserPatterns(supabase as unknown as ReadOnlySupabaseStub, "user-1");

    expect(result).toBeNull();
  });

  it("propaga o erro quando a consulta falha", async () => {
    const { supabase } = createReadOnlySupabaseStub({ data: null, error: new Error("boom") });

    await expect(
      getUserPatterns(supabase as unknown as ReadOnlySupabaseStub, "user-1")
    ).rejects.toThrow("boom");
  });
});
