import { describe, expect, it } from "vitest";
import { getSessionDetail, listSessionHistory } from "./sessions";

const USER_ID = "user-1";
const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function makeListBuilder(result: { data: unknown; error: unknown }) {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      calls.push({ method: "select", args });
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return builder;
    },
    in: (...args: unknown[]) => {
      calls.push({ method: "in", args });
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.push({ method: "order", args });
      return builder;
    },
    returns: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return { builder, calls };
}

function makeSingleBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    maybeSingle: async () => result,
  };
  return builder;
}

describe("listSessionHistory", () => {
  it("junta sessões com suas sínteses, marcando síntese ausente quando não há linha correspondente", async () => {
    const { builder: sessionsBuilder } = makeListBuilder({
      data: [
        { id: "session-a", created_at: "2026-07-25T10:00:00Z", marked: true },
        { id: "session-b", created_at: "2026-07-20T10:00:00Z", marked: false },
      ],
      error: null,
    });
    const { builder: synthesesBuilder } = makeListBuilder({
      data: [{ session_id: "session-a", title: "Noite de pensamento", themes: ["sono", "rotina"] }],
      error: null,
    });

    const supabase = {
      from: (table: string) => {
        if (table === "sessions") return sessionsBuilder;
        if (table === "session_syntheses") return synthesesBuilder;
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await listSessionHistory(supabase as never, USER_ID);

    expect(result).toEqual([
      {
        id: "session-a",
        createdAt: "2026-07-25T10:00:00Z",
        title: "Noite de pensamento",
        themes: ["sono", "rotina"],
        hasSynthesis: true,
        marked: true,
      },
      {
        id: "session-b",
        createdAt: "2026-07-20T10:00:00Z",
        title: null,
        themes: [],
        hasSynthesis: false,
        marked: false,
      },
    ]);
  });

  it("retorna lista vazia sem consultar sínteses quando o usuário não tem nenhuma sessão", async () => {
    const { builder: sessionsBuilder } = makeListBuilder({ data: [], error: null });
    let synthesesQueried = false;

    const supabase = {
      from: (table: string) => {
        if (table === "sessions") return sessionsBuilder;
        if (table === "session_syntheses") {
          synthesesQueried = true;
          return makeListBuilder({ data: [], error: null }).builder;
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await listSessionHistory(supabase as never, USER_ID);

    expect(result).toEqual([]);
    expect(synthesesQueried).toBe(false);
  });

  it("propaga o erro quando a consulta de sessões falha", async () => {
    const { builder: sessionsBuilder } = makeListBuilder({
      data: null,
      error: new Error("db down"),
    });
    const supabase = {
      from: (table: string) => {
        if (table === "sessions") return sessionsBuilder;
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    await expect(listSessionHistory(supabase as never, USER_ID)).rejects.toThrow("db down");
  });
});

describe("getSessionDetail", () => {
  const SESSION_ROW = { id: SESSION_ID, created_at: "2026-07-25T10:00:00Z" };
  const MESSAGES = {
    data: [
      { id: "m1", role: "user", content: "Tenho dormido mal.", created_at: "2026-07-25T10:00:00Z" },
      { id: "m2", role: "assistant", content: "O que mudou?", created_at: "2026-07-25T10:05:00Z" },
    ],
    error: null,
  };

  function createSupabaseStub(options: {
    session: { data: unknown; error: unknown };
    messages?: { data: unknown; error: unknown };
    synthesis?: { data: unknown; error: unknown };
  }) {
    const sessionsBuilder = makeSingleBuilder(options.session);
    const { builder: messagesBuilder } = makeListBuilder(
      options.messages ?? { data: [], error: null }
    );
    const synthesisBuilder = makeSingleBuilder(options.synthesis ?? { data: null, error: null });

    return {
      from: (table: string) => {
        if (table === "sessions") return sessionsBuilder;
        if (table === "messages") return messagesBuilder;
        if (table === "session_syntheses") return synthesisBuilder;
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };
  }

  it("retorna null quando a sessão não existe ou não pertence ao usuário", async () => {
    const supabase = createSupabaseStub({ session: { data: null, error: null } });

    const result = await getSessionDetail(supabase as never, USER_ID, SESSION_ID);

    expect(result).toBeNull();
  });

  it("propaga o erro quando a consulta da sessão falha", async () => {
    const supabase = createSupabaseStub({ session: { data: null, error: new Error("boom") } });

    await expect(getSessionDetail(supabase as never, USER_ID, SESSION_ID)).rejects.toThrow("boom");
  });

  it("retorna as mensagens mapeadas e síntese null quando a sessão não foi encerrada", async () => {
    const supabase = createSupabaseStub({
      session: { data: SESSION_ROW, error: null },
      messages: MESSAGES,
    });

    const result = await getSessionDetail(supabase as never, USER_ID, SESSION_ID);

    expect(result).toEqual({
      id: SESSION_ID,
      createdAt: SESSION_ROW.created_at,
      messages: [
        { id: "m1", role: "user", content: "Tenho dormido mal.", createdAt: "2026-07-25T10:00:00Z" },
        { id: "m2", role: "assistant", content: "O que mudou?", createdAt: "2026-07-25T10:05:00Z" },
      ],
      synthesis: null,
    });
  });

  it("calcula duração e número de trocas a partir das mensagens e da síntese", async () => {
    const supabase = createSupabaseStub({
      session: { data: SESSION_ROW, error: null },
      messages: MESSAGES,
      synthesis: {
        data: {
          id: "synthesis-1",
          title: "Título",
          themes: ["sono"],
          explored: "O sono e a rotina.",
          patterns: ["Padrão"],
          open_question: "E agora?",
          depth: 5,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
    });

    const result = await getSessionDetail(supabase as never, USER_ID, SESSION_ID);

    expect(result?.synthesis).toEqual({
      id: "synthesis-1",
      title: "Título",
      themes: ["sono"],
      explored: "O sono e a rotina.",
      patterns: ["Padrão"],
      openQuestion: "E agora?",
      depth: 5,
      durationMinutes: 23,
      exchangeCount: 1,
      createdAt: "2026-07-25T10:23:00Z",
    });
  });
});
