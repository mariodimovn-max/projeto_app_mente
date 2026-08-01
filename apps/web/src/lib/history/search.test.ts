import { describe, expect, it } from "vitest";
import { filterSessionsByQuery } from "./search";
import type { HistorySessionSummary } from "@/types/history";

function makeSession(overrides: Partial<HistorySessionSummary> = {}): HistorySessionSummary {
  return {
    id: "session-1",
    createdAt: "2026-07-25T10:00:00Z",
    title: "Noite de pensamento sobre propósito",
    themes: ["sono", "ansiedade"],
    hasSynthesis: true,
    marked: false,
    ...overrides,
  };
}

describe("filterSessionsByQuery", () => {
  it("retorna todas as sessões quando a busca está vazia", () => {
    const sessions = [makeSession({ id: "a" }), makeSession({ id: "b" })];

    expect(filterSessionsByQuery(sessions, "")).toEqual(sessions);
    expect(filterSessionsByQuery(sessions, "   ")).toEqual(sessions);
  });

  it("encontra por palavra-chave no título, sem diferenciar maiúsculas/minúsculas", () => {
    const sessions = [
      makeSession({ id: "a", title: "Noite de pensamento sobre propósito" }),
      makeSession({ id: "b", title: "Conversa sobre trabalho" }),
    ];

    expect(filterSessionsByQuery(sessions, "PROPÓSITO").map((s) => s.id)).toEqual(["a"]);
  });

  it("encontra por tema", () => {
    const sessions = [
      makeSession({ id: "a", themes: ["sono", "rotina"] }),
      makeSession({ id: "b", themes: ["trabalho"] }),
    ];

    expect(filterSessionsByQuery(sessions, "sono").map((s) => s.id)).toEqual(["a"]);
  });

  it("não quebra e não encontra nada quando o título é null (sessão sem síntese)", () => {
    const sessions = [makeSession({ id: "a", title: null, themes: [], hasSynthesis: false })];

    expect(filterSessionsByQuery(sessions, "propósito")).toEqual([]);
  });

  it("retorna lista vazia quando nada corresponde à busca", () => {
    const sessions = [makeSession()];

    expect(filterSessionsByQuery(sessions, "algo que não existe")).toEqual([]);
  });
});
