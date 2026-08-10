import { describe, expect, it } from "vitest";
import { getPersonalMilestones, normalizeThemeLabel } from "./milestones";

describe("normalizeThemeLabel", () => {
  it("remove espaços nas pontas e converte para minúsculas", () => {
    expect(normalizeThemeLabel("  Dinheiro  ")).toBe("dinheiro");
  });
});

function makeMilestonesBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
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

describe("getPersonalMilestones", () => {
  it("calcula o progresso a partir de quantas vezes o tema normalizado aparece em user_patterns (AC2)", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "personal_milestones") {
          return makeMilestonesBuilder({
            data: [
              {
                id: "m1",
                title: "Quero entender meu relacionamento com dinheiro",
                theme: "dinheiro",
                created_at: "2026-08-01T10:00:00Z",
              },
              {
                id: "m2",
                title: "Explorar meu sono",
                theme: "sono",
                created_at: "2026-08-02T10:00:00Z",
              },
            ],
            error: null,
          });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({
            data: {
              themes: { dinheiro: 4, sono: 0, trabalho: 2 },
              emotions: {},
              triggers: {},
              session_count: 6,
            },
            error: null,
          });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getPersonalMilestones(supabase as never, "user-1");

    expect(result).toEqual([
      {
        id: "m1",
        title: "Quero entender meu relacionamento com dinheiro",
        theme: "dinheiro",
        progress: 4,
        createdAt: "2026-08-01T10:00:00Z",
      },
      {
        id: "m2",
        title: "Explorar meu sono",
        theme: "sono",
        progress: 0,
        createdAt: "2026-08-02T10:00:00Z",
      },
    ]);
  });

  it("retorna progresso 0 para um tema que ainda não apareceu em user_patterns (ou quando o agregado não existe)", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "personal_milestones") {
          return makeMilestonesBuilder({
            data: [
              {
                id: "m1",
                title: "Meu foco",
                theme: "proposito",
                created_at: "2026-08-01T10:00:00Z",
              },
            ],
            error: null,
          });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({ data: null, error: null });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getPersonalMilestones(supabase as never, "user-1");

    expect(result).toEqual([
      { id: "m1", title: "Meu foco", theme: "proposito", progress: 0, createdAt: "2026-08-01T10:00:00Z" },
    ]);
  });

  it("retorna lista vazia quando o usuário não tem marcos", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "personal_milestones") {
          return makeMilestonesBuilder({ data: [], error: null });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({ data: null, error: null });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    const result = await getPersonalMilestones(supabase as never, "user-1");

    expect(result).toEqual([]);
  });

  it("propaga o erro quando a consulta de marcos falha", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "personal_milestones") {
          return makeMilestonesBuilder({ data: null, error: new Error("db down") });
        }
        if (table === "user_patterns") {
          return makeUserPatternsBuilder({ data: null, error: null });
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    };

    await expect(getPersonalMilestones(supabase as never, "user-1")).rejects.toThrow("db down");
  });
});
