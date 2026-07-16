// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock, headerStore } = vi.hoisted(() => {
  const headerStore = new Map<string, string>();
  return {
    headerStore,
    headersMock: vi.fn(async () => ({
      get: (name: string) => headerStore.get(name) ?? null,
    })),
  };
});

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/proxy", () => ({
  SESSION_USER_HEADER: "x-app-session-user",
}));

vi.mock("./LogoutButton", () => ({
  LogoutButton: () => <div data-testid="logout-button" />,
}));

import HomePage from "./page";

describe("Home onboarding page", () => {
  beforeEach(() => {
    headerStore.clear();
  });

  it("renders the onboarding pillars and the entry CTA", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.getAllByText(/Propósito/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Privacidade/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Começar/i).length).toBeGreaterThan(0);

    const cta = screen.getByRole("link", { name: /Começar sessão/i });
    expect(cta.getAttribute("href")).toBe("/auth");
  });

  it("shows the immediate risk notice and privacy explanation", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.getAllByText(/Se estiver em risco imediato/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Como usamos seus dados/i).length).toBeGreaterThan(0);
  });

  it("não exibe o botão de logout quando não há sessão ativa", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.queryByTestId("logout-button")).not.toBeInTheDocument();
  });

  it("exibe o botão de logout quando o header de sessão (repassado pelo proxy) indica usuário autenticado", async () => {
    headerStore.set("x-app-session-user", "1");
    const element = await HomePage();
    render(element);

    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  it("substitui o CTA de login por uma mensagem de sessão ativa quando o usuário está autenticado", async () => {
    headerStore.set("x-app-session-user", "1");
    const element = await HomePage();
    render(element);

    expect(screen.queryByRole("link", { name: /Começar sessão/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Você já está conectado/i)).toBeInTheDocument();
  });
});
