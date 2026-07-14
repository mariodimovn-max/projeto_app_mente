// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getClaimsMock, createClientMock } = vi.hoisted(() => {
  const getClaimsMock = vi.fn();
  return {
    getClaimsMock,
    createClientMock: vi.fn(async () => ({
      auth: { getClaims: getClaimsMock },
    })),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("./RedefinirSenhaForm", () => ({
  RedefinirSenhaForm: () => <div data-testid="redefinir-senha-form" />,
}));

import RedefinirSenhaPage from "./page";

async function expectRedirectToLinkInvalido() {
  await expect(RedefinirSenhaPage()).rejects.toThrow();

  try {
    await RedefinirSenhaPage();
  } catch (error) {
    expect((error as Error & { digest?: string }).digest).toContain("/auth?erro=link-invalido");
  }
}

describe("RedefinirSenhaPage", () => {
  beforeEach(() => {
    getClaimsMock.mockReset();
  });

  it("redireciona para /auth com erro de link inválido quando não há sessão", async () => {
    getClaimsMock.mockResolvedValue({ data: null, error: null });

    await expectRedirectToLinkInvalido();
  });

  it("redireciona para /auth com erro de link inválido quando a sessão não veio de um link de recuperação (ex.: usuário já logado navegando direto para a URL)", async () => {
    getClaimsMock.mockResolvedValue({
      data: {
        claims: {
          amr: [{ method: "password", timestamp: 123 }],
          email: "usuario@exemplo.com",
        },
      },
    });

    await expectRedirectToLinkInvalido();
  });

  it("renderiza o formulário de redefinição quando a sessão veio de um link de recuperação válido (formato AMREntry)", async () => {
    getClaimsMock.mockResolvedValue({
      data: {
        claims: {
          amr: [{ method: "recovery", timestamp: 123 }],
          email: "usuario@exemplo.com",
        },
      },
    });

    const element = await RedefinirSenhaPage();
    render(element);

    expect(screen.getByText(/usuario@exemplo\.com/)).toBeInTheDocument();
    expect(screen.getByTestId("redefinir-senha-form")).toBeInTheDocument();
  });

  it("renderiza o formulário de redefinição também quando o amr vem no formato RFC-8176 (string[])", async () => {
    getClaimsMock.mockResolvedValue({
      data: {
        claims: {
          amr: ["recovery"],
          email: "usuario@exemplo.com",
        },
      },
    });

    const element = await RedefinirSenhaPage();
    render(element);

    expect(screen.getByTestId("redefinir-senha-form")).toBeInTheDocument();
  });
});
