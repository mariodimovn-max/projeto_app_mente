// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, createClientMock } = vi.hoisted(() => {
  const getUserMock = vi.fn();
  return {
    getUserMock,
    createClientMock: vi.fn(async () => ({
      auth: { getUser: getUserMock },
    })),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("./DefinirSenhaForm", () => ({
  DefinirSenhaForm: () => <div data-testid="definir-senha-form" />,
}));

import DefinirSenhaPage from "./page";

describe("DefinirSenhaPage", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("redireciona para /auth quando não há sessão de convite ativa", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(DefinirSenhaPage()).rejects.toThrow();

    try {
      await DefinirSenhaPage();
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain(
        "/auth?erro=convite-invalido"
      );
    }
  });

  it("renderiza o formulário de definição de senha quando o convite é válido", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "convidado@exemplo.com" } },
    });

    const element = await DefinirSenhaPage();
    render(element);

    expect(screen.getByText(/convidado@exemplo\.com/)).toBeInTheDocument();
    expect(screen.getByTestId("definir-senha-form")).toBeInTheDocument();
  });
});
