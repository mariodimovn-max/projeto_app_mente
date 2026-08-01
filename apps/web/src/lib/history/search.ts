import type { HistorySessionSummary } from "@/types/history";

// Filtro em memória sobre a lista já carregada (Story 3.5, AC2 — resultado em menos de
// 1 segundo): busca por palavra-chave no título gerado ou em qualquer chip de tema.
export function filterSessionsByQuery(
  sessions: HistorySessionSummary[],
  query: string
): HistorySessionSummary[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return sessions;
  }

  return sessions.filter((session) => {
    const haystack = [session.title ?? "", ...session.themes].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
