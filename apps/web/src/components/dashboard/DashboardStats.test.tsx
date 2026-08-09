// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardStats } from "./DashboardStats";

describe("DashboardStats", () => {
  it("exibe dias consecutivos, sessões concluídas e temas explorados (Story 4.2, AC1)", () => {
    render(
      <DashboardStats
        data={{
          streakDays: 5,
          sessionCount: 12,
          themes: [
            { label: "autocobrança", count: 7 },
            { label: "trabalho", count: 6 },
          ],
        }}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/dias seguidos aqui/)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/conversas concluídas/)).toBeInTheDocument();
    expect(screen.getByText("autocobrança")).toBeInTheDocument();
    expect(screen.getByText("trabalho")).toBeInTheDocument();
  });

  it("usa singular quando o streak ou a contagem de sessões é 1", () => {
    render(<DashboardStats data={{ streakDays: 1, sessionCount: 1, themes: [] }} />);

    expect(screen.getByText("dia seguido aqui")).toBeInTheDocument();
    expect(screen.getByText("conversa concluída")).toBeInTheDocument();
  });

  it("não renderiza o bloco de temas quando não há nenhum", () => {
    render(<DashboardStats data={{ streakDays: 1, sessionCount: 1, themes: [] }} />);

    expect(screen.queryByText("Temas que você tem explorado")).not.toBeInTheDocument();
  });

  it("mostra um estado vazio acolhedor em vez de zeros quando o usuário ainda não concluiu nenhuma sessão", () => {
    render(<DashboardStats data={{ streakDays: 0, sessionCount: 0, themes: [] }} />);

    expect(
      screen.getByText("Seu retrato aparece aqui depois da primeira conversa encerrada.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Começar uma conversa" })).toHaveAttribute(
      "href",
      "/chat"
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("mostra o streak em vez do estado vazio quando há sessões em dias consecutivos mas nenhuma ainda foi encerrada com síntese", () => {
    render(<DashboardStats data={{ streakDays: 3, sessionCount: 0, themes: [] }} />);

    expect(
      screen.queryByText("Seu retrato aparece aqui depois da primeira conversa encerrada.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/dias seguidos aqui/)).toBeInTheDocument();
  });

  it("não exibe elementos de gamification como pontuação, nível ou selos (Story 4.2, AC3)", () => {
    render(
      <DashboardStats
        data={{ streakDays: 5, sessionCount: 12, themes: [{ label: "sono", count: 2 }] }}
      />
    );

    expect(screen.queryByText(/\bXP\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/badge|medalha|troféu|placar|ranking/i)).not.toBeInTheDocument();
  });

  it("expõe a seção com um rótulo acessível", () => {
    render(<DashboardStats data={{ streakDays: 3, sessionCount: 4, themes: [] }} />);

    expect(
      screen.getByRole("region", { name: "Seus indicadores de evolução" })
    ).toBeInTheDocument();
  });
});
