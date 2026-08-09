import { describe, expect, it } from "vitest";
import { computeStreakDays, getDashboardData } from "./dashboard";

describe("computeStreakDays", () => {
  const today = new Date("2026-08-09T15:00:00Z");

  it("retorna 0 quando não há nenhuma sessão", () => {
    expect(computeStreakDays([], today)).toBe(0);
  });

  it("conta sessões em dias consecutivos terminando hoje", () => {
    const dates = [
      "2026-08-09T09:00:00Z",
      "2026-08-08T09:00:00Z",
      "2026-08-07T09:00:00Z",
    ];
    expect(computeStreakDays(dates, today)).toBe(3);
  });

  it("não quebra o streak quando não há sessão hoje, mas houve ontem", () => {
    const dates = ["2026-08-08T09:00:00Z", "2026-08-07T09:00:00Z"];
    expect(computeStreakDays(dates, today)).toBe(2);
  });

  it("quebra o streak quando falta um dia inteiro (hoje e ontem sem sessão)", () => {
    const dates = ["2026-08-06T09:00:00Z"];
    expect(computeStreakDays(dates, today)).toBe(0);
  });

  it("para de contar no primeiro buraco, ignorando dias mais antigos que ele", () => {
    const dates = [
      "2026-08-09T09:00:00Z",
      "2026-08-08T09:00:00Z",
      "2026-08-06T09:00:00Z", // buraco em 08-07
    ];
    expect(computeStreakDays(dates, today)).toBe(2);
  });

  it("conta múltiplas sessões no mesmo dia como um único dia", () => {
    const dates = [
      "2026-08-09T09:00:00Z",
      "2026-08-09T21:00:00Z",
      "2026-08-08T09:00:00Z",
    ];
    expect(computeStreakDays(dates, today)).toBe(2);
  });
});

function makeSessionsBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    returns: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return builder;
}

function makeUserPatternsBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => result,
  };
  return builder;
}

describe("getDashboardData", () => {
  it("combina sessionCount e temas do agregado com o streak calculado a partir das sessões", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "sessions") {
          return makeSessionsBuilder({
            data: [
              { created_at: "2026-08-09T09:00:00Z" },
              { created_at: "2026-08-08T09:00:00Z" },
            ],
            error: null,
          });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({
            data: {
              themes: { sono: 5, rotina: 3, trabalho: 1 },
              emotions: {},
              triggers: {},
              session_count: 12,
            },
            error: null,
          });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getDashboardData(supabase as never, "user-1");

    expect(result).toEqual({
      streakDays: 2,
      sessionCount: 12,
      themes: [
        { label: "sono", count: 5 },
        { label: "rotina", count: 3 },
        { label: "trabalho", count: 1 },
      ],
    });
  });

  it("limita temas aos 6 mais frequentes, em ordem decrescente", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "sessions") {
          return makeSessionsBuilder({ data: [], error: null });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({
            data: {
              themes: { a: 1, b: 7, c: 2, d: 6, e: 3, f: 5, g: 4 },
              emotions: {},
              triggers: {},
              session_count: 7,
            },
            error: null,
          });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getDashboardData(supabase as never, "user-1");

    expect(result.themes.map((theme) => theme.label)).toEqual(["b", "d", "f", "g", "e", "c"]);
  });

  it("retorna zeros e lista vazia quando o usuário ainda não tem agregado nem sessões", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "sessions") {
          return makeSessionsBuilder({ data: [], error: null });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({ data: null, error: null });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getDashboardData(supabase as never, "user-1");

    expect(result).toEqual({ streakDays: 0, sessionCount: 0, themes: [] });
  });

  it("propaga o erro quando a consulta de sessões falha", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "sessions") {
          return makeSessionsBuilder({ data: null, error: new Error("db down") });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({ data: null, error: null });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    await expect(getDashboardData(supabase as never, "user-1")).rejects.toThrow("db down");
  });
});
