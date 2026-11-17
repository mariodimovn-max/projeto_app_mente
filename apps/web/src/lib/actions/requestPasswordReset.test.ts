import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmailMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { resetPasswordForEmail: resetPasswordForEmailMock },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

const requestHeaders = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => requestHeaders.get(name) ?? null,
  }),
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    resetPasswordForEmailMock.mockReset();
    vi.restoreAllMocks();
    requestHeaders.clear();
    requestHeaders.set("origin", "http://localhost:3000");
  });

  it("solicita o link de redefinição via Supabase apontando para /auth/callback e não retorna erro quando bem-sucedido", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("usuario@exemplo.com");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("usuario@exemplo.com", {
      redirectTo: "http://localhost:3000/auth/callback?next=/auth/redefinir-senha",
    });
    expect(result).toBeUndefined();
  });

  it("monta o redirectTo a partir de host/x-forwarded-proto quando não há header origin", async () => {
    requestHeaders.clear();
    requestHeaders.set("host", "app.exemplo.com");
    requestHeaders.set("x-forwarded-proto", "https");
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    await requestPasswordReset("usuario@exemplo.com");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("usuario@exemplo.com", {
      redirectTo: "https://app.exemplo.com/auth/callback?next=/auth/redefinir-senha",
    });
  });

  it("retorna mensagem de rate limit quando o Supabase bloqueia por excesso de tentativas", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 429, message: "rate limited" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("usuario@exemplo.com");

    expect(result).toEqual({
      error:
        "Muitas solicitações de redefinição de senha. Aguarde alguns minutos antes de tentar novamente.",
    });
  });

  it("não revela se o e-mail existe: conta inexistente recebe o mesmo sucesso genérico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 400, code: "user_not_found", message: "User not found" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("inexistente@exemplo.com");

    expect(result).toBeUndefined();
  });

  it("mantém o sucesso genérico para 'User not found' mesmo sem código de erro", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 400, message: "User not found" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    expect(await requestPasswordReset("inexistente@exemplo.com")).toBeUndefined();
  });

  it("trata o código over_email_send_rate_limit como excesso de tentativas", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 400, code: "over_email_send_rate_limit", message: "rate" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("usuario@exemplo.com");

    expect(result?.error).toMatch(/muitas solicitações/i);
  });

  it.each([
    ["provedor de e-mail padrão recusando o endereço", { status: 400, code: "email_address_not_authorized", message: "Email address \"usuario@exemplo.com\" cannot be used" }],
    ["erro interno ao enviar", { status: 500, code: "unexpected_failure", message: "Error sending recovery email" }],
  ])("não finge que enviou quando o envio falha (%s)", async (_label, error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmailMock.mockResolvedValue({ error });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("usuario@exemplo.com");

    expect(result?.error).toMatch(/não conseguimos enviar o e-mail de redefinição/i);
    // A mensagem é a mesma para qualquer conta: não diz se o e-mail existe.
    expect(result?.error).not.toMatch(/usuario@exemplo.com|não existe|não encontrad/i);
  });

  it("registra a falha no log do servidor só com código e status — nunca o e-mail", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 400, code: "email_address_not_authorized", message: "Email address \"usuario@exemplo.com\" cannot be used" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    await requestPasswordReset("usuario@exemplo.com");

    expect(consoleError).toHaveBeenCalledWith(expect.any(String), {
      status: 400,
      code: "email_address_not_authorized",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("usuario@exemplo.com");
  });
});
