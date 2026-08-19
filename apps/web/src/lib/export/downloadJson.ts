// Dispara o download de um JSON no browser (Story 5.1, AC2) — mesmo padrão de
// lib/pdf/summaryPdf.ts: a Server Action retorna dados puros, a geração/entrega do
// arquivo acontece inteiramente no client, sem round-trip extra ao servidor.
export function downloadJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
