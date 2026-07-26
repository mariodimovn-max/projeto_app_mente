import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

function createSupabaseStub(options: {
  ownership: { data: unknown; error: unknown };
  upsert?: { error: unknown };
  delete?: { error: unknown };
}) {
  const ownershipEqCalls: [string, unknown][] = [];
  const ownershipBuilder = {
    select: () => ownershipBuilder,
    eq: (column: string, value: unknown) => {
      ownershipEqCalls.push([column, value]);
      return ownershipBuilder;
    },
    maybeSingle: async () => options.ownership,
  };

  const upsertCalls: { payload: unknown; opts: unknown }[] = [];
  const deleteCalls: string[] = [];

  const reactionsBuilder = {
    upsert: (payload: unknown, opts: unknown) => {
      upsertCalls.push({ payload, opts });
      return Promise.resolve(options.upsert ?? { error: null });
    },
    delete: () => ({
      eq: (_column: string, value: string) => {
        deleteCalls.push(value);
        return Promise.resolve(options.delete ?? { error: null });
      },
    }),
  };

  const from = (table: string) => {
    if (table === "session_syntheses") return ownershipBuilder;
    if (table === "session_synthesis_reactions") return reactionsBuilder;
    throw new Error(`Tabela inesperada: ${table}`);
  };

  return {
    supabase: { auth: { getUser: getUserMock }, from },
    upsertCalls,
    deleteCalls,
    ownershipEqCalls,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const VALID_SYNTHESIS_ID = "22222222-2222-4222-8222-222222222222";
const SAVE_GENERIC_ERROR = "Não consegui salvar sua reação agora. Tente novamente.";
const UNDO_GENERIC_ERROR = "Não consegui desfazer sua reação agora. Tente novamente.";

describe("saveSynthesisReaction", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o synthesisId não é um UUID válido", async () => {
    const { saveSynthesisReaction } = await import("./synthesisReaction");

    const result = await saveSynthesisReaction("not-a-uuid", { emoji: "onda" });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o emoji não é uma das chaves conhecidas", async () => {
    const { saveSynthesisReaction } = await import("./synthesisReaction");

    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, {
      emoji: "inexistente" as never,
    });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o comentário excede 80 caracteres", async () => {
    const { saveSynthesisReaction } = await import("./synthesisReaction");

    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, {
      comment: "a".repeat(81),
    });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o comentário é uma string vazia", async () => {
    const { saveSynthesisReaction } = await import("./synthesisReaction");

    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { comment: "   " });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o payload manda emoji e comentário ao mesmo tempo", async () => {
    const { saveSynthesisReaction } = await import("./synthesisReaction");

    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, {
      emoji: "onda",
      comment: "não deveria ser aceito junto",
    } as never);

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { emoji: "onda" });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
  });

  it("retorna erro quando a síntese não existe ou não pertence ao usuário", async () => {
    const { supabase, ownershipEqCalls } = createSupabaseStub({
      ownership: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { emoji: "onda" });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
    expect(ownershipEqCalls).toEqual([
      ["id", VALID_SYNTHESIS_ID],
      ["sessions.user_id", "user-1"],
    ]);
  });

  it("salva a reação de emoji com comment nulo e retorna sucesso", async () => {
    const { supabase, upsertCalls } = createSupabaseStub({
      ownership: { data: { id: VALID_SYNTHESIS_ID }, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { emoji: "gota" });

    expect(result).toEqual({ success: true });
    expect(upsertCalls[0]).toEqual({
      payload: { synthesis_id: VALID_SYNTHESIS_ID, emoji: "gota", comment: null },
      opts: { onConflict: "synthesis_id" },
    });
  });

  it("salva a reação de comentário (com trim) e emoji nulo, e retorna sucesso", async () => {
    const { supabase, upsertCalls } = createSupabaseStub({
      ownership: { data: { id: VALID_SYNTHESIS_ID }, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, {
      comment: "  Isso me pegou fundo.  ",
    });

    expect(result).toEqual({ success: true });
    expect(upsertCalls[0]).toEqual({
      payload: { synthesis_id: VALID_SYNTHESIS_ID, emoji: null, comment: "Isso me pegou fundo." },
      opts: { onConflict: "synthesis_id" },
    });
  });

  it("retorna erro genérico quando o upsert falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_SYNTHESIS_ID }, error: null },
      upsert: { error: { message: "boom", code: "500" } },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { emoji: "onda" });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
  });

  it("retorna erro genérico quando createClient rejeita", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("network down"));

    const { saveSynthesisReaction } = await import("./synthesisReaction");
    const result = await saveSynthesisReaction(VALID_SYNTHESIS_ID, { emoji: "onda" });

    expect(result).toEqual({ error: SAVE_GENERIC_ERROR });
  });
});

describe("deleteSynthesisReaction", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o synthesisId não é um UUID válido", async () => {
    const { deleteSynthesisReaction } = await import("./synthesisReaction");

    const result = await deleteSynthesisReaction("not-a-uuid");

    expect(result).toEqual({ error: UNDO_GENERIC_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando a síntese não existe ou não pertence ao usuário", async () => {
    const { supabase, ownershipEqCalls } = createSupabaseStub({
      ownership: { data: null, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { deleteSynthesisReaction } = await import("./synthesisReaction");
    const result = await deleteSynthesisReaction(VALID_SYNTHESIS_ID);

    expect(result).toEqual({ error: UNDO_GENERIC_ERROR });
    expect(ownershipEqCalls).toEqual([
      ["id", VALID_SYNTHESIS_ID],
      ["sessions.user_id", "user-1"],
    ]);
  });

  it("remove a reação e retorna sucesso", async () => {
    const { supabase, deleteCalls } = createSupabaseStub({
      ownership: { data: { id: VALID_SYNTHESIS_ID }, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { deleteSynthesisReaction } = await import("./synthesisReaction");
    const result = await deleteSynthesisReaction(VALID_SYNTHESIS_ID);

    expect(result).toEqual({ success: true });
    expect(deleteCalls).toEqual([VALID_SYNTHESIS_ID]);
  });

  it("retorna erro genérico quando a remoção falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_SYNTHESIS_ID }, error: null },
      delete: { error: { message: "boom", code: "500" } },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const { deleteSynthesisReaction } = await import("./synthesisReaction");
    const result = await deleteSynthesisReaction(VALID_SYNTHESIS_ID);

    expect(result).toEqual({ error: UNDO_GENERIC_ERROR });
  });
});
