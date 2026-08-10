import { describe, expect, it } from "vitest";
import { getWeeklySummaryData } from "./weeklySummary";

function makeSynthesesBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    gte: () => builder,
    order: () => builder,
    limit: () => builder,
    returns: () => builder,
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return builder;
}

const REFERENCE_DATE = new Date("2026-08-10T12:00:00Z");

describe("getWeeklySummaryData", () => {
  it("agrega temas e emoções da semana atual, ignorando linhas da semana anterior", async () => {
    const supabase = {
      from: (table: string) => {
        if (table !== "session_syntheses") {
          throw new Error(`Tabela inesperada: ${table}`);
        }
        return makeSynthesesBuilder({
          data: [
            {
              session_id: "s1",
              title: "Título 1",
              themes: ["Sono", "rotina"],
              emotions: ["ansiedade"],
              created_at: "2026-08-09T10:00:00Z",
            },
            {
              session_id: "s2",
              title: "Título 2",
              themes: ["sono"],
              emotions: ["ansiedade", "alívio"],
              created_at: "2026-08-08T10:00:00Z",
            },
            {
              // Semana anterior — deve entrar em previousSessionCount, não em topics/emotions.
              session_id: "s3",
              title: "Título 3",
              themes: ["trabalho"],
              emotions: ["cansaço"],
              created_at: "2026-08-01T10:00:00Z",
            },
          ],
          error: null,
        });
      },
    };

    const result = await getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(2);
    expect(result.previousSessionCount).toBe(1);
    expect(result.topics).toEqual([
      { label: "sono", count: 2 },
      { label: "rotina", count: 1 },
    ]);
    expect(result.emotions).toEqual([
      { label: "ansiedade", count: 2 },
      { label: "alívio", count: 1 },
    ]);
    expect(result.timeline).toEqual([
      { sessionId: "s2", title: "Título 2", createdAt: "2026-08-08T10:00:00Z" },
      { sessionId: "s1", title: "Título 1", createdAt: "2026-08-09T10:00:00Z" },
    ]);
  });

  it("deduplica temas repetidos dentro da mesma sessão antes de contar", async () => {
    const supabase = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            {
              session_id: "s1",
              title: "Título 1",
              themes: ["Sono", "sono"],
              emotions: [],
              created_at: "2026-08-09T10:00:00Z",
            },
          ],
          error: null,
        }),
    };

    const result = await getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.topics).toEqual([{ label: "sono", count: 1 }]);
  });

  it("gera uma nota de progresso comparando com a semana anterior", async () => {
    const moreThanBefore = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-08-08T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-08-01T10:00:00Z" },
          ],
          error: null,
        }),
    };

    const result = await getWeeklySummaryData(moreThanBefore as never, "user-1", REFERENCE_DATE);

    expect(result.progressNote).toBe("2 sessões nesta semana, mais que a 1 da semana passada.");
  });

  it("concorda gênero/número corretamente quando a contagem atual ou anterior é 1", async () => {
    const oneVsTwo = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-08-02T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-08-01T10:00:00Z" },
          ],
          error: null,
        }),
    };
    expect((await getWeeklySummaryData(oneVsTwo as never, "user-1", REFERENCE_DATE)).progressNote).toBe(
      "1 sessão nesta semana, menos que as 2 da semana passada — o ritmo é seu."
    );

    const twoVsOne = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-08-08T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-08-01T10:00:00Z" },
          ],
          error: null,
        }),
    };
    expect((await getWeeklySummaryData(twoVsOne as never, "user-1", REFERENCE_DATE)).progressNote).toBe(
      "2 sessões nesta semana, mais que a 1 da semana passada."
    );
  });

  it("classifica corretamente linhas cujo created_at vem no formato do Postgres (+00:00), não no formato toISOString() do JS", async () => {
    const supabase = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            {
              session_id: "s1",
              title: "t",
              themes: ["sono"],
              emotions: [],
              // Mesmo instante que o início do período (REFERENCE_DATE - 7 dias), mas no
              // formato que o Postgres/PostgREST normalmente retorna, não o "Z" do JS.
              created_at: "2026-08-03T12:00:00+00:00",
            },
          ],
          error: null,
        }),
    };

    const result = await getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(1);
    expect(result.topics).toEqual([{ label: "sono", count: 1 }]);
  });

  it("ignora linhas depois de periodEnd quando referenceDate não é o instante mais recente possível", async () => {
    const supabase = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            {
              session_id: "future",
              title: "t",
              themes: ["futuro"],
              emotions: [],
              created_at: "2026-08-11T10:00:00Z", // depois de REFERENCE_DATE
            },
            {
              session_id: "s1",
              title: "t",
              themes: ["sono"],
              emotions: [],
              created_at: "2026-08-09T10:00:00Z",
            },
          ],
          error: null,
        }),
    };

    const result = await getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(1);
    expect(result.topics).toEqual([{ label: "sono", count: 1 }]);
  });

  it("retorna zero sessões, listas vazias e nota de início quando não há sínteses", async () => {
    const supabase = {
      from: () => makeSynthesesBuilder({ data: [], error: null }),
    };

    const result = await getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(0);
    expect(result.topics).toEqual([]);
    expect(result.emotions).toEqual([]);
    expect(result.timeline).toEqual([]);
  });

  it("propaga o erro quando a consulta falha", async () => {
    const supabase = {
      from: () => makeSynthesesBuilder({ data: null, error: new Error("db down") }),
    };

    await expect(getWeeklySummaryData(supabase as never, "user-1", REFERENCE_DATE)).rejects.toThrow(
      "db down"
    );
  });
});
