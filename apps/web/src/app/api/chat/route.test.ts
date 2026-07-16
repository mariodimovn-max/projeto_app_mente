import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const sessionsInsertMock = vi.fn();
const messagesInsertMock = vi.fn();

function createSupabaseClient() {
  return {
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "sessions") {
        return {
          insert: (values: unknown) => ({
            select: () => ({
              single: async () => sessionsInsertMock(values),
            }),
          }),
        };
      }
      if (table === "messages") {
        return {
          insert: async (values: unknown) => messagesInsertMock(values),
        };
      }
      throw new Error(`tabela inesperada: ${table}`);
    },
  };
}

const createClientMock = vi.fn(async () => createSupabaseClient());

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

const buildConversationMessagesMock = vi.fn(async () => [
  { role: "user" as const, content: "Uma mensagem válida de teste." },
]);

vi.mock("@/lib/agent/memory", () => ({
  buildConversationMessages: buildConversationMessagesMock,
}));

function createFakeMessageStream(chunks: string[], shouldFail = false) {
  const listeners: Record<string, Array<(delta: string) => void>> = {};
  return {
    on(event: string, cb: (delta: string) => void) {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
      return this;
    },
    async finalMessage() {
      if (shouldFail) {
        throw new Error("falha simulada da Anthropic API");
      }
      for (const chunk of chunks) {
        listeners.text?.forEach((cb) => cb(chunk));
      }
      return { content: [] };
    },
  };
}

const streamMock = vi.fn(() => createFakeMessageStream(["Olá", ", tudo bem?"]));
const getAnthropicClientMock = vi.fn(() => ({ messages: { stream: streamMock } }));

vi.mock("@/lib/agent/client.server", () => ({
  getAnthropicClient: getAnthropicClientMock,
}));

async function readFullBody(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

function postRequest(body: unknown) {
  return new NextRequest("https://app.exemplo.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    sessionsInsertMock.mockReset();
    messagesInsertMock.mockReset();
    buildConversationMessagesMock.mockClear();
    streamMock.mockClear();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    sessionsInsertMock.mockResolvedValue({ data: { id: "session-1" }, error: null });
    messagesInsertMock.mockResolvedValue({ error: null });
  });

  it("usa runtime Node.js", async () => {
    const route = await import("./route");
    expect(route.runtime).toBe("nodejs");
  });

  it("retorna 401 quando não há usuário autenticado", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");

    const response = await POST(postRequest({ message: "Uma mensagem válida de teste." }));

    expect(response.status).toBe(401);
    expect(sessionsInsertMock).not.toHaveBeenCalled();
  });

  it("rejeita mensagens fora do intervalo de 10 a 5000 caracteres com validação clara", async () => {
    const { POST } = await import("./route");

    const response = await POST(postRequest({ message: "curta" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.message).toContain("pelo menos 10");
    expect(sessionsInsertMock).not.toHaveBeenCalled();
    expect(messagesInsertMock).not.toHaveBeenCalled();
  });

  it("cria uma nova sessão e salva a mensagem do usuário quando não há sessão ativa", async () => {
    const { POST } = await import("./route");

    const response = await POST(postRequest({ message: "Uma mensagem válida de teste." }));
    await readFullBody(response);

    expect(sessionsInsertMock).toHaveBeenCalledWith({ user_id: "user-1" });
    expect(messagesInsertMock).toHaveBeenCalledWith({
      session_id: "session-1",
      role: "user",
      content: "Uma mensagem válida de teste.",
    });
    expect(response.headers.get("X-Session-Id")).toBe("session-1");
  });

  it("reutiliza a sessão informada em vez de criar uma nova", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      postRequest({
        message: "Uma mensagem válida de teste.",
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      })
    );
    await readFullBody(response);

    expect(sessionsInsertMock).not.toHaveBeenCalled();
    expect(messagesInsertMock).toHaveBeenCalledWith({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      role: "user",
      content: "Uma mensagem válida de teste.",
    });
  });

  it("transmite a resposta do agente em streaming e persiste o texto completo ao final", async () => {
    const { POST } = await import("./route");

    const response = await POST(postRequest({ message: "Uma mensagem válida de teste." }));
    const text = await readFullBody(response);

    expect(text).toBe("Olá, tudo bem?");
    expect(messagesInsertMock).toHaveBeenCalledWith({
      session_id: "session-1",
      role: "assistant",
      content: "Olá, tudo bem?",
    });
  });

  it("encerra o stream com erro quando a Anthropic API falha", async () => {
    streamMock.mockReturnValueOnce(createFakeMessageStream([], true));
    const { POST } = await import("./route");

    const response = await POST(postRequest({ message: "Uma mensagem válida de teste." }));

    await expect(readFullBody(response)).rejects.toThrow();
  });
});
