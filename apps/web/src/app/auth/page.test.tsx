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

  it("habilita o envio de login", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeEnabled();
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

  it("exibe uma mensagem de erro quando o link de redefinição de senha é inválido ou expirado", async () => {
    const element = await AuthPage({
      searchParams: Promise.resolve({ erro: "link-invalido" }),
    });
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /não foi possível validar seu link de redefinição/i
    );
  });

  it("não exibe mensagem de erro quando não há parâmetro de erro", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exibe o link para recuperação de senha", async () => {
    const element = await AuthPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByRole("link", { name: /Esqueci minha senha/i })).toHaveAttribute(
      "href",
      "/auth/esqueci-senha"
    );
  });
});
