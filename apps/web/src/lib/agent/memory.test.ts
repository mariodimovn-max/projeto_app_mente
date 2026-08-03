import { describe, expect, it } from "vitest";
import { CRISIS_RESPONSE_MESSAGE } from "./crisis";
import {
  buildConversationMessages,
  buildMemoryContext,
  buildSessionOpeningContext,
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

describe("buildSessionOpeningContext", () => {
  const DEFAULT_CURRENT_SESSION_RESULT = { data: { created_at: "2026-07-25T00:00:00Z" }, error: null };
  const DEFAULT_PATTERNS_RESULT = {
    data: { themes: {}, emotions: {}, triggers: {}, session_count: 0 },
    error: null,
  };

  function createOpeningStub(options: {
    sessionsResult: { data: unknown; error: unknown };
    currentSessionResult?: { data: unknown; error: unknown };
    messagesResult?: { data: unknown; error: unknown };
    patternsResult?: { data: unknown; error: unknown };
  }) {
    const calls: Record<string, unknown[]> = {};

    // supabase.from("sessions").select("created_at").eq("id", currentSessionId).single()
    const currentSessionBuilder: Record<string, unknown> = {
      eq: (...args: unknown[]) => {
        calls.currentSessionEq = args;
        return currentSessionBuilder;
      },
      single: async () => options.currentSessionResult ?? DEFAULT_CURRENT_SESSION_RESULT,
    };

    // supabase.from("sessions").select("id").eq(...).neq(...).lt(...).order(...).limit(1).returns()
    const previousSessionsBuilder: Record<string, unknown> = {
      eq: (...args: unknown[]) => {
        calls.sessionsEq = args;
        return previousSessionsBuilder;
      },
      neq: (...args: unknown[]) => {
        calls.sessionsNeq = args;
        return previousSessionsBuilder;
      },
      lt: (...args: unknown[]) => {
        calls.sessionsLt = args;
        return previousSessionsBuilder;
      },
      order: (...args: unknown[]) => {
        calls.sessionsOrder = args;
        return previousSessionsBuilder;
      },
      limit: (...args: unknown[]) => {
        calls.sessionsLimit = args;
        return previousSessionsBuilder;
      },
      returns: () => previousSessionsBuilder,
      then: (resolve: (value: typeof options.sessionsResult) => unknown) =>
        resolve(options.sessionsResult),
    };

    const sessionsBuilder: Record<string, unknown> = {
      select: (...args: unknown[]) => {
        calls.sessionsSelect = [...((calls.sessionsSelect as unknown[][] | undefined) ?? []), args];
        return args[0] === "created_at" ? currentSessionBuilder : previousSessionsBuilder;
      },
    };

    const messagesBuilder: Record<string, unknown> = {
      select: (...args: unknown[]) => {
        calls.messagesSelect = args;
        return messagesBuilder;
      },
      eq: (...args: unknown[]) => {
        calls.messagesEq = args;
        return messagesBuilder;
      },
      order: (...args: unknown[]) => {
        calls.messagesOrder = args;
        return messagesBuilder;
      },
      returns: () => messagesBuilder,
      then: (resolve: (value: typeof options.messagesResult) => unknown) =>
        resolve(options.messagesResult ?? { data: [], error: null }),
    };

    const patternsBuilder: Record<string, unknown> = {
      select: () => patternsBuilder,
      eq: () => patternsBuilder,
      maybeSingle: async () => options.patternsResult ?? DEFAULT_PATTERNS_RESULT,
    };

    const from = (table: string) => {
      calls.from = [...((calls.from as string[]) ?? []), table];
      if (table === "sessions") return sessionsBuilder;
      if (table === "messages") return messagesBuilder;
      if (table === "user_patterns") return patternsBuilder;
      throw new Error(`Tabela inesperada: ${table}`);
    };

    return { supabase: { from }, calls };
  }

  it("retorna isFirstSession=true e não consulta mensagens quando não há sessão anterior", async () => {
    const { supabase, calls } = createOpeningStub({ sessionsResult: { data: [], error: null } });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toEqual({
      isFirstSession: true,
      previousOpeningPhrase: null,
      responsePattern: null,
      topThemes: [],
    });
    expect(calls.messagesSelect).toBeUndefined();
  });

  it("busca o created_at da sessão atual e filtra sessions anteriores por created_at estritamente menor, mais recente primeiro", async () => {
    const { supabase, calls } = createOpeningStub({
      sessionsResult: { data: [], error: null },
      currentSessionResult: { data: { created_at: "2026-07-25T12:00:00Z" }, error: null },
    });

    await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect((calls.from as string[]).filter((table) => table === "sessions")).toHaveLength(2);
    expect(calls.from).toContain("user_patterns");
    expect(calls.currentSessionEq).toEqual(["id", "session-atual"]);
    expect(calls.sessionsEq).toEqual(["user_id", "user-1"]);
    expect(calls.sessionsNeq).toEqual(["id", "session-atual"]);
    expect(calls.sessionsLt).toEqual(["created_at", "2026-07-25T12:00:00Z"]);
    expect(calls.sessionsOrder).toEqual(["created_at", { ascending: false }]);
    expect(calls.sessionsLimit).toEqual([1]);
  });

  it("identifica a frase de abertura anterior e padrão de resposta longo quando as mensagens do usuário são extensas", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [
          { role: "assistant", content: "Como você se sente hoje?", created_at: "2026-07-20T10:00:00Z" },
          {
            role: "user",
            content:
              "Hoje eu me senti bastante ansioso durante a manhã porque tinha uma reunião importante e não sabia como as pessoas reagiriam ao que eu ia apresentar.",
            created_at: "2026-07-20T10:01:00Z",
          },
        ],
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toEqual({
      isFirstSession: false,
      previousOpeningPhrase: "Como você se sente hoje?",
      responsePattern: "longo",
      topThemes: [],
    });
  });

  it("identifica padrão de resposta curto quando as mensagens do usuário são breves", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [
          { role: "assistant", content: "Como você se sente hoje?", created_at: "2026-07-20T10:00:00Z" },
          { role: "user", content: "Bem.", created_at: "2026-07-20T10:01:00Z" },
          { role: "assistant", content: "Bem como?", created_at: "2026-07-20T10:01:30Z" },
          { role: "user", content: "Só bem.", created_at: "2026-07-20T10:02:00Z" },
        ],
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result.responsePattern).toBe("curto");
    expect(result.previousOpeningPhrase).toBe("Como você se sente hoje?");
  });

  it("retorna responsePattern null quando a sessão anterior não tem mensagens do usuário", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [{ role: "assistant", content: "Olá.", created_at: "2026-07-20T10:00:00Z" }],
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result.responsePattern).toBeNull();
  });

  it("nunca usa a resposta fixa do fluxo de crise como frase de abertura anterior", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [
          { role: "user", content: "Eu quero morrer, não aguento mais.", created_at: "2026-07-20T10:00:00Z" },
          { role: "assistant", content: CRISIS_RESPONSE_MESSAGE, created_at: "2026-07-20T10:00:05Z" },
          {
            role: "assistant",
            content: "O que você sentiu quando percebeu isso?",
            created_at: "2026-07-20T10:05:00Z",
          },
        ],
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result.previousOpeningPhrase).toBe("O que você sentiu quando percebeu isso?");
  });

  it("retorna previousOpeningPhrase null quando a única resposta do assistente foi a de crise", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [
          { role: "user", content: "Eu quero morrer, não aguento mais.", created_at: "2026-07-20T10:00:00Z" },
          { role: "assistant", content: CRISIS_RESPONSE_MESSAGE, created_at: "2026-07-20T10:00:05Z" },
        ],
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result.previousOpeningPhrase).toBeNull();
  });

  it("inclui os temas mais recorrentes de user_patterns, mesmo sem sessão anterior", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [], error: null },
      patternsResult: {
        data: { themes: { sono: 5, rotina: 4, trabalho: 3, família: 2 }, emotions: {}, triggers: {}, session_count: 4 },
        error: null,
      },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result.topThemes).toEqual(["sono", "rotina", "trabalho"]);
  });

  it("ainda retorna previousOpeningPhrase/responsePattern quando a consulta de user_patterns falha", async () => {
    // Achado pós-deploy: getUserPatterns e fetchPreviousSessionId rodam em paralelo — sem um
    // catch próprio na consulta de patterns, uma falha nela (ex.: tabela indisponível) derrubava
    // todo o Promise.all e descartava também o resto do contexto de abertura, que não depende
    // de user_patterns.
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: {
        data: [
          { role: "assistant", content: "Como você se sente hoje?", created_at: "2026-07-20T10:00:00Z" },
          { role: "user", content: "Bem.", created_at: "2026-07-20T10:01:00Z" },
        ],
        error: null,
      },
      patternsResult: { data: null, error: new Error("tabela indisponível") },
    });

    const result = await buildSessionOpeningContext(
      supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
      "user-1",
      "session-atual"
    );

    expect(result).toEqual({
      isFirstSession: false,
      previousOpeningPhrase: "Como você se sente hoje?",
      responsePattern: "curto",
      topThemes: [],
    });
  });

  it("propaga o erro quando a consulta do created_at da sessão atual falha", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [], error: null },
      currentSessionResult: { data: null, error: new Error("boom") },
    });

    await expect(
      buildSessionOpeningContext(
        supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
        "user-1",
        "session-atual"
      )
    ).rejects.toThrow("boom");
  });

  it("propaga o erro quando a consulta de sessões anteriores falha", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: null, error: new Error("boom") },
    });

    await expect(
      buildSessionOpeningContext(
        supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
        "user-1",
        "session-atual"
      )
    ).rejects.toThrow("boom");
  });

  it("propaga o erro quando a consulta de mensagens da sessão anterior falha", async () => {
    const { supabase } = createOpeningStub({
      sessionsResult: { data: [{ id: "session-anterior" }], error: null },
      messagesResult: { data: null, error: new Error("boom") },
    });

    await expect(
      buildSessionOpeningContext(
        supabase as unknown as Parameters<typeof buildSessionOpeningContext>[0],
        "user-1",
        "session-atual"
      )
    ).rejects.toThrow("boom");
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
