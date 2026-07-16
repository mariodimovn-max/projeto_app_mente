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

vi.mock("@/components/chat/ChatWindow", () => ({
  ChatWindow: () => <div data-testid="chat-window" />,
}));

import ChatPage from "./page";

describe("ChatPage", () => {
  beforeEach(() => {
    headerStore.clear();
  });

  it("redireciona para /auth quando não há sessão autenticada", async () => {
    await expect(ChatPage()).rejects.toThrow();

    try {
      await ChatPage();
    } catch (error) {
      expect((error as Error & { digest?: string }).digest).toContain("/auth");
    }
  });

  it("renderiza o ChatWindow quando o usuário está autenticado", async () => {
    headerStore.set("x-app-session-user", "1");

    const element = await ChatPage();
    render(element);

    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
  });
});
