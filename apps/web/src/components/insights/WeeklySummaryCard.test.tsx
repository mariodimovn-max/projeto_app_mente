// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateWeeklySummaryMock } = vi.hoisted(() => ({
  generateWeeklySummaryMock: vi.fn(),
}));

vi.mock("@/lib/actions/generateSummary", () => ({
  generateWeeklySummary: generateWeeklySummaryMock,
}));

const { WeeklySummaryCard } = await import("./WeeklySummaryCard");

const SUMMARY = {
  periodStart: "2026-08-03T12:00:00Z",
  periodEnd: "2026-08-10T12:00:00Z",
  sessionCount: 2,
  previousSessionCount: 1,
  topics: [{ label: "sono", count: 2 }],
  emotions: [{ label: "ansiedade", count: 1 }],
  timeline: [{ sessionId: "s1", title: "Hoje você tocou no medo.", createdAt: "2026-08-09T10:00:00Z" }],
  progressNote: "2 sessões nesta semana, mais que a 1 da semana passada.",
};

describe("WeeklySummaryCard", () => {
  beforeEach(() => {
    generateWeeklySummaryMock.mockReset();
  });

  it("mostra o texto inicial e o botão de gerar antes de qualquer resumo", () => {
    render(<WeeklySummaryCard />);

    expect(
      screen.getByText("Veja os principais temas e emoções dos últimos 7 dias, reunidos em um só lugar.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar resumo" })).toBeInTheDocument();
  });

  it("gera e exibe o resumo com temas, emoções, linha do tempo e nota de progresso", async () => {
    generateWeeklySummaryMock.mockResolvedValue({ summary: SUMMARY });
    render(<WeeklySummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByText(SUMMARY.progressNote)).toBeInTheDocument();
    expect(screen.getByText("sono")).toBeInTheDocument();
    expect(screen.getByText("ansiedade")).toBeInTheDocument();
    expect(screen.getByText("Hoje você tocou no medo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar de novo" })).toBeInTheDocument();
  });

  it("exibe o erro retornado pela Server Action sem quebrar a tela", async () => {
    generateWeeklySummaryMock.mockResolvedValue({
      error: "Você ainda não encerrou nenhuma sessão nesta última semana. Volte quando tiver algumas para ver seu resumo.",
    });
    render(<WeeklySummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você ainda não encerrou nenhuma sessão");
  });

  it("exibe erro genérico quando a chamada rejeita inesperadamente", async () => {
    generateWeeklySummaryMock.mockRejectedValue(new Error("network down"));
    render(<WeeklySummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não consegui gerar o resumo agora. Tente novamente."
    );
  });

  it("limpa o resumo anterior quando uma nova geração rejeita inesperadamente, para não mostrar dado desatualizado junto do erro", async () => {
    generateWeeklySummaryMock.mockResolvedValueOnce({ summary: SUMMARY });
    render(<WeeklySummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText(SUMMARY.progressNote);

    generateWeeklySummaryMock.mockRejectedValueOnce(new Error("network down"));
    fireEvent.click(screen.getByRole("button", { name: "Gerar de novo" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(SUMMARY.progressNote)).not.toBeInTheDocument();
  });
});
