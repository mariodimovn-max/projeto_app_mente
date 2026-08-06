import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

function createSupabaseStub(options: {
  session: { data: unknown; error: unknown };
  synthesis?: { data: unknown; error: unknown };
  messages?: { data: unknown; error: unknown };
}) {
  const sessionsBuilder = {
    select: () => sessionsBuilder,
    eq: () => sessionsBuilder,
    maybeSingle: async () => options.session,
  };

  const synthesesBuilder = {
    select: () => synthesesBuilder,
    eq: () => synthesesBuilder,
    maybeSingle: async () => options.synthesis ?? { data: null, error: null },
  };

  const messagesBuilder = {
    select: () => messagesBuilder,
    eq: () => messagesBuilder,
    order: () => messagesBuilder,
    returns: () => messagesBuilder,
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown) =>
      resolve(options.messages ?? { data: [], error: null }),
  };

  const from = (table: string) => {
    if (table === "sessions") return sessionsBuilder;
    if (table === "session_syntheses") return synthesesBuilder;
    if (table === "messages") return messagesBuilder;
    throw new Error(`Tabela inesperada: ${table}`);
  };

  return { supabase: { auth: { getUser: getUserMock }, from } };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const VALID_SESSION_ID = "11111111-1111-4111-8111-111111111111";

describe("resumeSession", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o sessionId não é um UUID válido", async () => {
    const { resumeSession } = await import("./resumeSession");

    const result = await resumeSession("not-a-uuid");

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("retorna erro quando não há usuário autenticado", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseStub({ session: { data: null, error: null } }).supabase as never
    );

    const { resumeSession } = await import("./resumeSession");
    const result = await resumeSession(VALID_SESSION_ID);

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("retorna erro quando a sessão não existe ou não pertence ao usuário", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseStub({ session: { data: null, error: null } }).supabase as never
    );

    const { resumeSession } = await import("./resumeSession");
    const result = await resumeSession(VALID_SESSION_ID);

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("retorna erro quando a sessão já tem síntese (já encerrada, não é retomável)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseStub({
        session: { data: { id: VALID_SESSION_ID }, error: null },
        synthesis: { data: { id: "synthesis-1" }, error: null },
      }).supabase as never
    );

    const { resumeSession } = await import("./resumeSession");
    const result = await resumeSession(VALID_SESSION_ID);

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("retorna as mensagens em ordem cronológica quando a sessão está em andamento", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseStub({
        session: { data: { id: VALID_SESSION_ID }, error: null },
        synthesis: { data: null, error: null },
        messages: {
          data: [
            { id: "m1", role: "user", content: "Tenho dormido mal.", created_at: "2026-07-25T10:00:00Z" },
            { id: "m2", role: "assistant", content: "O que mudou?", created_at: "2026-07-25T10:00:05Z" },
          ],
          error: null,
        },
      }).supabase as never
    );

    const { resumeSession } = await import("./resumeSession");
    const result = await resumeSession(VALID_SESSION_ID);

    expect(result).toEqual({
      messages: [
        { id: "m1", role: "user", content: "Tenho dormido mal.", createdAt: "2026-07-25T10:00:00Z" },
        { id: "m2", role: "assistant", content: "O que mudou?", createdAt: "2026-07-25T10:00:05Z" },
      ],
    });
  });
});
