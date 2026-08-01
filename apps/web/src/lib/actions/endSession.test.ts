import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, generateSessionSynthesisMock, getAnthropicClientMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  generateSessionSynthesisMock: vi.fn(),
  getAnthropicClientMock: vi.fn(() => ({ fakeClient: true })),
}));

function createSupabaseStub(options: {
  session: { data: unknown; error: unknown };
  messages: { data: unknown; error: unknown };
  insert: { data: unknown; error: unknown };
  recoverySelect?: { data: unknown; error: unknown };
  userPatterns?: { data: unknown; error: unknown };
  userPatternsUpsertError?: unknown;
}) {
  const sessionsBuilder = {
    select: () => sessionsBuilder,
    eq: () => sessionsBuilder,
    maybeSingle: async () => options.session,
  };

  const messagesBuilder = {
    select: () => messagesBuilder,
    eq: () => messagesBuilder,
    order: () => messagesBuilder,
    returns: () => messagesBuilder,
    then: (resolve: (value: typeof options.messages) => unknown) => resolve(options.messages),
  };

  // Diferencia a cadeia de insert (.insert().select().single()) da cadeia de
  // recuperação em caso de conflito de unicidade (.select().eq(...).single()) —
  // ambas passam pelo mesmo builder, mas só a segunda chama `.eq()`.
  const insertedPayloads: unknown[] = [];
  let isRecoveryQuery = false;
  const synthesesBuilder = {
    insert: (payload: unknown) => {
      insertedPayloads.push(payload);
      isRecoveryQuery = false;
      return synthesesBuilder;
    },
    select: () => synthesesBuilder,
    eq: () => {
      isRecoveryQuery = true;
      return synthesesBuilder;
    },
    single: async () => (isRecoveryQuery ? (options.recoverySelect ?? { data: null, error: null }) : options.insert),
  };

  const userPatternsUpsertPayloads: unknown[] = [];
  const userPatternsBuilder = {
    select: () => userPatternsBuilder,
    eq: () => userPatternsBuilder,
    maybeSingle: async () => options.userPatterns ?? { data: null, error: null },
    upsert: (payload: unknown) => {
      userPatternsUpsertPayloads.push(payload);
      return { error: options.userPatternsUpsertError ?? null };
    },
  };

  const from = (table: string) => {
    if (table === "sessions") return sessionsBuilder;
    if (table === "messages") return messagesBuilder;
    if (table === "session_syntheses") return synthesesBuilder;
    if (table === "user_patterns") return userPatternsBuilder;
    throw new Error(`Tabela inesperada: ${table}`);
  };

  return {
    supabase: { auth: { getUser: getUserMock }, from },
    insertedPayloads,
    userPatternsUpsertPayloads,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/agent/client.server", () => ({
  getAnthropicClient: getAnthropicClientMock,
}));

vi.mock("@/lib/agent/synthesis", () => ({
  generateSessionSynthesis: generateSessionSynthesisMock,
}));

const VALID_SESSION_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_CREATED_AT = "2026-07-25T10:00:00Z";
const TEST_DEPTH = 8;

const GENERATED_CONTENT = {
  title: "Hoje você tocou no medo de não dar conta.",
  themes: ["Sono"],
  explored: "O sono e a rotina.",
  patterns: ["Padrão de irregularidade notado."],
  openQuestion: "O que uma boa noite de sono mudaria amanhã?",
  emotions: ["ansiedade"],
  triggers: ["rotina irregular"],
};

const CONVERSATION_MESSAGES = {
  data: [
    { role: "user", content: "Tenho dormido mal.", created_at: "2026-07-25T10:00:00Z" },
    { role: "assistant", content: "O que mudou?", created_at: "2026-07-25T10:00:05Z" },
  ],
  error: null,
};

describe("endSession", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    generateSessionSynthesisMock.mockReset();
    getAnthropicClientMock.mockClear();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o sessionId não é um UUID válido", async () => {
    const { endSession } = await import("./endSession");

    const result = await endSession("not-a-uuid", TEST_DEPTH);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando a profundidade é inválida", async () => {
    const { endSession } = await import("./endSession");

    const result = await endSession(VALID_SESSION_ID, -1);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: null, error: null },
      messages: { data: [], error: null },
      insert: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
  });

  it("retorna erro quando a sessão não existe ou não pertence ao usuário", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: null, error: null },
      messages: { data: [], error: null },
      insert: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
  });

  it("retorna erro específico quando a sessão ainda não tem uma troca completa de mensagens", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: {
        data: [{ role: "user", content: "Só eu falei", created_at: "2026-07-25T10:00:00Z" }],
        error: null,
      },
      insert: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({
      error: "É preciso pelo menos uma troca de mensagens para gerar uma síntese.",
    });
    expect(generateSessionSynthesisMock).not.toHaveBeenCalled();
  });

  it("gera a síntese, salva na tabela session_syntheses e retorna o resultado mapeado, com duração e trocas calculadas", async () => {
    const { supabase, insertedPayloads } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: {
        data: {
          id: "synthesis-1",
          title: GENERATED_CONTENT.title,
          themes: GENERATED_CONTENT.themes,
          explored: GENERATED_CONTENT.explored,
          patterns: GENERATED_CONTENT.patterns,
          open_question: GENERATED_CONTENT.openQuestion,
          depth: TEST_DEPTH,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
      userPatterns: { data: { themes: {}, emotions: {}, triggers: {}, session_count: 3 }, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({
      synthesis: {
        id: "synthesis-1",
        title: GENERATED_CONTENT.title,
        themes: GENERATED_CONTENT.themes,
        explored: GENERATED_CONTENT.explored,
        patterns: GENERATED_CONTENT.patterns,
        openQuestion: GENERATED_CONTENT.openQuestion,
        depth: TEST_DEPTH,
        durationMinutes: expect.any(Number),
        exchangeCount: 1,
        createdAt: "2026-07-25T10:23:00Z",
      },
      // Já existia um agregado de padrões para este usuário (session_count: 3), então
      // não é a primeira análise.
      showPatternPrivacyNotice: false,
    });
    expect(insertedPayloads[0]).toEqual({
      session_id: VALID_SESSION_ID,
      title: GENERATED_CONTENT.title,
      themes: GENERATED_CONTENT.themes,
      explored: GENERATED_CONTENT.explored,
      patterns: GENERATED_CONTENT.patterns,
      open_question: GENERATED_CONTENT.openQuestion,
      depth: TEST_DEPTH,
    });
  });

  it("atualiza o agregado user_patterns e sinaliza primeira análise quando o usuário ainda não tem um agregado prévio", async () => {
    const { supabase, userPatternsUpsertPayloads } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: {
        data: {
          id: "synthesis-1",
          title: GENERATED_CONTENT.title,
          themes: GENERATED_CONTENT.themes,
          explored: GENERATED_CONTENT.explored,
          patterns: GENERATED_CONTENT.patterns,
          open_question: GENERATED_CONTENT.openQuestion,
          depth: TEST_DEPTH,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
      userPatterns: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toMatchObject({ showPatternPrivacyNotice: true });
    expect(userPatternsUpsertPayloads[0]).toMatchObject({
      user_id: "user-1",
      themes: { sono: 1 },
      emotions: { ansiedade: 1 },
      triggers: { "rotina irregular": 1 },
      session_count: 1,
    });
  });

  it("não atualiza user_patterns nem sinaliza primeira análise quando a inserção colide (chamada recuperando síntese já existente)", async () => {
    const { supabase, userPatternsUpsertPayloads } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: { data: null, error: { code: "23505", message: "duplicate key value" } },
      recoverySelect: {
        data: {
          id: "synthesis-existente",
          title: "Título já salvo.",
          themes: ["Sono"],
          explored: "Já gerada por outra chamada.",
          patterns: ["..."],
          open_question: "...?",
          depth: TEST_DEPTH,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toMatchObject({ showPatternPrivacyNotice: false });
    expect(userPatternsUpsertPayloads).toHaveLength(0);
  });

  it("retorna a síntese normalmente, sem sinalizar primeira análise, quando a atualização de user_patterns falha", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: {
        data: {
          id: "synthesis-1",
          title: GENERATED_CONTENT.title,
          themes: GENERATED_CONTENT.themes,
          explored: GENERATED_CONTENT.explored,
          patterns: GENERATED_CONTENT.patterns,
          open_question: GENERATED_CONTENT.openQuestion,
          depth: TEST_DEPTH,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
      userPatterns: { data: null, error: null },
      userPatternsUpsertError: new Error("boom"),
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toMatchObject({
      synthesis: { id: "synthesis-1" },
      showPatternPrivacyNotice: false,
    });
  });

  it("retorna a síntese já existente quando a inserção colide com o índice único de session_id (chamadas concorrentes)", async () => {
    const { supabase, insertedPayloads } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: { data: null, error: { code: "23505", message: "duplicate key value" } },
      recoverySelect: {
        data: {
          id: "synthesis-existente",
          title: "Título já salvo.",
          themes: ["Sono"],
          explored: "Já gerada por outra chamada.",
          patterns: ["..."],
          open_question: "...?",
          depth: TEST_DEPTH,
          created_at: "2026-07-25T10:23:00Z",
        },
        error: null,
      },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({
      synthesis: {
        id: "synthesis-existente",
        title: "Título já salvo.",
        themes: ["Sono"],
        explored: "Já gerada por outra chamada.",
        patterns: ["..."],
        openQuestion: "...?",
        depth: TEST_DEPTH,
        durationMinutes: expect.any(Number),
        exchangeCount: 1,
        createdAt: "2026-07-25T10:23:00Z",
      },
      showPatternPrivacyNotice: false,
    });
    expect(insertedPayloads).toHaveLength(1);
  });

  it("retorna erro genérico quando a geração da síntese falha", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockRejectedValue(new Error("boom"));

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
  });

  it("retorna erro genérico quando a inserção da síntese falha", async () => {
    const { supabase } = createSupabaseStub({
      session: { data: { id: VALID_SESSION_ID, created_at: SESSION_CREATED_AT }, error: null },
      messages: CONVERSATION_MESSAGES,
      insert: { data: null, error: new Error("insert failed") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    generateSessionSynthesisMock.mockResolvedValue(GENERATED_CONTENT);

    const { endSession } = await import("./endSession");
    const result = await endSession(VALID_SESSION_ID, TEST_DEPTH);

    expect(result).toEqual({ error: "Não consegui gerar a síntese desta sessão agora. Tente novamente." });
  });
});
