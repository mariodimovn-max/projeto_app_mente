// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateWeeklySummaryMock, generateMonthlySummaryMock, downloadSummaryPdfMock } = vi.hoisted(() => ({
  generateWeeklySummaryMock: vi.fn(),
  generateMonthlySummaryMock: vi.fn(),
  downloadSummaryPdfMock: vi.fn(),
}));

vi.mock("@/lib/actions/generateSummary", () => ({
  generateWeeklySummary: generateWeeklySummaryMock,
  generateMonthlySummary: generateMonthlySummaryMock,
}));

vi.mock("@/lib/pdf/summaryPdf", () => ({
  downloadSummaryPdf: downloadSummaryPdfMock,
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
  topics: [{ label: "trabalho", count: 6, previousCount: 3, direction: "up" as const }],
  emotions: [{ label: "cansaço", count: 4, previousCount: 4, direction: "stable" as const }],
  timeline: [{ sessionId: "s2", title: "Um mês olhando para dentro.", createdAt: "2026-08-01T10:00:00Z" }],
  progressNote: "8 sessões neste mês, mais que os 5 do mês passado.",
};

describe("SummaryCard", () => {
  beforeEach(() => {
    generateWeeklySummaryMock.mockReset();
    generateMonthlySummaryMock.mockReset();
    downloadSummaryPdfMock.mockReset();
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

  it("mostra o indicador de tendência (alta/estável) nos chips do resumo mensal, com rótulo acessível", async () => {
    generateMonthlySummaryMock.mockResolvedValue({ summary: MONTH_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Mês" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByText("↑")).toBeInTheDocument();
    expect(screen.getByLabelText("mais presente que no mês anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("no mesmo nível do mês anterior")).toBeInTheDocument();
  });

  it("não mostra indicador de tendência nos chips do resumo semanal", async () => {
    generateWeeklySummaryMock.mockResolvedValue({ summary: WEEK_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    await screen.findByText(WEEK_SUMMARY.progressNote);
    expect(screen.queryByText("↑")).not.toBeInTheDocument();
  });

  it("exibe o erro específico de mês sem sessões sem quebrar a tela", async () => {
    generateMonthlySummaryMock.mockResolvedValue({
      error: "Você ainda não encerrou nenhuma sessão neste último mês. Volte quando tiver algumas para ver seu resumo.",
    });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Mês" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você ainda não encerrou nenhuma sessão");
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

  it("não mostra o botão de exportar PDF antes de um resumo ser gerado", () => {
    render(<SummaryCard />);

    expect(screen.queryByRole("button", { name: "Exportar PDF" })).not.toBeInTheDocument();
  });

  it("exporta o resumo semanal em PDF imediatamente ao clicar em Exportar PDF, sem etapas extras", async () => {
    generateWeeklySummaryMock.mockResolvedValue({ summary: WEEK_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText(WEEK_SUMMARY.progressNote);

    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

    expect(downloadSummaryPdfMock).toHaveBeenCalledTimes(1);
    const [content, filename] = downloadSummaryPdfMock.mock.calls[0]!;
    expect(content.heading).toBe("Resumo da semana");
    expect(content.progressNote).toBe(WEEK_SUMMARY.progressNote);
    expect(content.topics).toEqual([{ label: "sono", trendLabel: undefined }]);
    expect(content.emotions).toEqual([{ label: "ansiedade", trendLabel: undefined }]);
    expect(content.timeline).toHaveLength(1);
    expect(content.timeline[0].title).toBe("Hoje você tocou no medo.");
    expect(filename).toMatch(/^resumo-semana-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it("exporta o resumo mensal em PDF com o rótulo de tendência de cada chip", async () => {
    generateMonthlySummaryMock.mockResolvedValue({ summary: MONTH_SUMMARY });
    render(<SummaryCard />);

    fireEvent.click(screen.getByRole("button", { name: "Mês" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText(MONTH_SUMMARY.progressNote);

    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

    expect(downloadSummaryPdfMock).toHaveBeenCalledTimes(1);
    const [content, filename] = downloadSummaryPdfMock.mock.calls[0]!;
    expect(content.heading).toBe("Resumo do mês");
    expect(content.topics).toEqual([{ label: "trabalho", trendLabel: "mais presente que no mês anterior" }]);
    expect(content.emotions).toEqual([{ label: "cansaço", trendLabel: "no mesmo nível do mês anterior" }]);
    expect(filename).toMatch(/^resumo-mes-\d{4}-\d{2}-\d{2}\.pdf$/);
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
