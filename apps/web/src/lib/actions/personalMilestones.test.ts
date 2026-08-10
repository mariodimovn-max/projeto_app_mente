import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const VALID_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "user-1";
const SAVE_ERROR = "Não consegui salvar seu marco agora. Tente novamente.";
const DELETE_ERROR = "Não consegui remover seu marco agora. Tente novamente.";

function createSupabaseStub(options: {
  ownership?: { data: unknown; error: unknown };
  insertResult?: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
  deleteResult?: { error: unknown };
}) {
  let mode: "update" | "delete" | null = null;
  const insertPayloads: unknown[] = [];
  const updatePayloads: unknown[] = [];

  const builder: Record<string, unknown> = {
    insert: (payload: unknown) => {
      insertPayloads.push(payload);
      return builder;
    },
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => options.ownership ?? { data: null, error: null },
    single: async () => options.insertResult ?? { data: null, error: null },
    update: (payload: unknown) => {
      mode = "update";
      updatePayloads.push(payload);
      return builder;
    },
    delete: () => {
      mode = "delete";
      return builder;
    },
    then: (resolve: (value: { error: unknown }) => unknown) => {
      if (mode === "update") return resolve(options.updateResult ?? { error: null });
      if (mode === "delete") return resolve(options.deleteResult ?? { error: null });
      throw new Error("then chamado antes de update()/delete()");
    },
  };

  return {
    supabase: {
      auth: { getUser: getUserMock },
      from: (table: string) => {
        if (table === "personal_milestones") return builder;
        throw new Error(`Tabela inesperada: ${table}`);
      },
    },
    insertPayloads,
    updatePayloads,
  };
}

describe("createPersonalMilestone", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o título está vazio", async () => {
    const { createPersonalMilestone } = await import("./personalMilestones");

    const result = await createPersonalMilestone({ title: "   ", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o tema está vazio", async () => {
    const { createPersonalMilestone } = await import("./personalMilestones");

    const result = await createPersonalMilestone({ title: "Meu foco", theme: "  " });

    expect(result).toEqual({ error: SAVE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro genérico quando o título excede o tamanho máximo", async () => {
    const { createPersonalMilestone } = await import("./personalMilestones");

    const result = await createPersonalMilestone({ title: "a".repeat(141), theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando não há usuário autenticado", async () => {
    const { supabase } = createSupabaseStub({});
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { createPersonalMilestone } = await import("./personalMilestones");
    const result = await createPersonalMilestone({ title: "Meu foco", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
  });

  it("cria o marco, normaliza o tema (trim + minúsculas) e retorna o id (AC1)", async () => {
    const { supabase, insertPayloads } = createSupabaseStub({
      insertResult: { data: { id: "m1" }, error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { createPersonalMilestone } = await import("./personalMilestones");
    const result = await createPersonalMilestone({
      title: "  Quero entender meu relacionamento com dinheiro  ",
      theme: "  Dinheiro  ",
    });

    expect(result).toEqual({ success: true, id: "m1" });
    expect(insertPayloads).toEqual([
      {
        user_id: USER_ID,
        title: "Quero entender meu relacionamento com dinheiro",
        theme: "dinheiro",
      },
    ]);
  });

  it("retorna erro genérico quando o insert falha", async () => {
    const { supabase } = createSupabaseStub({
      insertResult: { data: null, error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { createPersonalMilestone } = await import("./personalMilestones");
    const result = await createPersonalMilestone({ title: "Meu foco", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
  });

  it("retorna erro genérico quando a chamada ao Supabase rejeita", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("network down"));

    const { createPersonalMilestone } = await import("./personalMilestones");
    const result = await createPersonalMilestone({ title: "Meu foco", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
  });
});

describe("updatePersonalMilestone", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o id não é um UUID válido", async () => {
    const { updatePersonalMilestone } = await import("./personalMilestones");

    const result = await updatePersonalMilestone("not-a-uuid", {
      title: "Meu foco",
      theme: "dinheiro",
    });

    expect(result).toEqual({ error: SAVE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando o marco não existe ou não pertence ao usuário (AC3)", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { updatePersonalMilestone } = await import("./personalMilestones");
    const result = await updatePersonalMilestone(VALID_ID, { title: "Meu foco", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
  });

  it("atualiza título e tema (normalizado) quando o usuário é dono do marco (AC3)", async () => {
    const { supabase, updatePayloads } = createSupabaseStub({
      ownership: { data: { id: VALID_ID }, error: null },
      updateResult: { error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { updatePersonalMilestone } = await import("./personalMilestones");
    const result = await updatePersonalMilestone(VALID_ID, {
      title: "Novo foco",
      theme: "Sono",
    });

    expect(result).toEqual({ success: true });
    expect(updatePayloads).toHaveLength(1);
    expect(updatePayloads[0]).toMatchObject({ title: "Novo foco", theme: "sono" });
  });

  it("retorna erro genérico quando a atualização falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_ID }, error: null },
      updateResult: { error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { updatePersonalMilestone } = await import("./personalMilestones");
    const result = await updatePersonalMilestone(VALID_ID, { title: "Meu foco", theme: "dinheiro" });

    expect(result).toEqual({ error: SAVE_ERROR });
  });
});

describe("deletePersonalMilestone", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando o id não é um UUID válido", async () => {
    const { deletePersonalMilestone } = await import("./personalMilestones");

    const result = await deletePersonalMilestone("not-a-uuid");

    expect(result).toEqual({ error: DELETE_ERROR });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando o marco não existe ou não pertence ao usuário", async () => {
    const { supabase } = createSupabaseStub({ ownership: { data: null, error: null } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deletePersonalMilestone } = await import("./personalMilestones");
    const result = await deletePersonalMilestone(VALID_ID);

    expect(result).toEqual({ error: DELETE_ERROR });
  });

  it("remove o marco e retorna sucesso quando o usuário é dono dele (AC3)", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_ID }, error: null },
      deleteResult: { error: null },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deletePersonalMilestone } = await import("./personalMilestones");
    const result = await deletePersonalMilestone(VALID_ID);

    expect(result).toEqual({ success: true });
  });

  it("retorna erro genérico quando a exclusão falha", async () => {
    const { supabase } = createSupabaseStub({
      ownership: { data: { id: VALID_ID }, error: null },
      deleteResult: { error: new Error("db down") },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });

    const { deletePersonalMilestone } = await import("./personalMilestones");
    const result = await deletePersonalMilestone(VALID_ID);

    expect(result).toEqual({ error: DELETE_ERROR });
  });
});
