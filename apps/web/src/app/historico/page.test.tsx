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

const { getUserMock, listSessionHistoryMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  listSessionHistoryMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("@/proxy", () => ({ SESSION_USER_HEADER: "x-app-session-user" }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("@/lib/history/sessions", () => ({ listSessionHistory: listSessionHistoryMock }));
vi.mock("@/components/history/HistoryList", () => ({
  HistoryList: ({ initialSessions }: { initialSessions: unknown[] }) => (
    <div data-testid="history-list">{initialSessions.length} sessões</div>
  ),
}));
vi.mock("@/components/nav/PrimaryNav", () => ({
  PrimaryNav: () => <nav data-testid="primary-nav" />,
}));

import HistoryPage from "./page";

describe("HistoryPage", () => {
  beforeEach(() => {
    headerStore.clear();
    getUserMock.mockReset();
    listSessionHistoryMock.mockReset();
  });

  it("redireciona para /auth quando não há sessão autenticada", async () => {
    await expect(HistoryPage()).rejects.toThrow();

    try {
      await HistoryPage();
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain("/auth");
    }
  });

  it("carrega e renderiza a lista de sessões do usuário autenticado", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    listSessionHistoryMock.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);

    const element = await HistoryPage();
    render(element);

    expect(listSessionHistoryMock).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(screen.getByTestId("history-list")).toHaveTextContent("2 sessões");
    expect(screen.getByTestId("primary-nav")).toBeInTheDocument();
  });

  it("mostra uma mensagem de erro amigável quando a busca do histórico falha", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    listSessionHistoryMock.mockRejectedValue(new Error("db down"));

    const element = await HistoryPage();
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(/Não consegui carregar seu histórico/i);
    expect(screen.queryByTestId("history-list")).not.toBeInTheDocument();
  });
});
