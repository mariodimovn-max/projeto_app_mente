import { beforeEach, describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { signOut: signOutMock },
}));
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("logout", () => {
  beforeEach(() => {
    signOutMock.mockReset();
    redirectMock.mockReset();
  });

  it("encerra a sessão via Supabase e redireciona para o onboarding quando bem-sucedido", async () => {
    signOutMock.mockResolvedValue({ error: null });
    const { logout } = await import("./logout");

    await logout();

    expect(signOutMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("retorna uma mensagem de erro sem redirecionar quando o Supabase falha ao invalidar a sessão", async () => {
    signOutMock.mockResolvedValue({ error: new Error("fail") });
    const { logout } = await import("./logout");

    const result = await logout();

    expect(result).toEqual({
      error: "Não foi possível encerrar sua sessão agora. Tente novamente.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
