// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveSynthesisReactionMock, deleteSynthesisReactionMock } = vi.hoisted(() => ({
  saveSynthesisReactionMock: vi.fn(),
  deleteSynthesisReactionMock: vi.fn(),
}));

vi.mock("@/lib/actions/synthesisReaction", () => ({
  saveSynthesisReaction: saveSynthesisReactionMock,
  deleteSynthesisReaction: deleteSynthesisReactionMock,
}));

const { SynthesisReactionDock } = await import("./SynthesisReactionDock");

const SYNTHESIS_ID = "synthesis-1";

describe("SynthesisReactionDock", () => {
  beforeEach(() => {
    saveSynthesisReactionMock.mockReset();
    deleteSynthesisReactionMock.mockReset();
  });

  it("exibe o prompt, os cinco emojis de reação e a legenda visível de cada um", () => {
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    expect(screen.getByText("Como isso ressoou em você?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Me moveu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Me pegou fundo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aliviou" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Algo começou" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fica comigo" })).toBeInTheDocument();
    expect(screen.getByText("moveu")).toBeInTheDocument();
    expect(screen.getByText("fundo")).toBeInTheDocument();
  });

  it("salva a reação ao clicar em um emoji e mostra a confirmação vinculada", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Me pegou fundo" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Me pegou fundo · salvo com a síntese");
    expect(saveSynthesisReactionMock).toHaveBeenCalledWith(SYNTHESIS_ID, { emoji: "gota" });
    expect(screen.getByRole("button", { name: "Me pegou fundo" })).toHaveAttribute("aria-pressed", "true");
  });

  it("não repete a chamada ao reclicar o emoji já selecionado", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    const button = screen.getByRole("button", { name: "Aliviou" });
    fireEvent.click(button);
    await screen.findByRole("status");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(saveSynthesisReactionMock).toHaveBeenCalledTimes(1);
  });

  it("salva um comentário curto e mostra a confirmação, com o botão de enviar desabilitado até haver texto", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    const sendButton = screen.getByRole("button", { name: "Salvar comentário" });
    expect(sendButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Deixe um comentário curto sobre a síntese"), {
      target: { value: "Isso me pegou fundo." },
    });
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    expect(await screen.findByRole("status")).toHaveTextContent("Comentário salvo com a síntese");
    expect(saveSynthesisReactionMock).toHaveBeenCalledWith(SYNTHESIS_ID, {
      comment: "Isso me pegou fundo.",
    });
  });

  it("salva o comentário ao submeter o formulário (Enter no campo), sem precisar clicar no botão", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    const input = screen.getByLabelText("Deixe um comentário curto sobre a síntese");
    fireEvent.change(input, { target: { value: "Isso me pegou fundo." } });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByRole("status")).toHaveTextContent("Comentário salvo com a síntese");
    expect(saveSynthesisReactionMock).toHaveBeenCalledWith(SYNTHESIS_ID, {
      comment: "Isso me pegou fundo.",
    });
  });

  it("trocar de emoji para comentário limpa a seleção de emoji anterior na UI", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Me moveu" }));
    await screen.findByRole("status");
    expect(screen.getByRole("button", { name: "Me moveu" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(screen.getByLabelText("Deixe um comentário curto sobre a síntese"), {
      target: { value: "Mudei de ideia." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar comentário" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Comentário salvo com a síntese");
    expect(screen.getByRole("button", { name: "Me moveu" })).toHaveAttribute("aria-pressed", "false");
  });

  it("trocar de comentário para emoji também substitui a reação salva", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.change(screen.getByLabelText("Deixe um comentário curto sobre a síntese"), {
      target: { value: "Isso me pegou fundo." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar comentário" }));
    await screen.findByRole("status");

    fireEvent.click(screen.getByRole("button", { name: "Fica comigo" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Fica comigo · salvo com a síntese");
    expect(saveSynthesisReactionMock).toHaveBeenLastCalledWith(SYNTHESIS_ID, { emoji: "vela" });
  });

  it("desfaz a reação salva ao clicar em 'desfazer'", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    deleteSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Me moveu" }));
    await screen.findByRole("status");

    fireEvent.click(screen.getByText("desfazer"));

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(deleteSynthesisReactionMock).toHaveBeenCalledWith(SYNTHESIS_ID);
    expect(screen.getByRole("button", { name: "Me moveu" })).toHaveAttribute("aria-pressed", "false");
  });

  it("mostra um erro sem travar a interação quando salvar a reação falha", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ error: "Não consegui salvar sua reação agora. Tente novamente." });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Aliviou" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui salvar sua reação/i);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mostra um erro e reabilita os botões quando a chamada à Server Action rejeita (falha de rede)", async () => {
    saveSynthesisReactionMock.mockRejectedValue(new Error("network down"));
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    const button = screen.getByRole("button", { name: "Aliviou" });
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui salvar sua reação/i);
    expect(button).not.toBeDisabled();
  });

  it("sair sem reagir esconde o convite e anuncia a nota como status, sem chamar nenhuma action (AC2)", () => {
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Sair sem reagir →" }));

    expect(screen.queryByText("Como isso ressoou em você?")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Tudo bem. A síntese continua salva por aqui.");
    expect(saveSynthesisReactionMock).not.toHaveBeenCalled();
    expect(deleteSynthesisReactionMock).not.toHaveBeenCalled();
  });

  it("some com o botão 'Sair sem reagir' depois que uma reação já foi salva", async () => {
    saveSynthesisReactionMock.mockResolvedValue({ success: true });
    render(<SynthesisReactionDock synthesisId={SYNTHESIS_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Me moveu" }));
    await screen.findByRole("status");

    expect(screen.queryByRole("button", { name: "Sair sem reagir →" })).not.toBeInTheDocument();
  });
});
