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

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("@/proxy", () => ({ SESSION_USER_HEADER: "x-app-session-user" }));
vi.mock("@/components/nav/PrimaryNav", () => ({
  PrimaryNav: () => <nav data-testid="primary-nav" />,
}));

import InsightsPage from "./page";

describe("InsightsPage", () => {
  beforeEach(() => {
    headerStore.clear();
  });

  it("redireciona para /auth quando não há sessão autenticada", async () => {
    try {
      await InsightsPage();
      throw new Error("esperava que InsightsPage lançasse um redirect");
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain("/auth");
    }
  });

  it("renderiza a tela com a navegação principal para um usuário autenticado", async () => {
    headerStore.set("x-app-session-user", "1");

    const element = await InsightsPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByTestId("primary-nav")).toBeInTheDocument();
  });
});
