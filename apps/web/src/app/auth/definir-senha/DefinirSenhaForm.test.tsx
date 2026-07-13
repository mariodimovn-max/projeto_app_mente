// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setPasswordMock } = vi.hoisted(() => ({ setPasswordMock: vi.fn() }));

vi.mock("@/lib/actions/setPassword", () => ({
  setPassword: setPasswordMock,
}));

import { DefinirSenhaForm } from "./DefinirSenhaForm";

function fillForm(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText(/Nova senha/i), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText(/Confirmar senha/i), {
    target: { value: confirmation },
  });
  fireEvent.click(screen.getByRole("button", { name: /Ativar conta/i }));
}

describe("DefinirSenhaForm", () => {
  beforeEach(() => {
    setPasswordMock.mockReset();
  });

  it("exibe erro quando a senha é muito curta", async () => {
    render(<DefinirSenhaForm />);
    fillForm("123", "123");

    expect(await screen.findByRole("alert")).toHaveTextContent(/pelo menos 8 caracteres/i);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it("exibe erro quando as senhas não coincidem", async () => {
    render(<DefinirSenhaForm />);
    fillForm("senha1234", "outrasenha");

    expect(await screen.findByRole("alert")).toHaveTextContent(/não coincidem/i);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it("chama a Server Action com a nova senha quando a validação passa", async () => {
    setPasswordMock.mockResolvedValue(undefined);
    render(<DefinirSenhaForm />);
    fillForm("senha1234", "senha1234");

    await waitFor(() => expect(setPasswordMock).toHaveBeenCalledWith("senha1234"));
  });

  it("exibe erro quando a Server Action retorna uma falha", async () => {
    setPasswordMock.mockResolvedValue({
      error: "Não foi possível ativar sua conta agora. Tente novamente.",
    });
    render(<DefinirSenhaForm />);
    fillForm("senha1234", "senha1234");

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível ativar/i);
  });
});
