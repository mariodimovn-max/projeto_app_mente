import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { signInWithPassword: signInWithPasswordMock },
}));
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("login", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    redirectMock.mockReset();
  });

  it("autentica via Supabase e redireciona para a home quando bem-sucedido", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const { login } = await import("./login");

    await login("usuario@exemplo.com", "senha1234");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "usuario@exemplo.com",
      password: "senha1234",
    });
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("retorna mensagem de rate limit sem expor detalhes quando o Supabase bloqueia por excesso de tentativas", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { status: 429, message: "rate limited" } });
    const { login } = await import("./login");

    const result = await login("usuario@exemplo.com", "senha-errada");

    expect(result).toEqual({
      error: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("retorna mensagem genérica sem revelar se o e-mail existe quando as credenciais são inválidas", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { status: 400, message: "Invalid login credentials" },
    });
    const { login } = await import("./login");

    const result = await login("inexistente@exemplo.com", "senha1234");

    expect(result).toEqual({
      error: "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
