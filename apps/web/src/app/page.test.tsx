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

const { getUserMock, getDashboardDataMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getDashboardDataMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/proxy", () => ({
  SESSION_USER_HEADER: "x-app-session-user",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));

vi.mock("@/lib/dashboard/dashboard", () => ({
  getDashboardData: getDashboardDataMock,
}));

vi.mock("./LogoutButton", () => ({
  LogoutButton: () => <div data-testid="logout-button" />,
}));

vi.mock("@/components/nav/PrimaryNav", () => ({
  PrimaryNav: () => <nav data-testid="primary-nav" />,
}));

vi.mock("@/components/dashboard/DashboardStats", () => ({
  DashboardStats: ({ data }: { data: { streakDays: number; sessionCount: number } }) => (
    <div data-testid="dashboard-stats">
      {data.streakDays} dias · {data.sessionCount} sessões
    </div>
  ),
}));

import HomePage from "./page";

describe("Home onboarding page", () => {
  beforeEach(() => {
    headerStore.clear();
    getUserMock.mockReset();
    getDashboardDataMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getDashboardDataMock.mockResolvedValue({ streakDays: 0, sessionCount: 0, themes: [] });
  });

  it("renders the onboarding pillars and the entry CTA", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.getAllByText(/Propósito/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Privacidade/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Começar/i).length).toBeGreaterThan(0);

    const cta = screen.getByRole("link", { name: /Começar a jornada/i });
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

  it("exibe a navegação principal quando o usuário está autenticado (Story 4.1)", async () => {
    headerStore.set("x-app-session-user", "1");
    const element = await HomePage();
    render(element);

    expect(screen.getByTestId("primary-nav")).toBeInTheDocument();
  });

  it("não exibe a navegação principal quando não há sessão ativa", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.queryByTestId("primary-nav")).not.toBeInTheDocument();
  });

  it("substitui o CTA de login por um link para o chat quando o usuário está autenticado", async () => {
    headerStore.set("x-app-session-user", "1");
    const element = await HomePage();
    render(element);

    expect(screen.queryByRole("link", { name: /Começar a jornada/i })).not.toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Ir para o chat/i });
    expect(cta.getAttribute("href")).toBe("/chat");
  });

  it("não busca dados do dashboard quando não há sessão ativa", async () => {
    const element = await HomePage();
    render(element);

    expect(getDashboardDataMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("dashboard-stats")).not.toBeInTheDocument();
  });

  it("carrega e renderiza os indicadores de evolução do usuário autenticado (Story 4.2, AC1/AC2)", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({
      streakDays: 5,
      sessionCount: 12,
      themes: [{ label: "sono", count: 3 }],
    });

    const element = await HomePage();
    render(element);

    expect(getDashboardDataMock).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(screen.getByTestId("dashboard-stats")).toHaveTextContent("5 dias · 12 sessões");
    expect(screen.queryByText(/Conheça você/i)).not.toBeInTheDocument();
  });

  it("mostra uma mensagem de erro amigável quando a busca dos indicadores falha", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockRejectedValue(new Error("db down"));

    const element = await HomePage();
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(/Não consegui carregar seu retrato/i);
    expect(screen.queryByTestId("dashboard-stats")).not.toBeInTheDocument();
  });
});
