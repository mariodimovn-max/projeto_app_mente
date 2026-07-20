// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TranscriptBlock } from "./TranscriptBlock";

describe("TranscriptBlock", () => {
  it("mostra a transcrição recebida, editável, com foco automático (AC1)", () => {
    render(
      <TranscriptBlock transcript="preciso conversar sobre isso" disabled={false} onSave={vi.fn()} onDiscard={vi.fn()} />,
    );

    const textarea = screen.getByLabelText(/Transcrição da sua mensagem/i);
    expect(textarea).toHaveValue("preciso conversar sobre isso");
    expect(textarea).toHaveFocus();
    expect(screen.getByText(/Toque qualquer palavra para corrigir/i)).toBeInTheDocument();
    expect(textarea).toHaveAccessibleDescription(/Toque qualquer palavra para corrigir/i);
  });

  it("permite corrigir o texto antes de salvar (AC2)", () => {
    const onSave = vi.fn();
    render(
      <TranscriptBlock
        transcript="preciso converssar sobre isso"
        disabled={false}
        onSave={onSave}
        onDiscard={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Transcrição da sua mensagem/i), {
      target: { value: "preciso conversar sobre isso" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

    expect(onSave).toHaveBeenCalledWith("preciso conversar sobre isso");
  });

  it("usa o texto original quando o usuário salva sem editar (AC3)", () => {
    const onSave = vi.fn();
    render(
      <TranscriptBlock transcript="preciso conversar sobre isso" disabled={false} onSave={onSave} onDiscard={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

    expect(onSave).toHaveBeenCalledWith("preciso conversar sobre isso");
  });

  it("desabilita 'Salvar transcrição' quando o texto fica vazio", () => {
    render(
      <TranscriptBlock transcript="preciso conversar sobre isso" disabled={false} onSave={vi.fn()} onDiscard={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText(/Transcrição da sua mensagem/i), {
      target: { value: "" },
    });

    expect(screen.getByRole("button", { name: /Salvar transcrição/i })).toBeDisabled();
  });

  it("chama onDiscard ao clicar em 'Descartar'", () => {
    const onDiscard = vi.fn();
    render(
      <TranscriptBlock transcript="preciso conversar sobre isso" disabled={false} onSave={vi.fn()} onDiscard={onDiscard} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Descartar/i }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("desabilita o textarea e os botões quando disabled", () => {
    render(
      <TranscriptBlock transcript="preciso conversar sobre isso" disabled={true} onSave={vi.fn()} onDiscard={vi.fn()} />,
    );

    expect(screen.getByLabelText(/Transcrição da sua mensagem/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Descartar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Salvar transcrição/i })).toBeDisabled();
  });
});
