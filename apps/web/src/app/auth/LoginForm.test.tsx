// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("@/lib/actions/login", () => ({
  login: loginMock,
}));

import { LoginForm } from "./LoginForm";

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/E-mail/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^Senha$/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("chama a Server Action com o e-mail e a senha informados", async () => {
    loginMock.mockResolvedValue(undefined);
    render(<LoginForm />);
    fillForm("usuario@exemplo.com", "senha1234");

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith("usuario@exemplo.com", "senha1234")
    );
  });

  it("exibe erro quando a Server Action retorna uma falha", async () => {
    loginMock.mockResolvedValue({
      error: "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
    });
    render(<LoginForm />);
    fillForm("usuario@exemplo.com", "senha-errada");

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorretos/i);
  });

  it("desabilita o botão de envio enquanto a autenticação está em andamento", async () => {
    let resolveLogin: (value: { error: string } | undefined) => void = () => {};
    loginMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    render(<LoginForm />);
    fillForm("usuario@exemplo.com", "senha1234");

    expect(await screen.findByRole("button", { name: /Entrando/i })).toBeDisabled();

    resolveLogin(undefined);
  });
});
