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

const { getUserMock, getDashboardDataMock, getPersonalMilestonesMock, getWelcomeMessageMock } =
  vi.hoisted(() => ({
    getUserMock: vi.fn(),
    getDashboardDataMock: vi.fn(),
    getPersonalMilestonesMock: vi.fn(),
    getWelcomeMessageMock: vi.fn(),
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

vi.mock("@/lib/milestones/milestones", () => ({
  getPersonalMilestones: getPersonalMilestonesMock,
}));

vi.mock("@/lib/dashboard/welcomeMessage", () => ({
  getWelcomeMessage: getWelcomeMessageMock,
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

vi.mock("@/components/dashboard/PersonalMilestones", () => ({
  PersonalMilestones: ({ initialMilestones }: { initialMilestones: unknown[] }) => (
    <div data-testid="personal-milestones">{initialMilestones.length} marcos</div>
  ),
}));

import HomePage from "./page";

describe("Home onboarding page", () => {
  beforeEach(() => {
    headerStore.clear();
    getUserMock.mockReset();
    getDashboardDataMock.mockReset();
    getPersonalMilestonesMock.mockReset();
    getWelcomeMessageMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getDashboardDataMock.mockResolvedValue({ streakDays: 0, sessionCount: 0, themes: [] });
    getPersonalMilestonesMock.mockResolvedValue([]);
    getWelcomeMessageMock.mockResolvedValue(null);
  });

  it("renders the onboarding hero and the entry CTA", async () => {
    const element = await HomePage();
    render(element);

    expect(screen.getAllByText(/Conheça você/i).length).toBeGreaterThan(0);

    const cta = screen.getByRole("link", { name: /Começar a jornada/i });
    expect(cta.getAttribute("href")).toBe("/auth");
  });

  it("shows the privacy explanation", async () => {
    const element = await HomePage();
    render(element);

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

  it("exibe o link de Configurações quando o usuário está autenticado (Story 5.1)", async () => {
    headerStore.set("x-app-session-user", "1");
    const element = await HomePage();
    render(element);

    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/configuracoes"
    );
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

  it("não busca dados do dashboard nem marcos pessoais quando não há sessão ativa", async () => {
    const element = await HomePage();
    render(element);

    expect(getDashboardDataMock).not.toHaveBeenCalled();
    expect(getPersonalMilestonesMock).not.toHaveBeenCalled();
    expect(getWelcomeMessageMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("dashboard-stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("personal-milestones")).not.toBeInTheDocument();
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

  it("carrega e renderiza os marcos pessoais do usuário autenticado (Story 4.3, AC1)", async () => {
    headerStore.set("x-app-session-user", "1");
    getPersonalMilestonesMock.mockResolvedValue([
      { id: "m1", title: "Meu foco", theme: "dinheiro", progress: 2, createdAt: "2026-08-01T10:00:00Z" },
    ]);

    const element = await HomePage();
    render(element);

    expect(getPersonalMilestonesMock).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(screen.getByTestId("personal-milestones")).toHaveTextContent("1 marcos");
  });

  it("mostra uma mensagem de erro amigável quando a busca dos marcos pessoais falha, sem afetar os indicadores", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({ streakDays: 5, sessionCount: 12, themes: [] });
    getPersonalMilestonesMock.mockRejectedValue(new Error("db down"));

    const element = await HomePage();
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(/Não consegui carregar seus marcos/i);
    expect(screen.getByTestId("dashboard-stats")).toBeInTheDocument();
    expect(screen.queryByTestId("personal-milestones")).not.toBeInTheDocument();
  });

  it("redireciona para /auth quando o header indica sessão mas o Supabase não confirma nenhum usuário (cookie obsoleto)", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(HomePage()).rejects.toThrow();

    try {
      await HomePage();
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain("/auth");
    }
    expect(getDashboardDataMock).not.toHaveBeenCalled();
  });

  it("recebe quem ainda não tem nenhuma sessão nem streak com uma saudação de primeira visita, não 'de novo'", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({ streakDays: 0, sessionCount: 0, themes: [] });

    const element = await HomePage();
    render(element);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toMatch(/Seu espaço/);
    expect(heading.textContent).toMatch(/está pronto/);
    expect(heading.textContent).not.toMatch(/Bom te ver/);
  });

  it("recebe quem já tem streak ou sessões com a saudação 'de novo', mesmo sem sessão concluída ainda (sessão em andamento)", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({ streakDays: 2, sessionCount: 0, themes: [] });

    const element = await HomePage();
    render(element);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toMatch(/Bom te ver/);
    expect(heading.textContent).toMatch(/de novo/);
    expect(heading.textContent).not.toMatch(/está pronto/);
  });

  it("exibe a mensagem de boas-vindas gerada por IA ao lado da Aura quando o usuário já tem histórico", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({ streakDays: 5, sessionCount: 12, themes: [] });
    getWelcomeMessageMock.mockResolvedValue("Você tem voltado para si, aos poucos.");

    const element = await HomePage();
    render(element);

    expect(getWelcomeMessageMock).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(screen.getByText("Você tem voltado para si, aos poucos.")).toBeInTheDocument();
  });

  it("não exibe mensagem de boas-vindas gerada por IA na primeira visita (sem histórico para refletir)", async () => {
    headerStore.set("x-app-session-user", "1");
    getDashboardDataMock.mockResolvedValue({ streakDays: 0, sessionCount: 0, themes: [] });
    getWelcomeMessageMock.mockResolvedValue("Você não precisa mergulhar hoje.");

    const element = await HomePage();
    render(element);

    expect(screen.queryByText("Você não precisa mergulhar hoje.")).not.toBeInTheDocument();
  });
});
