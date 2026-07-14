import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmailMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { resetPasswordForEmail: resetPasswordForEmailMock },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    resetPasswordForEmailMock.mockReset();
  });

  it("solicita o link de redefinição via Supabase e não retorna erro quando bem-sucedido", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("usuario@exemplo.com");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("usuario@exemplo.com");
    expect(result).toBeUndefined();
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

  it("não revela se o e-mail existe quando o Supabase retorna outro erro", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 400, message: "User not found" },
    });
    const { requestPasswordReset } = await import("./requestPasswordReset");

    const result = await requestPasswordReset("inexistente@exemplo.com");

    expect(result).toBeUndefined();
  });
});
