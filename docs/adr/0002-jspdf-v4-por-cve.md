# 0002 — jsPDF v4.x, nunca v2.5.x (CVE crítico)

**Status:** aceita
**Contexto original:** Story 4.6 (Exportar Resumo em PDF)

## Decisão

A biblioteca de geração de PDF client-side é **jsPDF, fixada em v4.2.1 (ou superior dentro da major
4)**. A v2.5.x tem um CVE crítico de RCE/PDF injection, resolvido via `dompurify`/`canvg` apenas
como dependência opcional a partir da v4.

## Por quê

Geração de PDF 100% client-side (sem round-trip ao servidor) foi a escolha para manter o padrão
"Server Action retorna dados, geração acontece no client" já usado desde a Story 4.4/4.5. jsPDF era
a opção mais simples para esse padrão, mas exige atenção à versão.

## Implicação prática

Ao atualizar ou trocar a dependência de geração de PDF, **sempre rodar `npm audit`** antes de
publicar. Não fazer downgrade para v2.x por nenhum motivo.

## Onde isso aparece no código

- `apps/web/src/lib/pdf/summaryPdf.ts` — `buildSummaryPdf`/`downloadSummaryPdf`
- `apps/web/src/components/insights/` — botão "Exportar PDF" no `SummaryCard`
