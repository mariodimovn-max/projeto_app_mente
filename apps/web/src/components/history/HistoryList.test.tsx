// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistorySessionSummary } from "@/types/history";

const { setSessionMarkedMock, deleteSessionMock } = vi.hoisted(() => ({
  setSessionMarkedMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}));

vi.mock("@/lib/actions/sessionHistory", () => ({
  setSessionMarked: setSessionMarkedMock,
  deleteSession: deleteSessionMock,
}));

const { HistoryList } = await import("./HistoryList");

const SESSIONS: HistorySessionSummary[] = [
  {
    id: "session-1",
    createdAt: "2026-07-25T10:00:00Z",
    title: "Noite de pensamento sobre propósito",
    themes: ["sono", "propósito"],
    hasSynthesis: true,
    marked: false,
  },
  {
    id: "session-2",
    createdAt: "2026-07-18T09:00:00Z",
    title: "Conversa sobre trabalho",
    themes: ["trabalho"],
    hasSynthesis: true,
    marked: false,
  },
];

describe("HistoryList", () => {
  beforeEach(() => {
    setSessionMarkedMock.mockReset();
    deleteSessionMock.mockReset();
  });

  it("mostra um estado vazio quando não há nenhuma sessão", () => {
    render(<HistoryList initialSessions={[]} />);

    expect(
      screen.getByText("Suas conversas encerradas vão aparecer aqui.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Buscar por palavra-chave ou tema")).not.toBeInTheDocument();
  });

  it("lista as sessões em ordem, destacando a primeira como 'Última sessão' (AC1)", () => {
    render(<HistoryList initialSessions={SESSIONS} />);

    const latestBadges = screen.getAllByText("Última sessão");
    expect(latestBadges).toHaveLength(1);
    expect(screen.getByText("Noite de pensamento sobre propósito")).toBeInTheDocument();
    expect(screen.getByText("Conversa sobre trabalho")).toBeInTheDocument();
  });

  it("filtra a lista instantaneamente ao digitar na busca (AC2)", () => {
    render(<HistoryList initialSessions={SESSIONS} />);

    fireEvent.change(screen.getByLabelText("Buscar por palavra-chave ou tema"), {
      target: { value: "trabalho" },
    });

    expect(screen.queryByText("Noite de pensamento sobre propósito")).not.toBeInTheDocument();
    expect(screen.getByText("Conversa sobre trabalho")).toBeInTheDocument();
  });

  it("mostra uma mensagem quando a busca não encontra nenhuma sessão", () => {
    render(<HistoryList initialSessions={SESSIONS} />);

    fireEvent.change(screen.getByLabelText("Buscar por palavra-chave ou tema"), {
      target: { value: "algo inexistente" },
    });

    expect(screen.getByText('Nenhuma sessão encontrada para "algo inexistente".')).toBeInTheDocument();
  });

  it("remove o cartão da lista quando a sessão é excluída", async () => {
    deleteSessionMock.mockResolvedValue({ success: true });
    render(<HistoryList initialSessions={SESSIONS} />);

    const toggleButtons = screen.getAllByRole("button", { name: "Ações rápidas" });
    fireEvent.click(toggleButtons[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await vi.waitFor(() =>
      expect(screen.queryByText("Noite de pensamento sobre propósito")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Conversa sobre trabalho")).toBeInTheDocument();
  });
});
