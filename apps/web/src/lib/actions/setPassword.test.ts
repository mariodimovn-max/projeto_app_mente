import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUserMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { updateUser: updateUserMock },
}));
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("setPassword", () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    redirectMock.mockReset();
  });

  it("atualiza a senha via Supabase e redireciona para o onboarding quando bem-sucedido", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    const { setPassword } = await import("./setPassword");

    await setPassword("senha1234");

    expect(updateUserMock).toHaveBeenCalledWith({ password: "senha1234" });
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("retorna uma mensagem de erro sem redirecionar quando o Supabase falha", async () => {
    updateUserMock.mockResolvedValue({ error: new Error("fail") });
    const { setPassword } = await import("./setPassword");

    const result = await setPassword("senha1234");

    expect(result).toEqual({
      error: "Não foi possível ativar sua conta agora. Tente novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("usa a mensagem de erro customizada informada pelo chamador, em vez do texto padrão de ativação", async () => {
    updateUserMock.mockResolvedValue({ error: new Error("fail") });
    const { setPassword } = await import("./setPassword");

    const result = await setPassword("senha1234", "Não foi possível salvar sua nova senha agora. Tente novamente.");

    expect(result).toEqual({
      error: "Não foi possível salvar sua nova senha agora. Tente novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
