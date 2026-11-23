import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyOtpMock, redirectMock } = vi.hoisted(() => ({
  verifyOtpMock: vi.fn(),
  // redirect() do Next nunca retorna; o mock lança para interromper a action como o real.
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { verifyOtp: verifyOtpMock } })),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { confirmOtpLink } from "./confirmOtpLink";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("confirmOtpLink", () => {
  beforeEach(() => {
    verifyOtpMock.mockReset();
    redirectMock.mockClear();
  });

  it("verifica o convite e segue para /auth/definir-senha", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    await expect(confirmOtpLink(form({ type: "invite", token_hash: "abc123" }))).rejects.toThrow(
      "REDIRECT:/auth/definir-senha"
    );
    expect(verifyOtpMock).toHaveBeenCalledWith({ type: "invite", token_hash: "abc123" });
  });

  it("verifica a recuperação e segue para /auth/redefinir-senha", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    await expect(confirmOtpLink(form({ type: "recovery", token_hash: "abc" }))).rejects.toThrow(
      "REDIRECT:/auth/redefinir-senha"
    );
  });

  it("respeita um next interno", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    await expect(
      confirmOtpLink(form({ type: "invite", token_hash: "abc", next: "/chat" }))
    ).rejects.toThrow("REDIRECT:/chat");
  });

  it.each(["//evil.com", "@evil.com/x", "https://evil.com"])(
    "ignora next externo (%s)",
    async (next) => {
      verifyOtpMock.mockResolvedValue({ error: null });

      await expect(
        confirmOtpLink(form({ type: "invite", token_hash: "abc", next }))
      ).rejects.toThrow("REDIRECT:/auth/definir-senha");
    }
  );

  it("manda para o erro de convite quando o token é inválido ou já foi usado", async () => {
    verifyOtpMock.mockResolvedValue({ error: new Error("expired") });

    await expect(confirmOtpLink(form({ type: "invite", token_hash: "bad" }))).rejects.toThrow(
      "REDIRECT:/auth?erro=convite-invalido"
    );
  });

  it("usa a mensagem de link inválido para recuperação", async () => {
    verifyOtpMock.mockResolvedValue({ error: new Error("expired") });

    await expect(confirmOtpLink(form({ type: "recovery", token_hash: "bad" }))).rejects.toThrow(
      "REDIRECT:/auth?erro=link-invalido"
    );
  });

  it("não chama o Supabase sem token_hash", async () => {
    await expect(confirmOtpLink(form({ type: "invite" }))).rejects.toThrow(
      "REDIRECT:/auth?erro=convite-invalido"
    );
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("rejeita type não suportado", async () => {
    await expect(confirmOtpLink(form({ type: "email", token_hash: "abc" }))).rejects.toThrow(
      "REDIRECT:/auth?erro=convite-invalido"
    );
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
