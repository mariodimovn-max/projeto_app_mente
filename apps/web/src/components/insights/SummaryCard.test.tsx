// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateWeeklySummaryMock, generateMonthlySummaryMock } = vi.hoisted(() => ({
  generateWeeklySummaryMock: vi.fn(),
  generateMonthlySummaryMock: vi.fn(),
}));

vi.mock("@/lib/actions/generateSummary", () => ({
  generateWeeklySummary: generateWeeklySummaryMock,
  generateMonthlySummary: generateMonthlySummaryMock,
}));

const { SummaryCard } = await import("./SummaryCard");

const WEEK_SUMMARY = {
  periodStart: "2026-08-03T12:00:00Z",
  periodEnd: "2026-08-10T12:00:00Z",
  sessionCount: 2,
  previousSessionCount: 1,
  topics: [{ label: "sono", count: 2 }],
  emotions: [{ label: "ansiedade", count: 1 }],
  timeline: [{ sessionId: "s1", title: "Hoje você tocou no medo.", createdAt: "2026-08-09T10:00:00Z" }],
  progressNote: "2 sessões nesta semana, mais que a 1 da semana passada.",
};

const MONTH_SUMMARY = {
  periodStart: "2026-07-11T12:00:00Z",
  periodEnd: "2026-08-10T12:00:00Z",
  sessionCount: 8,
  previousSessionCount: 5,
  topics: [{ label: "trabalho", count: 6 }],
  emotions: [{ label: "cansaço", count: 4 }],
  timeline: [{ sessionId: "s2", title: "Um mês olhando para dentro.", createdAt: "2026-08-01T10:00:00Z" }],
  progressNote: "8 sessões neste mês, mais que os 5 do mês passado.",
};

describe("SummaryCard", () => {
  beforeEach(() => {
    generateWeeklySummaryMock.mockReset();
    generateMonthlySummaryMock.mockReset();
  });

  it("mostra o texto inicial e o botão de gerar com Semana selecionada por padrão", () => {
    render(<SummaryCard />);

    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mês" })).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText("Veja os principais temas e emoções dos últimos 7 dias, reunidos em um só lugar.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar resumo" })).toBeInTheDocument();
  });

  it("gera e exibe o resumo semanal com temas, emoções, linha do tempo e nota de progresso", async () => {
    generateWeeklySummaryMock.mockResolvedValue({ summary: WEEK_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByText(WEEK_SUMMARY.progressNote)).toBeInTheDocument();
    expect(screen.getByText("sono")).toBeInTheDocument();
    expect(screen.getByText("ansiedade")).toBeInTheDocument();
    expect(screen.getByText("Hoje você tocou no medo.")).toBeInTheDocument();
    expect(generateMonthlySummaryMock).not.toHaveBeenCalled();
  });

  it("seleciona Mês e gera o resumo mensal chamando a Server Action correta", async () => {
    generateMonthlySummaryMock.mockResolvedValue({ summary: MONTH_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Mês" }));
    expect(
      screen.getByText("Veja os principais temas e emoções dos últimos 30 dias, reunidos em um só lugar.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByText(MONTH_SUMMARY.progressNote)).toBeInTheDocument();
    expect(screen.getByText("trabalho")).toBeInTheDocument();
    expect(screen.getByText("cansaço")).toBeInTheDocument();
    expect(generateWeeklySummaryMock).not.toHaveBeenCalled();
  });

  it("limpa o resumo exibido ao trocar de período, para não mostrar dado do outro período", async () => {
    generateWeeklySummaryMock.mockResolvedValue({ summary: WEEK_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText(WEEK_SUMMARY.progressNote);

    fireEvent.click(screen.getByRole("button", { name: "Mês" }));

    expect(screen.queryByText(WEEK_SUMMARY.progressNote)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar resumo" })).toBeInTheDocument();
  });

  it("exibe o erro retornado pela Server Action sem quebrar a tela", async () => {
    generateWeeklySummaryMock.mockResolvedValue({
      error: "Você ainda não encerrou nenhuma sessão nesta última semana. Volte quando tiver algumas para ver seu resumo.",
    });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você ainda não encerrou nenhuma sessão");
  });

  it("exibe erro genérico quando a chamada rejeita inesperadamente", async () => {
    generateWeeklySummaryMock.mockRejectedValue(new Error("network down"));
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não consegui gerar o resumo agora. Tente novamente."
    );
  });

  it("limpa o resumo anterior quando uma nova geração rejeita inesperadamente, para não mostrar dado desatualizado junto do erro", async () => {
    generateWeeklySummaryMock.mockResolvedValueOnce({ summary: WEEK_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText(WEEK_SUMMARY.progressNote);

    generateWeeklySummaryMock.mockRejectedValueOnce(new Error("network down"));
    fireEvent.click(screen.getByRole("button", { name: "Gerar de novo" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(WEEK_SUMMARY.progressNote)).not.toBeInTheDocument();
  });
});
