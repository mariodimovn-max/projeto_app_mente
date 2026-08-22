import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.fn();

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

let auditLogInserts: unknown[] = [];
let auditLogResult: { error: unknown } = { error: null };

const createClientMock = vi.fn(async () => ({
  auth: { signInWithPassword: signInWithPasswordMock },
  from: (table: string) => {
    if (table === "audit_log") return makeAuditLogBuilder(auditLogInserts, auditLogResult);
    throw new Error(`Tabela inesperada: ${table}`);
  },
}));
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const USER_ID = "user-1";

describe("login", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    redirectMock.mockReset();
    auditLogInserts = [];
    auditLogResult = { error: null };
  });

  it("autentica via Supabase, registra a auditoria e redireciona para a home quando bem-sucedido (AC1)", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const { login } = await import("./login");

    await login("usuario@exemplo.com", "senha1234");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "usuario@exemplo.com",
      password: "senha1234",
    });
    expect(auditLogInserts).toEqual([{ user_id: USER_ID, action: "login" }]);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("ainda redireciona quando o registro de auditoria falha, sem bloquear o login", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    auditLogResult = { error: new Error("db down") };
    const { login } = await import("./login");

    await login("usuario@exemplo.com", "senha1234");

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("ainda redireciona quando o insert de auditoria lança exceção em vez de resolver com erro", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const { login } = await import("./login");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    createClientMock.mockResolvedValueOnce({
      auth: { signInWithPassword: signInWithPasswordMock },
      from: () => ({
        insert: () => {
          throw new Error("network down");
        },
      }),
    } as never);

    await login("usuario@exemplo.com", "senha1234");

    expect(redirectMock).toHaveBeenCalledWith("/");
    consoleErrorSpy.mockRestore();
  });

  it("retorna mensagem de rate limit sem expor detalhes quando o Supabase bloqueia por excesso de tentativas", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { status: 429, message: "rate limited" },
    });
    const { login } = await import("./login");

    const result = await login("usuario@exemplo.com", "senha-errada");

    expect(result).toEqual({
      error: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(auditLogInserts).toEqual([]);
  });

  it("retorna mensagem genérica sem revelar se o e-mail existe quando as credenciais são inválidas", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { status: 400, message: "Invalid login credentials" },
    });
    const { login } = await import("./login");

    const result = await login("inexistente@exemplo.com", "senha1234");

    expect(result).toEqual({
      error: "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(auditLogInserts).toEqual([]);
  });
});
