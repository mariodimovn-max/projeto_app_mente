import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SummaryPdfContent } from "./summaryPdf";

const { jsPDFMock, instances } = vi.hoisted(() => {
  const instances: {
    setFont: ReturnType<typeof vi.fn>;
    setFontSize: ReturnType<typeof vi.fn>;
    setTextColor: ReturnType<typeof vi.fn>;
    splitTextToSize: ReturnType<typeof vi.fn>;
    text: ReturnType<typeof vi.fn>;
    addPage: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  }[] = [];

  const jsPDFMock = vi.fn().mockImplementation(function jsPDFMockImpl() {
    const instance = {
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      splitTextToSize: vi.fn((text: string) => [text]),
      text: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
    };
    instances.push(instance);
    return instance;
  });

  return { jsPDFMock, instances };
});

vi.mock("jspdf", () => ({ jsPDF: jsPDFMock }));

const { buildSummaryPdf, downloadSummaryPdf } = await import("./summaryPdf");

const CONTENT: SummaryPdfContent = {
  heading: "Resumo da semana",
  periodLabel: "03 ago – 10 ago",
  progressNote: "2 sessões nesta semana, mais que a 1 da semana passada.",
  topics: [{ label: "sono" }, { label: "trabalho", trendLabel: "mais presente que no mês anterior" }],
  emotions: [{ label: "ansiedade" }],
  timeline: [{ date: "09 ago dom", title: "Hoje você tocou no medo." }],
  privacyCaption: "Este resumo reflete só temas e emoções, sem trechos das suas conversas.",
};

function calledWithText(instance: (typeof instances)[number], expected: string): boolean {
  return instance.text.mock.calls.some((call) => Array.isArray(call[0]) && call[0].includes(expected));
}

function lastInstance(): (typeof instances)[number] {
  const instance = instances.at(-1);
  if (!instance) {
    throw new Error("jsPDF mock instance not created");
  }
  return instance;
}

describe("summaryPdf", () => {
  beforeEach(() => {
    instances.length = 0;
    jsPDFMock.mockClear();
  });

  it("escreve cabeçalho, período e nota de progresso no PDF", () => {
    buildSummaryPdf(CONTENT);
    const instance = lastInstance();

    expect(calledWithText(instance, "Resumo da semana")).toBe(true);
    expect(calledWithText(instance, "03 ago – 10 ago")).toBe(true);
    expect(calledWithText(instance, CONTENT.progressNote)).toBe(true);
  });

  it("escreve temas com o rótulo de tendência quando presente, e sem ele quando ausente", () => {
    buildSummaryPdf(CONTENT);
    const instance = lastInstance();

    expect(calledWithText(instance, "• sono")).toBe(true);
    expect(calledWithText(instance, "• trabalho (mais presente que no mês anterior)")).toBe(true);
  });

  it("escreve emoções e linha do tempo", () => {
    buildSummaryPdf(CONTENT);
    const instance = lastInstance();

    expect(calledWithText(instance, "• ansiedade")).toBe(true);
    expect(calledWithText(instance, "09 ago dom — Hoje você tocou no medo.")).toBe(true);
  });

  it("omite o bloco de temas/emoções quando a lista vem vazia", () => {
    buildSummaryPdf({ ...CONTENT, topics: [], emotions: [] });
    const instance = lastInstance();

    expect(calledWithText(instance, "Principais temas")).toBe(false);
    expect(calledWithText(instance, "Emoções dominantes")).toBe(false);
  });

  it("escreve o aviso de privacidade", () => {
    buildSummaryPdf(CONTENT);
    const instance = lastInstance();

    expect(calledWithText(instance, CONTENT.privacyCaption)).toBe(true);
  });

  it("downloadSummaryPdf salva o arquivo com o nome informado", () => {
    downloadSummaryPdf(CONTENT, "resumo-semana-2026-08-10.pdf");
    const instance = lastInstance();

    expect(instance.save).toHaveBeenCalledWith("resumo-semana-2026-08-10.pdf");
  });
});
