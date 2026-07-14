// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setPasswordMock } = vi.hoisted(() => ({ setPasswordMock: vi.fn() }));

vi.mock("@/lib/actions/setPassword", () => ({
  setPassword: setPasswordMock,
}));

import { RedefinirSenhaForm } from "./RedefinirSenhaForm";

function fillForm(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText(/Nova senha/i), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText(/Confirmar senha/i), {
    target: { value: confirmation },
  });
  fireEvent.click(screen.getByRole("button", { name: /Salvar nova senha/i }));
}

describe("RedefinirSenhaForm", () => {
  beforeEach(() => {
    setPasswordMock.mockReset();
  });

  it("exibe erro quando a senha é muito curta", async () => {
    render(<RedefinirSenhaForm />);
    fillForm("123", "123");

    expect(await screen.findByRole("alert")).toHaveTextContent(/pelo menos 8 caracteres/i);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it("exibe erro quando as senhas não coincidem", async () => {
    render(<RedefinirSenhaForm />);
    fillForm("senha1234", "outrasenha");

    expect(await screen.findByRole("alert")).toHaveTextContent(/não coincidem/i);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it("chama a Server Action com a nova senha e uma mensagem de erro específica de redefinição (não de ativação de convite)", async () => {
    setPasswordMock.mockResolvedValue(undefined);
    render(<RedefinirSenhaForm />);
    fillForm("senha1234", "senha1234");

    await waitFor(() =>
      expect(setPasswordMock).toHaveBeenCalledWith(
        "senha1234",
        "Não foi possível salvar sua nova senha agora. Tente novamente."
      )
    );
  });

  it("exibe erro quando a Server Action retorna uma falha", async () => {
    setPasswordMock.mockResolvedValue({
      error: "Não foi possível salvar sua nova senha agora. Tente novamente.",
    });
    render(<RedefinirSenhaForm />);
    fillForm("senha1234", "senha1234");

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível salvar sua nova senha/i);
  });
});
