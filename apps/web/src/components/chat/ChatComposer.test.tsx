// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./ChatComposer";

function createResultList(
  entries: Array<{ transcript: string; isFinal: boolean }>,
): SpeechRecognitionResultList {
  const results = entries.map((entry) => ({
    isFinal: entry.isFinal,
    length: 1,
    item: () => ({ transcript: entry.transcript, confidence: 1 }),
  })) as unknown as SpeechRecognitionResult[];

  return {
    length: results.length,
    item: (index: number) => results[index] as SpeechRecognitionResult,
  } as unknown as SpeechRecognitionResultList;
}

class MockSpeechRecognition implements Partial<SpeechRecognition> {
  static instances: MockSpeechRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: SpeechRecognition["onresult"] = null;
  onerror: SpeechRecognition["onerror"] = null;
  onend: SpeechRecognition["onend"] = null;
  onaudiostart: SpeechRecognition["onaudiostart"] = null;
  onstart: SpeechRecognition["onstart"] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  emitFinalResult(transcript: string) {
    this.onresult?.call(this as unknown as SpeechRecognition, {
      resultIndex: 0,
      results: createResultList([{ transcript, isFinal: true }]),
    } as SpeechRecognitionEvent);
  }

  emitError(error: SpeechRecognitionErrorCode) {
    this.onerror?.call(this as unknown as SpeechRecognition, {
      error,
      message: "",
    } as SpeechRecognitionErrorEvent);
  }

  emitEnd() {
    this.onend?.call(this as unknown as SpeechRecognition, new Event("end"));
  }
}

function enableSpeechRecognitionSupport() {
  MockSpeechRecognition.instances = [];
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
}

function disableSpeechRecognitionSupport() {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
}

describe("ChatComposer", () => {
  afterEach(() => {
    disableSpeechRecognitionSupport();
  });

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

  describe("quando o navegador não é compatível com reconhecimento de voz", () => {
    it("mostra um aviso e nenhum botão de microfone no modo Falar", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));

      expect(screen.getByText(/não é compatível/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Iniciar gravação/i)).not.toBeInTheDocument();
    });
  });

  describe("quando o navegador é compatível com reconhecimento de voz", () => {
    beforeEach(() => {
      enableSpeechRecognitionSupport();
    });

    it("inicia a gravação com badge 'Gravando...' e waveform ao tocar no microfone (AC1)", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      expect(screen.getByText("Gravando...")).toBeInTheDocument();
      expect(screen.getByLabelText(/Parar gravação/i)).toHaveAttribute("aria-pressed", "true");
    });

    it("mostra a transcrição no TranscriptBlock, editável, após a gravação (AC1/AC2 da 2.4)", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      expect(screen.getByLabelText(/Transcrição da sua mensagem/i)).toHaveValue(
        "preciso conversar sobre isso",
      );
      expect(screen.getByText(/Toque qualquer palavra para corrigir/i)).toBeInTheDocument();
    });

    it("usa a versão editada da transcrição ao salvar (AC2/AC3 da 2.4)", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso converssar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.change(screen.getByLabelText(/Transcrição da sua mensagem/i), {
        target: { value: "preciso conversar sobre isso" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

      expect(screen.getByLabelText(/Sua mensagem/i)).toHaveValue("preciso conversar sobre isso");
      expect(screen.getByRole("button", { name: /Escrever/i })).toHaveAttribute("aria-pressed", "true");
    });

    it("descarta a transcrição sem alterar o texto já digitado", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "um rascunho que já comecei" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("mensagem por engano");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Descartar/i }));

      expect(screen.getByLabelText(/Iniciar gravação/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Escrever/i }));
      expect(screen.getByLabelText(/Sua mensagem/i)).toHaveValue("um rascunho que já comecei");
    });

    it("devolve o foco ao botão de microfone ao descartar a transcrição", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("mensagem por engano");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Descartar/i }));

      expect(screen.getByLabelText(/Iniciar gravação/i)).toHaveFocus();
    });

    it("anexa a transcrição salva ao rascunho já digitado (AC3/AC4 da 2.4)", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "um rascunho que já comecei" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("e agora completo com voz");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

      expect(screen.getByLabelText(/Sua mensagem/i)).toHaveValue(
        "um rascunho que já comecei e agora completo com voz",
      );
    });

    it("limpa a transcrição pendente ao trocar para Escrever sem salvar nem descartar", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("transcrição que vou abandonar");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Escrever/i }));
      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));

      expect(screen.getByLabelText(/Iniciar gravação/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Transcrição da sua mensagem/i)).not.toBeInTheDocument();
    });

    it("desabilita o textarea e os botões do TranscriptBlock enquanto uma resposta está em andamento", () => {
      const { rerender } = render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      rerender(<ChatComposer disabled={true} onSend={vi.fn()} />);

      expect(screen.getByLabelText(/Transcrição da sua mensagem/i)).toBeDisabled();
      expect(screen.getByRole("button", { name: /Descartar/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /Salvar transcrição/i })).toBeDisabled();
    });

    it("limpa um erro de envio de texto anterior ao salvar uma transcrição", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), { target: { value: "oi" } });
      fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
      expect(screen.getByRole("alert")).toHaveTextContent(/pelo menos 10/i);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("não perde o conteúdo já digitado ao alternar entre Escrever e Falar (AC3)", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "um rascunho que já comecei" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByRole("button", { name: /Escrever/i }));

      expect(screen.getByLabelText(/Sua mensagem/i)).toHaveValue("um rascunho que já comecei");
    });

    it("envia apenas o texto transcrito ao backend, sem dados de áudio (AC4)", () => {
      const onSend = vi.fn();
      render(<ChatComposer disabled={false} onSend={onSend} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));
      fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));

      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith("preciso conversar sobre isso");
      expect(onSend.mock.calls[0]?.[0]).toEqual(expect.any(String));
    });

    it("mostra uma mensagem gentil de erro com opções de Regravar ou Continuar com texto", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitError("not-allowed");
      });

      expect(screen.getByRole("alert")).toHaveTextContent(/microfone/i);
      expect(screen.getByRole("button", { name: /Regravar/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Continuar com texto/i })).toBeInTheDocument();
    });

    it("volta para o modo Escrever ao escolher 'Continuar com texto' após um erro", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitError("network");
      });

      fireEvent.click(screen.getByRole("button", { name: /Continuar com texto/i }));

      expect(screen.getByLabelText(/Sua mensagem/i)).toBeInTheDocument();
    });

    it("reinicia a gravação ao escolher 'Regravar' após um erro", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitError("network");
      });

      fireEvent.click(screen.getByRole("button", { name: /Regravar/i }));

      expect(MockSpeechRecognition.instances[1]?.start).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Gravando...")).toBeInTheDocument();
    });

    it("desabilita o botão de microfone enquanto uma resposta está em andamento", () => {
      render(<ChatComposer disabled={true} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));

      expect(screen.getByLabelText(/Iniciar gravação/i)).toBeDisabled();
    });

    it("para a gravação ativa ao trocar para o modo Escrever", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));
      fireEvent.click(screen.getByRole("button", { name: /Escrever/i }));

      expect(MockSpeechRecognition.instances[0]?.stop).toHaveBeenCalledTimes(1);
    });

    it("para a gravação ativa quando o composer fica desabilitado (resposta em andamento)", () => {
      const { rerender } = render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      rerender(<ChatComposer disabled={true} onSend={vi.fn()} />);

      expect(MockSpeechRecognition.instances[0]?.stop).toHaveBeenCalledTimes(1);
    });

    it("foca o textarea do TranscriptBlock e mostra 'Transcrição pronta' assim que a gravação termina", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      expect(screen.getByLabelText(/Transcrição da sua mensagem/i)).toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent(/Transcrição pronta/i);
    });

    it("foca o campo de texto e mostra 'Transcrição pronta' de novo ao salvar a transcrição", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

      expect(screen.getByLabelText(/Sua mensagem/i)).toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent(/Transcrição pronta/i);
    });

    it("esconde o aviso de 'Transcrição pronta' assim que o usuário edita o texto salvo", () => {
      render(<ChatComposer disabled={false} onSend={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /Falar/i }));
      fireEvent.click(screen.getByLabelText(/Iniciar gravação/i));

      act(() => {
        MockSpeechRecognition.instances[0]?.emitFinalResult("preciso conversar sobre isso");
        MockSpeechRecognition.instances[0]?.emitEnd();
      });

      fireEvent.click(screen.getByRole("button", { name: /Salvar transcrição/i }));

      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "preciso conversar sobre isso, editado" },
      });

      expect(screen.queryByText(/Transcrição pronta/i)).not.toBeInTheDocument();
    });
  });
});
