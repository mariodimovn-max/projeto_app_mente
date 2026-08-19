import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const GENERIC_ERROR = "Não consegui exportar seus dados agora. Tente novamente.";
const USER_ID = "user-1";

function makeSelectBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    returns: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return builder;
}

function makeUserPatternsBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: function select() {
      return this;
    },
    eq: function eq() {
      return this;
    },
    maybeSingle: async () => result,
  };
}

function makeAuditLogBuilder(insertPayloads: unknown[], result: { error: unknown } = { error: null }) {
  const builder: Record<string, unknown> = {
    insert: (payload: unknown) => {
      insertPayloads.push(payload);
      return builder;
    },
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return builder;
}

function createSupabaseStub(options: {
  sessions?: { data: unknown; error: unknown };
  messages?: { data: unknown; error: unknown };
  syntheses?: { data: unknown; error: unknown };
  patterns?: { data: unknown; error: unknown };
  auditLogResult?: { error: unknown };
}) {
  const auditLogInserts: unknown[] = [];

  const supabase = {
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "sessions") return makeSelectBuilder(options.sessions ?? { data: [], error: null });
      if (table === "messages") return makeSelectBuilder(options.messages ?? { data: [], error: null });
      if (table === "session_syntheses")
        return makeSelectBuilder(options.syntheses ?? { data: [], error: null });
      if (table === "user_patterns") return makeUserPatternsBuilder(options.patterns ?? { data: null, error: null });
      if (table === "audit_log") return makeAuditLogBuilder(auditLogInserts, options.auditLogResult);
      throw new Error(`Tabela inesperada: ${table}`);
    },
  };

  return { supabase, auditLogInserts };
}

describe("exportUserData", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub({});
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    expect(result).toEqual({ error: GENERIC_ERROR });
  });

  it("retorna estrutura vazia quando o usuário não tem nenhuma sessão (AC1)", async () => {
    const { supabase, auditLogInserts } = createSupabaseStub({
      sessions: { data: [], error: null },
      patterns: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID, email: "user@example.com" } } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    expect("data" in result).toBe(true);
    if (!("data" in result)) throw new Error("esperava data");
    expect(result.data.user).toEqual({ id: USER_ID, email: "user@example.com" });
    expect(result.data.sessions).toEqual([]);
    expect(result.data.patterns).toBeNull();
    expect(auditLogInserts).toEqual([{ user_id: USER_ID, action: "export_data" }]);
  });

  it("monta sessões com mensagens e síntese aninhadas, e o agregado de padrões (AC1)", async () => {
    const { supabase } = createSupabaseStub({
      sessions: {
        data: [{ id: "s1", created_at: "2026-08-01T10:00:00Z", marked: true }],
        error: null,
      },
      messages: {
        data: [
          { id: "m1", session_id: "s1", role: "user", content: "Oi", created_at: "2026-08-01T10:00:00Z" },
          { id: "m2", session_id: "s1", role: "assistant", content: "Olá", created_at: "2026-08-01T10:01:00Z" },
        ],
        error: null,
      },
      syntheses: {
        data: [
          {
            session_id: "s1",
            title: "Um começo",
            themes: ["sono"],
            explored: "O sono recente",
            patterns: ["dorme tarde"],
            open_question: "O que muda se você dormir mais cedo?",
            depth: 2,
            emotions: ["cansaço"],
            triggers: ["trabalho"],
            created_at: "2026-08-01T10:05:00Z",
          },
        ],
        error: null,
      },
      patterns: {
        data: {
          themes: { sono: 3 },
          emotions: { cansaço: 2 },
          triggers: { trabalho: 1 },
          session_count: 3,
          updated_at: "2026-08-01T10:05:00Z",
        },
        error: null,
      },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID, email: "user@example.com" } } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    if (!("data" in result)) throw new Error("esperava data");
    expect(result.data.sessions).toEqual([
      {
        id: "s1",
        createdAt: "2026-08-01T10:00:00Z",
        marked: true,
        messages: [
          { id: "m1", role: "user", content: "Oi", createdAt: "2026-08-01T10:00:00Z" },
          { id: "m2", role: "assistant", content: "Olá", createdAt: "2026-08-01T10:01:00Z" },
        ],
        synthesis: {
          title: "Um começo",
          themes: ["sono"],
          explored: "O sono recente",
          patterns: ["dorme tarde"],
          openQuestion: "O que muda se você dormir mais cedo?",
          depth: 2,
          emotions: ["cansaço"],
          triggers: ["trabalho"],
          createdAt: "2026-08-01T10:05:00Z",
        },
      },
    ]);
    expect(result.data.patterns).toEqual({
      themes: { sono: 3 },
      emotions: { cansaço: 2 },
      triggers: { trabalho: 1 },
      sessionCount: 3,
      updatedAt: "2026-08-01T10:05:00Z",
    });
  });

  it("marca a síntese como null quando a sessão ainda não foi encerrada", async () => {
    const { supabase } = createSupabaseStub({
      sessions: { data: [{ id: "s1", created_at: "2026-08-01T10:00:00Z", marked: false }], error: null },
      messages: { data: [], error: null },
      syntheses: { data: [], error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID, email: null } } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    if (!("data" in result)) throw new Error("esperava data");
    expect(result.data.sessions[0].synthesis).toBeNull();
  });

  it("retorna os dados mesmo quando o registro de auditoria falha (best-effort, AC3 não bloqueia AC1/AC2)", async () => {
    const { supabase } = createSupabaseStub({
      sessions: { data: [], error: null },
      auditLogResult: { error: new Error("audit db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID, email: null } } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    expect("data" in result).toBe(true);
  });

  it("retorna erro genérico quando a consulta de sessões falha", async () => {
    const { supabase } = createSupabaseStub({
      sessions: { data: null, error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID, email: null } } });

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    expect(result).toEqual({ error: GENERIC_ERROR });
  });

  it("retorna erro genérico quando a chamada ao Supabase rejeita", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("network down"));

    const { exportUserData } = await import("./exportData");
    const result = await exportUserData();

    expect(result).toEqual({ error: GENERIC_ERROR });
  });
});
