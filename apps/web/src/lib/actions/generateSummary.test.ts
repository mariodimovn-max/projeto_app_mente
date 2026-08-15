import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, getWeeklySummaryDataMock, getMonthlySummaryDataMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getWeeklySummaryDataMock: vi.fn(),
  getMonthlySummaryDataMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/summaries/weeklySummary", () => ({
  getWeeklySummaryData: getWeeklySummaryDataMock,
}));

vi.mock("@/lib/summaries/monthlySummary", () => ({
  getMonthlySummaryData: getMonthlySummaryDataMock,
}));

const SUMMARY = {
  periodStart: "2026-08-03T12:00:00Z",
  periodEnd: "2026-08-10T12:00:00Z",
  sessionCount: 2,
  previousSessionCount: 1,
  topics: [{ label: "sono", count: 2 }],
  emotions: [{ label: "ansiedade", count: 1 }],
  timeline: [],
  progressNote: "2 sessões nesta semana, mais que a 1 da semana passada.",
};

describe("generateWeeklySummary", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    getWeeklySummaryDataMock.mockReset();
    getMonthlySummaryDataMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando não há usuário autenticado", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { generateWeeklySummary } = await import("./generateSummary");
    const result = await generateWeeklySummary();

    expect(result).toEqual({ error: "Não consegui gerar o resumo agora. Tente novamente." });
    expect(getWeeklySummaryDataMock).not.toHaveBeenCalled();
  });

  it("retorna erro específico quando não há sessões na última semana", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getWeeklySummaryDataMock.mockResolvedValue({ ...SUMMARY, sessionCount: 0 });

    const { generateWeeklySummary } = await import("./generateSummary");
    const result = await generateWeeklySummary();

    expect(result).toEqual({
      error: "Você ainda não encerrou nenhuma sessão nesta última semana. Volte quando tiver algumas para ver seu resumo.",
    });
  });

  it("retorna o resumo semanal para um usuário autenticado com sessões na semana", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getWeeklySummaryDataMock.mockResolvedValue(SUMMARY);

    const { generateWeeklySummary } = await import("./generateSummary");
    const result = await generateWeeklySummary();

    expect(result).toEqual({ summary: SUMMARY });
    expect(getWeeklySummaryDataMock).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("retorna erro genérico quando a leitura dos dados falha", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getWeeklySummaryDataMock.mockRejectedValue(new Error("boom"));

    const { generateWeeklySummary } = await import("./generateSummary");
    const result = await generateWeeklySummary();

    expect(result).toEqual({ error: "Não consegui gerar o resumo agora. Tente novamente." });
  });
});

describe("generateMonthlySummary", () => {
  beforeEach(async () => {
    getUserMock.mockReset();
    getMonthlySummaryDataMock.mockReset();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReset();
  });

  it("retorna erro genérico quando não há usuário autenticado", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { generateMonthlySummary } = await import("./generateSummary");
    const result = await generateMonthlySummary();

    expect(result).toEqual({ error: "Não consegui gerar o resumo agora. Tente novamente." });
    expect(getMonthlySummaryDataMock).not.toHaveBeenCalled();
  });

  it("retorna erro específico quando não há sessões no último mês", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getMonthlySummaryDataMock.mockResolvedValue({ ...SUMMARY, sessionCount: 0 });

    const { generateMonthlySummary } = await import("./generateSummary");
    const result = await generateMonthlySummary();

    expect(result).toEqual({
      error: "Você ainda não encerrou nenhuma sessão neste último mês. Volte quando tiver algumas para ver seu resumo.",
    });
  });

  it("retorna o resumo mensal para um usuário autenticado com sessões no mês", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getMonthlySummaryDataMock.mockResolvedValue(SUMMARY);

    const { generateMonthlySummary } = await import("./generateSummary");
    const result = await generateMonthlySummary();

    expect(result).toEqual({ summary: SUMMARY });
    expect(getMonthlySummaryDataMock).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("retorna erro genérico quando a leitura dos dados falha", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
    } as never);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getMonthlySummaryDataMock.mockRejectedValue(new Error("boom"));

    const { generateMonthlySummary } = await import("./generateSummary");
    const result = await generateMonthlySummary();

    expect(result).toEqual({ error: "Não consegui gerar o resumo agora. Tente novamente." });
  });
});
