// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWindow } from "./ChatWindow";

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

function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText(/Sua mensagem/i), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
}

describe("ChatWindow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
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
});
