// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HistorySessionSummary } from "@/types/history";

const { setSessionMarkedMock, deleteSessionMock } = vi.hoisted(() => ({
  setSessionMarkedMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}));

vi.mock("@/lib/actions/sessionHistory", () => ({
  setSessionMarked: setSessionMarkedMock,
  deleteSession: deleteSessionMock,
}));

const { HistoryCard } = await import("./HistoryCard");

const SESSION: HistorySessionSummary = {
  id: "session-1",
  createdAt: "2026-07-25T10:00:00Z",
  title: "Noite de pensamento sobre propósito",
  themes: ["sono", "ansiedade", "propósito", "trabalho"],
  hasSynthesis: true,
  marked: false,
};

describe("HistoryCard", () => {
  beforeEach(() => {
    setSessionMarkedMock.mockReset();
    deleteSessionMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exibe data, título, até 3 chips de tema, badge de síntese e selo de privacidade", () => {
    render(
      <ul>
        <HistoryCard
          session={SESSION}
          isLatest={false}
          onMarkedChange={vi.fn()}
          onDeleted={vi.fn()}
        />
      </ul>
    );

    expect(screen.getByText("Noite de pensamento sobre propósito")).toBeInTheDocument();
    expect(screen.getByText("sono")).toBeInTheDocument();
    expect(screen.getByText("ansiedade")).toBeInTheDocument();
    expect(screen.getByText("propósito")).toBeInTheDocument();
    expect(screen.queryByText("trabalho")).not.toBeInTheDocument();
    expect(screen.getByText("Síntese disponível")).toBeInTheDocument();
    expect(screen.getByText("Privado")).toBeInTheDocument();
    expect(screen.queryByText("Última sessão")).not.toBeInTheDocument();
  });

  it("mostra o rótulo 'Última sessão' quando isLatest é verdadeiro", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    expect(screen.getByText("Última sessão")).toBeInTheDocument();
  });

  it("usa um título alternativo quando a sessão não tem síntese", () => {
    render(
      <ul>
        <HistoryCard
          session={{ ...SESSION, title: null, themes: [], hasSynthesis: false }}
          isLatest={false}
          onMarkedChange={vi.fn()}
          onDeleted={vi.fn()}
        />
      </ul>
    );

    expect(screen.getByText("Conversa sem síntese")).toBeInTheDocument();
    expect(screen.queryByText("Síntese disponível")).not.toBeInTheDocument();
    expect(screen.getByText("Sem síntese")).toBeInTheDocument();
  });

  it("distingue sessões recentes (sem ano) de antigas (com ano), como pede o ux-patterns.md", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));

    const { unmount } = render(
      <ul>
        <HistoryCard
          session={{ ...SESSION, createdAt: "2026-07-25T10:00:00Z" }}
          isLatest={false}
          onMarkedChange={vi.fn()}
          onDeleted={vi.fn()}
        />
      </ul>
    );
    expect(screen.getByText(/^25 de jul, \d{2}h\d{2}$/)).toBeInTheDocument();
    unmount();

    vi.setSystemTime(new Date("2027-01-15T12:00:00Z"));
    render(
      <ul>
        <HistoryCard
          session={{ ...SESSION, createdAt: "2026-07-25T10:00:00Z" }}
          isLatest={false}
          onMarkedChange={vi.fn()}
          onDeleted={vi.fn()}
        />
      </ul>
    );
    expect(screen.getByText(/^25 de jul\. de 2026, \d{2}h\d{2}$/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("o link do cartão e o de 'Revisar' abrem a sessão em /historico/[id] (AC4)", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    expect(
      screen.getByRole("link", { name: /Noite de pensamento sobre propósito/ })
    ).toHaveAttribute("href", "/historico/session-1");

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));

    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute(
      "href",
      "/historico/session-1"
    );
  });

  it("revela as ações rápidas (Revisar/Marcar/Excluir) ao clicar no botão de ações", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    const toggle = screen.getByRole("button", { name: "Ações rápidas" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Revisar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("um toque simples (pointerdown/up sem deslocamento) não revela o painel nem captura o ponteiro", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    const toggle = screen.getByRole("button", { name: "Ações rápidas" });
    const cardShell = toggle.parentElement as HTMLElement;
    const setPointerCaptureMock = vi.fn();
    cardShell.setPointerCapture = setPointerCaptureMock;

    fireEvent.pointerDown(cardShell, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(cardShell, { clientX: 100, pointerId: 1 });

    expect(setPointerCaptureMock).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("arrastar além do limiar de arraste ainda revela o painel de ações via swipe", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    const toggle = screen.getByRole("button", { name: "Ações rápidas" });
    const cardShell = toggle.parentElement as HTMLElement;
    const setPointerCaptureMock = vi.fn();
    cardShell.setPointerCapture = setPointerCaptureMock;

    fireEvent.pointerDown(cardShell, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(cardShell, { clientX: 40, pointerId: 1 });
    fireEvent.pointerUp(cardShell, { clientX: 40, pointerId: 1 });

    expect(setPointerCaptureMock).toHaveBeenCalledWith(1);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("marca a sessão e avisa o pai quando 'Marcar' é clicado com sucesso", async () => {
    setSessionMarkedMock.mockResolvedValue({ success: true });
    const onMarkedChange = vi.fn();
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={onMarkedChange} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar" }));

    expect(setSessionMarkedMock).toHaveBeenCalledWith("session-1", true);
    await vi.waitFor(() => expect(onMarkedChange).toHaveBeenCalledWith("session-1", true));
  });

  it("mostra um erro quando marcar a sessão falha, sem chamar o callback do pai", async () => {
    setSessionMarkedMock.mockResolvedValue({ error: "Não consegui atualizar essa sessão agora. Tente novamente." });
    const onMarkedChange = vi.fn();
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={onMarkedChange} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui atualizar/i);
    expect(onMarkedChange).not.toHaveBeenCalled();
  });

  it("pede confirmação antes de excluir, e cancelar não chama a Server Action", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(
      screen.getByText("Excluir esta sessão e suas transcrições para sempre?")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByText("Excluir esta sessão e suas transcrições para sempre?")
    ).not.toBeInTheDocument();
    expect(deleteSessionMock).not.toHaveBeenCalled();
  });

  it("esquece a confirmação de exclusão ao fechar o painel pelo botão '⋯' (não só por 'Cancelar')", () => {
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    const toggle = screen.getByRole("button", { name: "Ações rápidas" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(
      screen.getByText("Excluir esta sessão e suas transcrições para sempre?")
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(
      screen.queryByText("Excluir esta sessão e suas transcrições para sempre?")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("não atualiza estado depois de desmontado (corrida entre marcar em voo e exclusão)", async () => {
    let resolveMark: ((value: { success: true }) => void) | undefined;
    setSessionMarkedMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMark = resolve;
      })
    );
    const { unmount } = render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar" }));
    unmount();

    expect(() => resolveMark?.({ success: true })).not.toThrow();
    await vi.waitFor(() => expect(setSessionMarkedMock).toHaveBeenCalled());
  });

  it("exclui a sessão e avisa o pai ao confirmar a exclusão", async () => {
    deleteSessionMock.mockResolvedValue({ success: true });
    const onDeleted = vi.fn();
    render(
      <ul>
        <HistoryCard session={SESSION} isLatest={false} onMarkedChange={vi.fn()} onDeleted={onDeleted} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(deleteSessionMock).toHaveBeenCalledWith("session-1");
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledWith("session-1"));
  });
});
