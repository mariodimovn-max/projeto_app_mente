import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, signOutMock, deleteUserMock, createAdminClientMock, redirectMock } = vi.hoisted(
  () => ({
    getUserMock: vi.fn(),
    signOutMock: vi.fn(),
    deleteUserMock: vi.fn(),
    createAdminClientMock: vi.fn(),
    redirectMock: vi.fn(),
  })
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const GENERIC_ERROR = "Não foi possível excluir sua conta agora. Tente novamente em instantes.";
const USER_ID = "user-1";

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

function createSupabaseStub(options: { auditLogResult?: { error: unknown } } = {}) {
  const auditLogInserts: unknown[] = [];
  const supabase = {
    auth: { getUser: getUserMock, signOut: signOutMock },
    from: (table: string) => {
      if (table === "audit_log") return makeAuditLogBuilder(auditLogInserts, options.auditLogResult);
      throw new Error(`Tabela inesperada: ${table}`);
    },
  };
  return { supabase, auditLogInserts };
}

describe("deleteAccount", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    signOutMock.mockReset();
    deleteUserMock.mockReset();
    createAdminClientMock.mockReset();
    createAdminClientMock.mockReturnValue({ auth: { admin: { deleteUser: deleteUserMock } } });
    redirectMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { deleteAccount } = await import("./deleteAccount");
    const result = await deleteAccount();

    expect(result).toEqual({ error: GENERIC_ERROR });
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("registra a auditoria antes de excluir a conta no Auth, encerra a sessão e redireciona (AC1-AC4)", async () => {
    const { supabase, auditLogInserts } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    deleteUserMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: null });

    const { deleteAccount } = await import("./deleteAccount");
    await deleteAccount();

    expect(auditLogInserts).toEqual([{ user_id: USER_ID, action: "delete_account" }]);
    expect(deleteUserMock).toHaveBeenCalledWith(USER_ID);
    expect(signOutMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("bloqueia a exclusão e não chama o Auth quando o registro de auditoria falha (AC3 é pré-condição)", async () => {
    const { supabase } = createSupabaseStub({ auditLogResult: { error: new Error("db down") } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deleteAccount } = await import("./deleteAccount");
    const result = await deleteAccount();

    expect(result).toEqual({ error: GENERIC_ERROR });
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico, não redireciona e grava um registro compensatório quando a exclusão no Supabase Auth falha", async () => {
    const { supabase, auditLogInserts } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    deleteUserMock.mockResolvedValue({ error: new Error("auth down") });

    const { deleteAccount } = await import("./deleteAccount");
    const result = await deleteAccount();

    expect(result).toEqual({ error: GENERIC_ERROR });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(auditLogInserts).toEqual([
      { user_id: USER_ID, action: "delete_account" },
      { user_id: USER_ID, action: "delete_account_failed" },
    ]);
  });

  it("redireciona mesmo quando o signOut falha, já que a conta já foi destruída", async () => {
    const { supabase } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    deleteUserMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: new Error("session already gone") });

    const { deleteAccount } = await import("./deleteAccount");
    await deleteAccount();

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("retorna erro genérico e grava um registro compensatório quando o client admin não está configurado (service role key ausente)", async () => {
    const { supabase, auditLogInserts } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    createAdminClientMock.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
    });

    const { deleteAccount } = await import("./deleteAccount");
    const result = await deleteAccount();

    expect(result).toEqual({ error: GENERIC_ERROR });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(auditLogInserts).toEqual([
      { user_id: USER_ID, action: "delete_account" },
      { user_id: USER_ID, action: "delete_account_failed" },
    ]);
  });

  it("retorna erro genérico e redireciona mesmo quando signOut() rejeita em vez de retornar { error }", async () => {
    const { supabase } = createSupabaseStub();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    deleteUserMock.mockResolvedValue({ error: null });
    signOutMock.mockRejectedValue(new Error("network down"));

    const { deleteAccount } = await import("./deleteAccount");
    await deleteAccount();

    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
