// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./ChatComposer";

describe("ChatComposer", () => {
  it("envia a mensagem digitada e limpa o campo", () => {
    const onSend = vi.fn();
    render(<ChatComposer disabled={false} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
      target: { value: "Uma mensagem válida de teste." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));

    expect(onSend).toHaveBeenCalledWith("Uma mensagem válida de teste.");
    expect(screen.getByLabelText(/Sua mensagem/i)).toHaveValue("");
  });

  it("rejeita mensagens com menos de 10 caracteres com uma validação clara, sem enviar", () => {
    const onSend = vi.fn();
    render(<ChatComposer disabled={false} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
      target: { value: "oi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/pelo menos 10/i);
  });

  it("rejeita mensagens com mais de 5000 caracteres, sem enviar", () => {
    const onSend = vi.fn();
    render(<ChatComposer disabled={false} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
      target: { value: "a".repeat(5001) },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/no máximo 5000/i);
  });

  it("desabilita o campo e o botão de envio enquanto uma resposta está em andamento", () => {
    render(<ChatComposer disabled={true} onSend={vi.fn()} />);

    expect(screen.getByLabelText(/Sua mensagem/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Enviar/i })).toBeDisabled();
  });

  it("inicia no modo Escrever com o campo de texto visível", () => {
    render(<ChatComposer disabled={false} onSend={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Escrever/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Falar/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText(/Sua mensagem/i)).toBeInTheDocument();
  });

  it("alterna para o modo Falar e não permite enviar por voz (recurso ainda não implementado)", () => {
    render(<ChatComposer disabled={false} onSend={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Falar/i }));

    expect(screen.queryByLabelText(/Sua mensagem/i)).not.toBeInTheDocument();
    expect(screen.getByTitle(/chega em breve/i)).toBeDisabled();
    expect(screen.getByText(/em breve/i)).toBeInTheDocument();
  });
});
