// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyOtpMock, confirmOtpLinkMock } = vi.hoisted(() => ({
  verifyOtpMock: vi.fn(),
  confirmOtpLinkMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { verifyOtp: verifyOtpMock } })),
}));

vi.mock("@/lib/actions/confirmOtpLink", () => ({ confirmOtpLink: confirmOtpLinkMock }));

import ConfirmPage from "./page";

async function renderPage(params: Record<string, string>) {
  render(await ConfirmPage({ searchParams: Promise.resolve(params) }));
}

async function redirectOf(params: Record<string, string>): Promise<string | undefined> {
  try {
    await ConfirmPage({ searchParams: Promise.resolve(params) });
  } catch (error) {
    return (error as Error & { digest?: string }).digest;
  }
  return undefined;
}

describe("ConfirmPage (/auth/confirm)", () => {
  beforeEach(() => {
    verifyOtpMock.mockReset();
  });

  it("abrir o link não consome o token: só mostra o botão de ativar", async () => {
    await renderPage({ type: "invite", token_hash: "abc123" });

    expect(screen.getByRole("button", { name: "Ativar meu convite" })).toBeInTheDocument();
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("leva token_hash, type e next no formulário", async () => {
    const { container } = render(
      await ConfirmPage({
        searchParams: Promise.resolve({ type: "invite", token_hash: "abc123", next: "/chat" }),
      })
    );

    const hidden = Object.fromEntries(
      Array.from(container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(
        (input) => [input.name, input.value]
      )
    );
    expect(hidden).toEqual({ type: "invite", token_hash: "abc123", next: "/chat" });
  });

  it("mostra o texto de recuperação de senha para type=recovery", async () => {
    await renderPage({ type: "recovery", token_hash: "abc" });

    expect(screen.getByRole("heading", { name: "Defina uma nova senha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("redireciona para o erro de convite sem token_hash", async () => {
    expect(await redirectOf({ type: "invite" })).toContain("/auth?erro=convite-invalido");
  });

  it("redireciona para o erro de link sem token_hash em recuperação", async () => {
    expect(await redirectOf({ type: "recovery" })).toContain("/auth?erro=link-invalido");
  });

  it("redireciona para o erro genérico com type não suportado", async () => {
    expect(await redirectOf({ type: "email", token_hash: "abc" })).toContain(
      "/auth?erro=convite-invalido"
    );
  });
});
