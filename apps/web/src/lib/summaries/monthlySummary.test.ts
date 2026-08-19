import { describe, expect, it } from "vitest";
import { getMonthlySummaryData } from "./monthlySummary";

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

describe("getMonthlySummaryData", () => {
  it("agrega temas e emoções do mês atual, ignorando linhas do mês anterior", async () => {
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
              created_at: "2026-07-15T10:00:00Z",
            },
            {
              // Mais de 30 dias antes de REFERENCE_DATE — mês anterior, deve entrar em
              // previousSessionCount, não em topics/emotions.
              session_id: "s3",
              title: "Título 3",
              themes: ["trabalho"],
              emotions: ["cansaço"],
              created_at: "2026-06-20T10:00:00Z",
            },
          ],
          error: null,
        });
      },
    };

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(2);
    expect(result.previousSessionCount).toBe(1);
    expect(result.topics).toEqual([
      { label: "sono", count: 2, previousCount: 0, direction: "new" },
      { label: "rotina", count: 1, previousCount: 0, direction: "new" },
    ]);
    expect(result.emotions).toEqual([
      { label: "ansiedade", count: 2, previousCount: 0, direction: "new" },
      { label: "alívio", count: 1, previousCount: 0, direction: "new" },
    ]);
    expect(result.timeline).toEqual([
      { sessionId: "s2", title: "Título 2", createdAt: "2026-07-15T10:00:00Z" },
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

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.topics).toEqual([{ label: "sono", count: 1, previousCount: 0, direction: "new" }]);
  });

  it("calcula a tendência de cada tema comparando a contagem com o mês anterior (alta, queda, estável, novo)", async () => {
    const supabase = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            {
              session_id: "c1",
              title: "t",
              themes: ["sono", "estudo", "rotina", "novo"],
              emotions: [],
              created_at: "2026-08-09T10:00:00Z",
            },
            {
              session_id: "c2",
              title: "t",
              themes: ["sono", "rotina"],
              emotions: [],
              created_at: "2026-08-05T10:00:00Z",
            },
            {
              session_id: "p1",
              title: "t",
              themes: ["sono", "rotina"],
              emotions: [],
              created_at: "2026-06-20T10:00:00Z",
            },
            {
              session_id: "p2",
              title: "t",
              themes: ["estudo", "rotina"],
              emotions: [],
              created_at: "2026-06-25T10:00:00Z",
            },
            {
              session_id: "p3",
              title: "t",
              themes: ["estudo"],
              emotions: [],
              created_at: "2026-06-28T10:00:00Z",
            },
          ],
          error: null,
        }),
    };

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.topics).toEqual([
      { label: "rotina", count: 2, previousCount: 2, direction: "stable" },
      { label: "sono", count: 2, previousCount: 1, direction: "up" },
      { label: "estudo", count: 1, previousCount: 2, direction: "down" },
      { label: "novo", count: 1, previousCount: 0, direction: "new" },
    ]);
  });

  it("gera uma nota de progresso comparando com o mês anterior", async () => {
    const moreThanBefore = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-07-15T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-06-20T10:00:00Z" },
          ],
          error: null,
        }),
    };

    const result = await getMonthlySummaryData(moreThanBefore as never, "user-1", REFERENCE_DATE);

    expect(result.progressNote).toBe("2 sessões neste mês, mais que o 1 do mês passado.");
  });

  it("concorda gênero/número corretamente quando a contagem atual ou anterior é 1", async () => {
    const oneVsTwo = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-07-05T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-06-20T10:00:00Z" },
          ],
          error: null,
        }),
    };
    expect((await getMonthlySummaryData(oneVsTwo as never, "user-1", REFERENCE_DATE)).progressNote).toBe(
      "1 sessão neste mês, menos que os 2 do mês passado — o ritmo é seu."
    );

    const twoVsOne = {
      from: () =>
        makeSynthesesBuilder({
          data: [
            { session_id: "s1", title: "t", themes: [], emotions: [], created_at: "2026-08-09T10:00:00Z" },
            { session_id: "s2", title: "t", themes: [], emotions: [], created_at: "2026-07-15T10:00:00Z" },
            { session_id: "s3", title: "t", themes: [], emotions: [], created_at: "2026-06-20T10:00:00Z" },
          ],
          error: null,
        }),
    };
    expect((await getMonthlySummaryData(twoVsOne as never, "user-1", REFERENCE_DATE)).progressNote).toBe(
      "2 sessões neste mês, mais que o 1 do mês passado."
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
              // Mesmo instante que o início do período (REFERENCE_DATE - 30 dias), mas no
              // formato que o Postgres/PostgREST normalmente retorna, não o "Z" do JS.
              created_at: "2026-07-11T12:00:00+00:00",
            },
          ],
          error: null,
        }),
    };

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(1);
    expect(result.topics).toEqual([{ label: "sono", count: 1, previousCount: 0, direction: "new" }]);
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

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(1);
    expect(result.topics).toEqual([{ label: "sono", count: 1, previousCount: 0, direction: "new" }]);
  });

  it("retorna zero sessões, listas vazias e nota de início quando não há sínteses", async () => {
    const supabase = {
      from: () => makeSynthesesBuilder({ data: [], error: null }),
    };

    const result = await getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE);

    expect(result.sessionCount).toBe(0);
    expect(result.topics).toEqual([]);
    expect(result.emotions).toEqual([]);
    expect(result.timeline).toEqual([]);
    expect(result.progressNote).toBe("0 sessões neste mês — um começo.");
  });

  it("propaga o erro quando a consulta falha", async () => {
    const supabase = {
      from: () => makeSynthesesBuilder({ data: null, error: new Error("db down") }),
    };

    await expect(getMonthlySummaryData(supabase as never, "user-1", REFERENCE_DATE)).rejects.toThrow(
      "db down"
    );
  });
});
