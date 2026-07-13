// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthPage from "./page";

describe("AuthPage", () => {
  it("não oferece nenhuma rota pública de criação de conta", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.queryByText(/criar conta/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeInTheDocument();
  });

  it("desabilita o envio de login e avisa que ainda não está disponível", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeDisabled();
    expect(screen.getByText(/login ainda não está disponível/i)).toBeInTheDocument();
  });

  it("exibe o formulário de login e o link de volta ao onboarding", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar ao onboarding/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("exibe uma mensagem de erro quando o convite é inválido ou expirado", async () => {
    const element = await AuthPage({
      searchParams: Promise.resolve({ erro: "convite-invalido" }),
    });
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível validar seu convite/i);
  });

  it("não exibe mensagem de erro quando não há parâmetro de erro", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
