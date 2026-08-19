import { jsPDF } from "jspdf";

export interface SummaryPdfChip {
  label: string;
  trendLabel?: string;
}

export interface SummaryPdfTimelineEntry {
  date: string;
  title: string;
}

export interface SummaryPdfContent {
  heading: string;
  periodLabel: string;
  progressNote: string;
  topics: SummaryPdfChip[];
  emotions: SummaryPdfChip[];
  timeline: SummaryPdfTimelineEntry[];
  privacyCaption: string;
}

const PAGE_MARGIN_MM = 18;
const PAGE_HEIGHT_MM = 297;
const CONTENT_WIDTH_MM = 210 - PAGE_MARGIN_MM * 2;

// Constrói o PDF a partir de um "view model" já formatado (strings prontas, sem Date/ISO) —
// a formatação de data com fuso fixo (America/Sao_Paulo) e os rótulos de tendência já
// existem em SummaryCard.tsx; duplicar essa lógica aqui reintroduziria o risco documentado
// no CLAUDE.md (Story 4.4) de comparar/exibir datas fora do fuso combinado.
export function buildSummaryPdf(content: SummaryPdfContent): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let cursorY = PAGE_MARGIN_MM;

  function ensureSpace(nextBlockHeight: number) {
    if (cursorY + nextBlockHeight > PAGE_HEIGHT_MM - PAGE_MARGIN_MM) {
      doc.addPage();
      cursorY = PAGE_MARGIN_MM;
    }
  }

  function writeParagraph(text: string, fontSize: number, style: "normal" | "bold" = "normal") {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    const lines: string[] = doc.splitTextToSize(text, CONTENT_WIDTH_MM);
    const lineHeight = fontSize * 0.5;
    ensureSpace(lines.length * lineHeight);
    doc.text(lines, PAGE_MARGIN_MM, cursorY);
    cursorY += lines.length * lineHeight;
  }

  function writeSpacer(height: number) {
    cursorY += height;
  }

  function writeChipList(label: string, chips: SummaryPdfChip[]) {
    if (chips.length === 0) {
      return;
    }
    writeSpacer(4);
    writeParagraph(label, 11, "bold");
    for (const chip of chips) {
      const line = chip.trendLabel ? `• ${chip.label} (${chip.trendLabel})` : `• ${chip.label}`;
      writeParagraph(line, 10);
    }
  }

  writeParagraph(content.heading, 16, "bold");
  writeParagraph(content.periodLabel, 11);
  writeSpacer(4);
  writeParagraph(content.progressNote, 12);

  writeChipList("Principais temas", content.topics);
  writeChipList("Emoções dominantes", content.emotions);

  if (content.timeline.length > 0) {
    writeSpacer(4);
    writeParagraph("Linha do tempo", 11, "bold");
    for (const entry of content.timeline) {
      writeParagraph(`${entry.date} — ${entry.title}`, 10);
    }
  }

  writeSpacer(6);
  doc.setTextColor(120, 120, 120);
  writeParagraph(content.privacyCaption, 9);
  doc.setTextColor(0, 0, 0);

  return doc;
}

export function downloadSummaryPdf(content: SummaryPdfContent, filename: string): void {
  buildSummaryPdf(content).save(filename);
}
