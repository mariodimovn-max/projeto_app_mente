// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THINKING_COPY } from "./ThinkingIndicator";

const { endSessionMock } = vi.hoisted(() => ({ endSessionMock: vi.fn() }));

vi.mock("@/lib/actions/endSession", () => ({
  endSession: endSessionMock,
}));

const { ChatWindow, INACTIVITY_TIMEOUT_MS } = await import("./ChatWindow");

function createStreamResponse(chunks: string[], headers: Record<string, string> = {}) {
  let index = 0;
  const encoder = new TextEncoder();
  return {
    ok: true,
    headers: { get: (name: string) => headers[name] ?? null },
    body: {
      getReader() {
        return {
          async read() {
            if (index < chunks.length) {
              const value = encoder.encode(chunks[index]);
              index += 1;
              return { value, done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    },
    json: async () => ({}),
  };
}

function createErrorResponse(message: string) {
  return {
    ok: false,
    headers: { get: () => null },
    body: null,
    json: async () => ({ error: { message } }),
  };
}

/** Simula um corpo de streaming cujos chunks (ou falha) chegam sob controle explícito do teste. */
function createControllableStreamResponse(headers: Record<string, string> = {}) {
  const encoder = new TextEncoder();
  type ReadResult = { value: Uint8Array | undefined; done: boolean };
  const pendingResults: ReadResult[] = [];
  const pendingReaders: Array<{
    resolve: (result: ReadResult) => void;
    reject: (error: unknown) => void;
  }> = [];

  function deliver(result: ReadResult) {
    const waiting = pendingReaders.shift();
    if (waiting) {
      waiting.resolve(result);
    } else {
      pendingResults.push(result);
    }
  }

  return {
    response: {
      ok: true,
      headers: { get: (name: string) => headers[name] ?? null },
      body: {
        getReader() {
          return {
            read(): Promise<ReadResult> {
              if (pendingResults.length > 0) {
                return Promise.resolve(pendingResults.shift()!);
              }
              return new Promise((resolve, reject) => {
                pendingReaders.push({ resolve, reject });
              });
            },
          };
        },
      },
      json: async () => ({}),
    },
    pushChunk(text: string) {
      deliver({ value: encoder.encode(text), done: false });
    },
    finish() {
      deliver({ value: undefined, done: true });
    },
    fail(error: unknown) {
      const waiting = pendingReaders.shift();
      if (waiting) {
        waiting.reject(error);
      }
    },
  };
}

function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText(/Sua mensagem/i), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
}

describe("ChatWindow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    endSessionMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exibe a mensagem do usuário imediatamente e a resposta do agente incrementalmente até concluir o streaming", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Olá", ", tudo bem?"], { "X-Session-Id": "session-1" }) as unknown as Response
    );

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    expect(await screen.findByText("Uma mensagem válida de teste.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Olá, tudo bem?")).toBeInTheDocument());

    await waitFor(() => expect(screen.getByRole("button", { name: /Enviar/i })).not.toBeDisabled());

    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(JSON.parse(init!.body as string)).toEqual({
      message: "Uma mensagem válida de teste.",
      sessionId: undefined,
    });
  });

  it("reutiliza o sessionId retornado pelo servidor nas mensagens seguintes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Certo."], { "X-Session-Id": "session-1" }) as unknown as Response
    );

    render(<ChatWindow />);
    sendMessage("Primeira mensagem de teste.");
    await waitFor(() => expect(screen.getByText("Certo.")).toBeInTheDocument());

    sendMessage("Segunda mensagem de teste.");
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBe(2));

    const [, secondInit] = vi.mocked(fetch).mock.calls[1]!;
    expect(JSON.parse(secondInit!.body as string)).toEqual({
      message: "Segunda mensagem de teste.",
      sessionId: "session-1",
    });
  });

  it("não avança o medidor de profundidade quando a resposta é do fluxo de crise", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Resposta de crise com recursos de ajuda."], {
        "X-Session-Id": "session-1",
        "X-Crisis-Response": "true",
      }) as unknown as Response
    );

    render(<ChatWindow />);
    sendMessage("Uma mensagem de crise de teste.");

    await waitFor(() =>
      expect(screen.getByText("Resposta de crise com recursos de ajuda.")).toBeInTheDocument()
    );

    expect(screen.getByText("−0m")).toBeInTheDocument();
  });

  it("avança o medidor de profundidade após uma resposta normal", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Resposta normal."], { "X-Session-Id": "session-1" }) as unknown as Response
    );

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    await waitFor(() => expect(screen.getByText("Resposta normal.")).toBeInTheDocument());

    expect(screen.getByText("−2m")).toBeInTheDocument();
  });

  it("mostra o indicador de pensamento enquanto a resposta está em andamento e some ao chegar o primeiro token, sem bolha vazia duplicada", async () => {
    let resolveFetch!: (response: unknown) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as unknown as Promise<Response>
    );

    // O rótulo "a aura" também aparece fixo no cabeçalho mobile — usamos a contagem de
    // ocorrências para distinguir "só o cabeçalho" de "cabeçalho + bolha do agente".
    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    expect(await screen.findByText(THINKING_COPY)).toBeInTheDocument();
    expect(screen.getAllByText("a aura")).toHaveLength(1);

    const { response, pushChunk, finish } = createControllableStreamResponse({
      "X-Session-Id": "session-1",
    });
    resolveFetch(response as unknown as Response);

    // Cabeçalhos chegaram (status agora é "streaming"), mas nenhum token ainda —
    // o indicador deve permanecer, sem bolha vazia do agente por baixo.
    await waitFor(() => expect(screen.getByText(THINKING_COPY)).toBeInTheDocument());
    expect(screen.getAllByText("a aura")).toHaveLength(1);

    pushChunk("Certo, entendi o que você trouxe.");
    finish();

    await waitFor(() =>
      expect(screen.getByText("Certo, entendi o que você trouxe.")).toBeInTheDocument()
    );
    expect(screen.queryByText(THINKING_COPY)).not.toBeInTheDocument();
    expect(screen.getAllByText("a aura")).toHaveLength(2);
  });

  it("não deixa uma bolha vazia permanente do agente quando o stream termina sem nenhum chunk", async () => {
    const { response, finish } = createControllableStreamResponse({ "X-Session-Id": "session-1" });
    vi.mocked(fetch).mockResolvedValueOnce(response as unknown as Response);

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    await waitFor(() => expect(screen.getByText(THINKING_COPY)).toBeInTheDocument());

    finish();

    await waitFor(() => expect(screen.getByRole("button", { name: /Enviar/i })).not.toBeDisabled());
    expect(screen.queryByText(THINKING_COPY)).not.toBeInTheDocument();
    expect(screen.getAllByText("a aura")).toHaveLength(1);
  });

  it("não deixa uma bolha vazia do agente ao lado do banner de erro quando o stream falha após os cabeçalhos chegarem", async () => {
    const { response, fail } = createControllableStreamResponse({ "X-Session-Id": "session-1" });
    vi.mocked(fetch).mockResolvedValueOnce(response as unknown as Response);

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    await waitFor(() => expect(screen.getByText(THINKING_COPY)).toBeInTheDocument());

    fail(new Error("conexão perdida"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui completar a resposta/i);
    expect(screen.queryByText(THINKING_COPY)).not.toBeInTheDocument();
    expect(screen.getAllByText("a aura")).toHaveLength(1);
  });

  it("mostra um banner de erro com retry explícito quando o envio falha, sem reenviar automaticamente", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createErrorResponse("Não consegui enviar sua mensagem. Pode tentar novamente?") as unknown as Response
    );

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui enviar/i);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    vi.mocked(fetch).mockResolvedValueOnce(
      createStreamResponse(["Tudo certo agora."], { "X-Session-Id": "session-2" }) as unknown as Response
    );

    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    await waitFor(() => expect(screen.getByText("Tudo certo agora.")).toBeInTheDocument());
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("não mostra 'Encerrar sessão' antes de haver uma troca completa de mensagens", () => {
    render(<ChatWindow />);

    expect(screen.queryByRole("button", { name: /Encerrar sessão/i })).not.toBeInTheDocument();
  });

  it("mostra 'Encerrar sessão' após uma troca completa e exibe a síntese na hora ao clicar (encerramento manual)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Certo, entendi."], { "X-Session-Id": "session-1" }) as unknown as Response
    );
    endSessionMock.mockResolvedValue({
      synthesis: {
        id: "synthesis-1",
        title: "Hoje você tocou no medo de não dar conta.",
        themes: ["Sono"],
        explored: "Você explorou sua rotina de sono.",
        patterns: ["Padrão de irregularidade notado."],
        openQuestion: "O que uma boa noite de sono mudaria amanhã?",
        depth: 2,
        durationMinutes: 5,
        exchangeCount: 1,
        createdAt: "2026-07-25T10:23:00Z",
      },
    });

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");
    await waitFor(() => expect(screen.getByText("Certo, entendi.")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Encerrar sessão/i }));

    expect(
      await screen.findByRole("heading", { name: "Hoje você tocou no medo de não dar conta." })
    ).toBeInTheDocument();
    expect(endSessionMock).toHaveBeenCalledWith("session-1", 2);
    expect(screen.queryByLabelText(/Sua mensagem/i)).not.toBeInTheDocument();
    // Encerramento manual revela a síntese direto — sem passar pelo convite de "sessão repousou".
    expect(screen.queryByText("A sessão repousou")).not.toBeInTheDocument();
  });

  it("mostra um erro quando o encerramento falha, mantendo o composer disponível", async () => {
    vi.mocked(fetch).mockResolvedValue(
      createStreamResponse(["Certo, entendi."], { "X-Session-Id": "session-1" }) as unknown as Response
    );
    endSessionMock.mockResolvedValue({
      error: "Não consegui gerar a síntese desta sessão agora. Tente novamente.",
    });

    render(<ChatWindow />);
    sendMessage("Uma mensagem válida de teste.");
    await waitFor(() => expect(screen.getByText("Certo, entendi.")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Encerrar sessão/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não consegui gerar a síntese/i);
    expect(screen.getByLabelText(/Sua mensagem/i)).toBeInTheDocument();
  });

  it("encerra a sessão automaticamente após 60 minutos de inatividade, sem exigir ação do usuário, mostrando antes o convite para ver a síntese", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockResolvedValue(
        createStreamResponse(["Certo, entendi."], { "X-Session-Id": "session-1" }) as unknown as Response
      );
      endSessionMock.mockResolvedValue({
        synthesis: {
          id: "synthesis-1",
          title: "Hoje algo ficou mais claro.",
          themes: [],
          explored: "...",
          patterns: ["..."],
          openQuestion: "...?",
          depth: 2,
          durationMinutes: 60,
          exchangeCount: 1,
          createdAt: "2026-07-25T11:00:00Z",
        },
      });

      render(<ChatWindow />);
      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "Uma mensagem válida de teste." },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
      // O envio inteiro (fetch + leitura do stream) é resolvido via microtasks, não
      // timers — avançar 0ms repetidamente esvazia a fila de microtasks pendente
      // sem depender do relógio real que o testing-library usaria em waitFor.
      for (let i = 0; i < 10; i += 1) {
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(screen.getByText("Certo, entendi.")).toBeInTheDocument();
      expect(endSessionMock).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(INACTIVITY_TIMEOUT_MS);
      for (let i = 0; i < 10; i += 1) {
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(endSessionMock).toHaveBeenCalledWith("session-1", 2);
      // Encerramento automático (AC4) não empurra a síntese completa de uma vez — mostra
      // primeiro o convite suave, sem exigir ação, e só revela ao usuário pedir.
      expect(screen.getByText("A sessão repousou")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Hoje algo ficou mais claro." })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Ver a síntese" }));

      expect(screen.getByRole("heading", { name: "Hoje algo ficou mais claro." })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("reinicia o temporizador de inatividade a cada nova mensagem, em vez de contar a partir da primeira troca", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockResolvedValue(
        createStreamResponse(["Certo."], { "X-Session-Id": "session-1" }) as unknown as Response
      );
      endSessionMock.mockResolvedValue({
        synthesis: {
          id: "synthesis-1",
          title: "...",
          themes: [],
          explored: "...",
          patterns: ["..."],
          openQuestion: "...?",
          depth: 4,
          durationMinutes: 60,
          exchangeCount: 2,
          createdAt: "2026-07-25T11:00:00Z",
        },
      });

      render(<ChatWindow />);
      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "Primeira mensagem de teste." },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
      for (let i = 0; i < 10; i += 1) {
        await vi.advanceTimersByTimeAsync(0);
      }

      // Quase 60 minutos desde a primeira troca, mas ainda dentro do prazo.
      await vi.advanceTimersByTimeAsync(INACTIVITY_TIMEOUT_MS - 1000);
      expect(endSessionMock).not.toHaveBeenCalled();

      // Nova atividade — deve reiniciar a contagem a partir daqui, não da primeira troca.
      fireEvent.change(screen.getByLabelText(/Sua mensagem/i), {
        target: { value: "Segunda mensagem de teste." },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
      for (let i = 0; i < 10; i += 1) {
        await vi.advanceTimersByTimeAsync(0);
      }

      // Se o temporizador não tivesse reiniciado, este avanço já ultrapassaria os 60
      // minutos desde a primeira troca e o encerramento já teria disparado.
      await vi.advanceTimersByTimeAsync(INACTIVITY_TIMEOUT_MS - 1000);
      expect(endSessionMock).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(2000);
      expect(endSessionMock).toHaveBeenCalledTimes(1);
      expect(endSessionMock).toHaveBeenCalledWith("session-1", 4);
    } finally {
      vi.useRealTimers();
    }
  });
});
