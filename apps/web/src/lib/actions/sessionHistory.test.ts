import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const VALID_SESSION_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "user-1";
const MARK_ERROR = "Não consegui atualizar essa sessão agora. Tente novamente.";
const DELETE_ERROR = "Não consegui excluir essa sessão agora. Tente novamente.";

function createSupabaseStub(options: {
  ownership: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
  deleteResult?: { error: unknown };
}) {
  let mode: "update" | "delete" | null = null;
  const updatePayloads: unknown[] = [];

  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => options.ownership,
    update: (payload: unknown) => {
      mode = "update";
      updatePayloads.push(payload);
      return builder;
    },
    delete: () => {
      mode = "delete";
      return builder;
    },
    then: (resolve: (value: { error: unknown }) => unknown) => {
      if (mode === "update") return resolve(options.updateResult ?? { error: null });
      if (mode === "delete") return resolve(options.deleteResult ?? { error: null });
      throw new Error("then chamado antes de update()/delete()");
    },
  };

  return {
    supabase: { auth: { getUser: getUserMock }, from: (table: string) => {
      if (table === "sessions") return builder;
      throw new Error(`Tabela inesperada: ${table}`);
    } },
    updatePayloads,
  };
}

describe("setSessionMarked", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o sessionId não é um UUID válido", async () => {
    const { setSessionMarked } = await import("./sessionHistory");

    const result = await setSessionMarked("not-a-uuid", true);

    expect(result).toEqual({ error: MARK_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando marked não é um booleano", async () => {
    const { setSessionMarked } = await import("./sessionHistory");

    const result = await setSessionMarked(VALID_SESSION_ID, "true" as unknown as boolean);

    expect(result).toEqual({ error: MARK_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { setSessionMarked } = await import("./sessionHistory");
    const result = await setSessionMarked(VALID_SESSION_ID, true);

    expect(result).toEqual({ error: MARK_ERROR });
  });

  it("retorna erro quando a sessão não existe ou não pertence ao usuário", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { setSessionMarked } = await import("./sessionHistory");
    const result = await setSessionMarked(VALID_SESSION_ID, true);

    expect(result).toEqual({ error: MARK_ERROR });
  });

  it("marca a sessão e retorna sucesso quando o usuário é dono dela", async () => {
    const { supabase, updatePayloads } = createSupabaseStub({
      ownership: { data: { id: VALID_SESSION_ID }, error: null },
      updateResult: { error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { setSessionMarked } = await import("./sessionHistory");
    const result = await setSessionMarked(VALID_SESSION_ID, true);

    expect(result).toEqual({ success: true });
    expect(updatePayloads).toEqual([{ marked: true }]);
  });

  it("retorna erro genérico quando a atualização falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_SESSION_ID }, error: null },
      updateResult: { error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { setSessionMarked } = await import("./sessionHistory");
    const result = await setSessionMarked(VALID_SESSION_ID, false);

    expect(result).toEqual({ error: MARK_ERROR });
  });

  it("retorna erro genérico quando a chamada ao Supabase rejeita", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("network down"));

    const { setSessionMarked } = await import("./sessionHistory");
    const result = await setSessionMarked(VALID_SESSION_ID, true);

    expect(result).toEqual({ error: MARK_ERROR });
  });
});

describe("deleteSession", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o sessionId não é um UUID válido", async () => {
    const { deleteSession } = await import("./sessionHistory");

    const result = await deleteSession("not-a-uuid");

    expect(result).toEqual({ error: DELETE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando a sessão não existe ou não pertence ao usuário", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deleteSession } = await import("./sessionHistory");
    const result = await deleteSession(VALID_SESSION_ID);

    expect(result).toEqual({ error: DELETE_ERROR });
  });

  it("exclui a sessão e retorna sucesso quando o usuário é dono dela", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_SESSION_ID }, error: null },
      deleteResult: { error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deleteSession } = await import("./sessionHistory");
    const result = await deleteSession(VALID_SESSION_ID);

    expect(result).toEqual({ success: true });
  });

  it("retorna erro genérico quando a exclusão falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_SESSION_ID }, error: null },
      deleteResult: { error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deleteSession } = await import("./sessionHistory");
    const result = await deleteSession(VALID_SESSION_ID);

    expect(result).toEqual({ error: DELETE_ERROR });
  });
});
