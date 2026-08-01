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

const { getUserMock, getSessionDetailMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getSessionDetailMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("@/proxy", () => ({ SESSION_USER_HEADER: "x-app-session-user" }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("@/lib/history/sessions", () => ({ getSessionDetail: getSessionDetailMock }));
vi.mock("@/components/insights/SynthesisCard", () => ({
  SynthesisCard: ({ synthesis }: { synthesis: { title: string } }) => (
    <div data-testid="synthesis-card">{synthesis.title}</div>
  ),
}));

import SessionDetailPage from "./page";

const VALID_SESSION_ID = "11111111-1111-4111-8111-111111111111";

function makeParams(sessionId: string) {
  return Promise.resolve({ sessionId });
}

describe("SessionDetailPage", () => {
  beforeEach(() => {
    headerStore.clear();
    getUserMock.mockReset();
    getSessionDetailMock.mockReset();
  });

  it("redireciona para /auth quando não há sessão autenticada", async () => {
    await expect(SessionDetailPage({ params: makeParams(VALID_SESSION_ID) })).rejects.toThrow();

    try {
      await SessionDetailPage({ params: makeParams(VALID_SESSION_ID) });
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain("/auth");
    }
  });

  it("retorna 404 quando o sessionId não tem formato de UUID", async () => {
    headerStore.set("x-app-session-user", "1");

    try {
      await SessionDetailPage({ params: makeParams("not-a-uuid") });
      throw new Error("deveria ter lançado notFound()");
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    }
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a sessão não existe ou não pertence ao usuário", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getSessionDetailMock.mockResolvedValue(null);

    try {
      await SessionDetailPage({ params: makeParams(VALID_SESSION_ID) });
      throw new Error("deveria ter lançado notFound()");
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  });

  it("renderiza as mensagens e a síntese da sessão", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getSessionDetailMock.mockResolvedValue({
      id: VALID_SESSION_ID,
      createdAt: "2026-07-25T10:00:00Z",
      messages: [{ id: "m1", role: "user", content: "Oi", createdAt: "2026-07-25T10:00:00Z" }],
      synthesis: { id: "synthesis-1", title: "Título gerado" },
    });

    const element = await SessionDetailPage({ params: makeParams(VALID_SESSION_ID) });
    render(element);

    expect(screen.getByText("Oi")).toBeInTheDocument();
    expect(screen.getByTestId("synthesis-card")).toHaveTextContent("Título gerado");
  });

  it("mostra um erro amigável quando a busca da sessão falha", async () => {
    headerStore.set("x-app-session-user", "1");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getSessionDetailMock.mockRejectedValue(new Error("db down"));

    const element = await SessionDetailPage({ params: makeParams(VALID_SESSION_ID) });
    render(element);

    expect(screen.getByRole("alert")).toHaveTextContent(/Não consegui carregar essa sessão/i);
  });
});
