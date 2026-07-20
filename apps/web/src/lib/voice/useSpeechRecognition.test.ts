// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE_ERROR_MESSAGE, useSpeechRecognition } from "./useSpeechRecognition";

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

  emitResult(event: Pick<SpeechRecognitionEvent, "resultIndex" | "results">) {
    this.onresult?.call(this as unknown as SpeechRecognition, event as SpeechRecognitionEvent);
  }

  emitError(error: SpeechRecognitionErrorCode) {
    this.onerror?.call(
      this as unknown as SpeechRecognition,
      { error, message: "" } as SpeechRecognitionErrorEvent,
    );
  }

  emitEnd() {
    this.onend?.call(this as unknown as SpeechRecognition, new Event("end"));
  }
}

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
      MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  it("reporta suporte quando o navegador expõe SpeechRecognition ou webkitSpeechRecognition", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    expect(result.current.isSupported).toBe(true);
  });

  it("reporta ausência de suporte quando o navegador não expõe a API", () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;

    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    expect(result.current.isSupported).toBe(false);
  });

  it("inicia a gravação e muda o status para 'recording'", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("recording");
    expect(MockSpeechRecognition.instances[0]?.start).toHaveBeenCalledTimes(1);
  });

  it("chama onResult apenas com os trechos finais transcritos", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult, onError: vi.fn() }));

    act(() => {
      result.current.start();
    });

    const instance = MockSpeechRecognition.instances[0];
    act(() => {
      instance?.emitResult({
        resultIndex: 0,
        results: createResultList([
          { transcript: "isso ainda não terminou", isFinal: false },
          { transcript: "isso já terminou", isFinal: true },
        ]),
      });
    });

    expect(onResult).toHaveBeenCalledWith("isso já terminou");
  });

  it("muda o status para 'error' e reporta uma mensagem gentil ao usuário", () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn(), onError }));

    act(() => {
      result.current.start();
    });

    act(() => {
      MockSpeechRecognition.instances[0]?.emitError("not-allowed");
    });

    expect(result.current.status).toBe("error");
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("microfone"));
  });

  it("usa uma mensagem padrão para códigos de erro não mapeados", () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn(), onError }));

    act(() => {
      result.current.start();
    });

    act(() => {
      MockSpeechRecognition.instances[0]?.emitError("network");
    });

    expect(onError).toHaveBeenCalledWith(DEFAULT_VOICE_ERROR_MESSAGE);
  });

  it("volta para 'idle' quando a gravação termina sem erro", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      MockSpeechRecognition.instances[0]?.emitEnd();
    });

    expect(result.current.status).toBe("idle");
  });

  it("chama stop() na instância ativa", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(MockSpeechRecognition.instances[0]?.stop).toHaveBeenCalledTimes(1);
  });

  it("não cria uma segunda instância ao chamar start() enquanto já está gravando", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
      result.current.start();
    });

    expect(MockSpeechRecognition.instances).toHaveLength(1);
  });

  it("permite iniciar uma nova gravação após a anterior terminar", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      MockSpeechRecognition.instances[0]?.emitEnd();
    });
    act(() => {
      result.current.start();
    });

    expect(MockSpeechRecognition.instances).toHaveLength(2);
    expect(result.current.status).toBe("recording");
  });

  it("permite regravar após um erro (a instância anterior é liberada)", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      MockSpeechRecognition.instances[0]?.emitError("network");
    });
    act(() => {
      result.current.start();
    });

    expect(MockSpeechRecognition.instances).toHaveLength(2);
    expect(result.current.status).toBe("recording");
  });

  it("ignora um onend tardio de uma instância antiga já substituída por uma nova gravação", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    const stale = MockSpeechRecognition.instances[0];
    act(() => {
      stale?.emitError("network");
    });
    act(() => {
      result.current.start();
    });

    // "end" tardio da instância antiga (já substituída) não deve derrubar a gravação nova.
    act(() => {
      stale?.emitEnd();
    });

    expect(result.current.status).toBe("recording");
  });

  it("muda para 'error' quando recognition.start() lança uma exceção síncrona", () => {
    class ThrowingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        this.start = vi.fn(() => {
          throw new Error("InvalidStateError");
        });
      }
    }
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
      ThrowingSpeechRecognition;

    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn(), onError }));

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(onError).toHaveBeenCalledWith(DEFAULT_VOICE_ERROR_MESSAGE);

    act(() => {
      result.current.start();
    });
    expect(MockSpeechRecognition.instances).toHaveLength(2);
  });

  it("desconecta os handlers da instância ativa ao desmontar, evitando callbacks tardios", () => {
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    const instance = MockSpeechRecognition.instances[0];

    unmount();

    expect(instance?.stop).toHaveBeenCalledTimes(1);
    expect(instance?.onresult).toBeNull();
    expect(instance?.onerror).toBeNull();
    expect(instance?.onend).toBeNull();
  });
});
