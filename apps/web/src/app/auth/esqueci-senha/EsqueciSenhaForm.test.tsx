// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn(),
}));

vi.mock("@/lib/actions/requestPasswordReset", () => ({
  requestPasswordReset: requestPasswordResetMock,
}));

import { EsqueciSenhaForm } from "./EsqueciSenhaForm";

function fillForm(email: string) {
  fireEvent.change(screen.getByLabelText(/E-mail/i), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /Enviar link de redefinição/i }));
}

describe("EsqueciSenhaForm", () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
  });

  it("chama a Server Action com o e-mail informado", async () => {
    requestPasswordResetMock.mockResolvedValue(undefined);
    render(<EsqueciSenhaForm />);
    fillForm("usuario@exemplo.com");

    await waitFor(() =>
      expect(requestPasswordResetMock).toHaveBeenCalledWith("usuario@exemplo.com")
    );
  });

  it("exibe uma mensagem de sucesso genérica após o envio, sem revelar se o e-mail existe", async () => {
    requestPasswordResetMock.mockResolvedValue(undefined);
    render(<EsqueciSenhaForm />);
    fillForm("usuario@exemplo.com");

    expect(await screen.findByRole("status")).toHaveTextContent(
      /se existir uma conta com esse e-mail/i
    );
    expect(
      screen.queryByRole("button", { name: /Enviar link de redefinição/i })
    ).not.toBeInTheDocument();
  });

  it("exibe erro quando a Server Action retorna uma falha de rate limit", async () => {
    requestPasswordResetMock.mockResolvedValue({
      error: "Muitas solicitações de redefinição de senha. Aguarde alguns minutos antes de tentar novamente.",
    });
    render(<EsqueciSenhaForm />);
    fillForm("usuario@exemplo.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(/muitas solicitações/i);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("desabilita o botão de envio enquanto a solicitação está em andamento", async () => {
    let resolveRequest: (value: { error: string } | undefined) => void = () => {};
    requestPasswordResetMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<EsqueciSenhaForm />);
    fillForm("usuario@exemplo.com");

    expect(await screen.findByRole("button", { name: /Enviando/i })).toBeDisabled();

    resolveRequest(undefined);
  });
});
