// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EsqueciSenhaPage from "./page";

describe("EsqueciSenhaPage", () => {
  it("exibe o formulário de solicitação e o link de volta ao login", () => {
    render(<EsqueciSenhaPage />);

    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enviar link de redefinição/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar ao login/i })).toHaveAttribute(
      "href",
      "/auth"
    );
  });
});
