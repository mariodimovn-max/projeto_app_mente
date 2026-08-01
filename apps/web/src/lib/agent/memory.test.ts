import { describe, expect, it } from "vitest";
import {
  buildConversationMessages,
  buildMemoryContext,
  fetchRecentSyntheses,
  formatMemoryContext,
} from "./memory";

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

function createSyntheseStub(result: { data: unknown; error: unknown }) {
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
    neq: (...args: unknown[]) => {
      calls.neq = args;
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.order = args;
      return builder;
    },
    limit: (...args: unknown[]) => {
      calls.limit = args;
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

describe("fetchRecentSyntheses", () => {
  it("busca as sínteses de sessões anteriores do usuário, mais recente primeiro, excluindo a sessão atual", async () => {
    const { supabase, calls } = createSyntheseStub({
      data: [
        {
          title: "Título recente",
          themes: ["sono"],
          explored: "Falamos sobre rotina.",
          open_question: "O que rotina significa pra você?",
          created_at: "2026-07-30T10:00:00Z",
        },
      ],
      error: null,
    });

    const result = await fetchRecentSyntheses(
      supabase as unknown as Parameters<typeof fetchRecentSyntheses>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toEqual([
      {
        title: "Título recente",
        themes: ["sono"],
        explored: "Falamos sobre rotina.",
        openQuestion: "O que rotina significa pra você?",
        createdAt: "2026-07-30T10:00:00Z",
      },
    ]);
    expect(calls.from).toEqual(["session_syntheses"]);
    expect(calls.eq).toEqual(["sessions.user_id", "user-1"]);
    expect(calls.neq).toEqual(["session_id", "session-atual"]);
    expect(calls.order).toEqual(["created_at", { ascending: false }]);
    expect(calls.limit).toEqual([5]);
  });

  it("retorna lista vazia quando o usuário ainda não tem sessões anteriores sintetizadas", async () => {
    const { supabase } = createSyntheseStub({ data: null, error: null });

    const result = await fetchRecentSyntheses(
      supabase as unknown as Parameters<typeof fetchRecentSyntheses>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toEqual([]);
  });

  it("propaga o erro quando a consulta ao Supabase falha", async () => {
    const { supabase } = createSyntheseStub({ data: null, error: new Error("boom") });

    await expect(
      fetchRecentSyntheses(
        supabase as unknown as Parameters<typeof fetchRecentSyntheses>[0],
        "user-1",
        "session-atual"
      )
    ).rejects.toThrow("boom");
  });
});

describe("formatMemoryContext", () => {
  it("retorna null quando não há sínteses nem padrões acumulados", () => {
    expect(formatMemoryContext([], null)).toBeNull();
    expect(
      formatMemoryContext([], { themes: {}, emotions: {}, triggers: {}, sessionCount: 0 })
    ).toBeNull();
  });

  it("inclui as sínteses recentes com data, título, temas e pergunta em aberto", () => {
    const result = formatMemoryContext(
      [
        {
          title: "Hoje você tocou no medo de não dar conta",
          themes: ["trabalho", "medo"],
          explored: "Explorou a origem da cobrança.",
          openQuestion: "De quem é essa conta?",
          createdAt: "2026-07-28T15:30:00Z",
        },
      ],
      null
    );

    expect(result).toContain("MEMÓRIA DE SESSÕES ANTERIORES");
    expect(result).toContain("2026-07-28");
    expect(result).toContain("Hoje você tocou no medo de não dar conta");
    expect(result).toContain("trabalho, medo");
    expect(result).toContain("De quem é essa conta?");
  });

  it("inclui os padrões mais recorrentes, limitados aos 5 primeiros por categoria, ordenados por contagem", () => {
    const result = formatMemoryContext([], {
      themes: { sono: 5, rotina: 4, trabalho: 3, família: 2, saúde: 1, lazer: 1 },
      emotions: { ansiedade: 3 },
      triggers: {},
      sessionCount: 6,
    });

    expect(result).toContain("6 sessão(ões) sintetizada(s)");
    expect(result).toContain("Temas mais recorrentes: sono, rotina, trabalho, família, saúde");
    expect(result).not.toContain("lazer");
    expect(result).toContain("Emoções mais recorrentes: ansiedade");
    expect(result).not.toContain("Gatilhos mais recorrentes");
  });

  it("não inclui o histórico bruto de mensagens — apenas resumos e agregados", () => {
    const result = formatMemoryContext(
      [
        {
          title: "T",
          themes: ["x"],
          explored: "resumo curto",
          openQuestion: "pergunta",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ],
      { themes: { x: 1 }, emotions: {}, triggers: {}, sessionCount: 1 }
    );

    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThan(2000);
  });
});

describe("buildMemoryContext", () => {
  function createCombinedStub(options: {
    synthesesResult: { data: unknown; error: unknown };
    patternsResult: { data: unknown; error: unknown };
  }) {
    const synthesesBuilder: Record<string, unknown> = {
      select: () => synthesesBuilder,
      eq: () => synthesesBuilder,
      neq: () => synthesesBuilder,
      order: () => synthesesBuilder,
      limit: () => synthesesBuilder,
      returns: () => synthesesBuilder,
      then: (resolve: (value: typeof options.synthesesResult) => unknown) =>
        resolve(options.synthesesResult),
    };

    const patternsBuilder: Record<string, unknown> = {
      select: () => patternsBuilder,
      eq: () => patternsBuilder,
      maybeSingle: async () => options.patternsResult,
    };

    const from = (table: string) => {
      if (table === "session_syntheses") return synthesesBuilder;
      if (table === "user_patterns") return patternsBuilder;
      throw new Error(`Tabela inesperada: ${table}`);
    };

    return { from };
  }

  it("combina sínteses recentes e o agregado de padrões num único bloco de memória", async () => {
    const supabase = createCombinedStub({
      synthesesResult: {
        data: [
          {
            title: "Título",
            themes: ["sono"],
            explored: "resumo",
            open_question: "pergunta?",
            created_at: "2026-07-29T00:00:00Z",
          },
        ],
        error: null,
      },
      patternsResult: {
        data: { themes: { sono: 2 }, emotions: {}, triggers: {}, session_count: 2 },
        error: null,
      },
    });

    const result = await buildMemoryContext(
      supabase as unknown as Parameters<typeof buildMemoryContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toContain("Título");
    expect(result).toContain("Temas mais recorrentes: sono");
  });

  it("retorna null quando o usuário está na primeira sessão, sem sínteses ou padrões anteriores", async () => {
    const supabase = createCombinedStub({
      synthesesResult: { data: [], error: null },
      patternsResult: { data: null, error: null },
    });

    const result = await buildMemoryContext(
      supabase as unknown as Parameters<typeof buildMemoryContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toBeNull();
  });
});
