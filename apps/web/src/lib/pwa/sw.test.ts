import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Executa public/sw.js de verdade num contexto isolado, com `self`, `caches`, `fetch` e
// `clients` falsos, e dispara os eventos do ciclo de vida para checar a regra de privacidade:
// só a página offline vai para o cache; nenhuma resposta de rede é gravada.

const SW_SOURCE = readFileSync(path.resolve(__dirname, "../../../public/sw.js"), "utf8");

type Listener = (event: Record<string, unknown>) => void;

function loadServiceWorker() {
  const listeners: Record<string, Listener> = {};
  const cacheAdd = vi.fn().mockResolvedValue(undefined);
  const cachePut = vi.fn();
  const cacheStore = { add: cacheAdd, put: cachePut, addAll: vi.fn() };
  const offlineResponse = new Response("offline", { status: 200 });

  const caches = {
    open: vi.fn().mockResolvedValue(cacheStore),
    keys: vi.fn().mockResolvedValue(["diario-offline-v0", "diario-offline-v1", "outro-cache"]),
    delete: vi.fn().mockResolvedValue(true),
    match: vi.fn().mockResolvedValue(offlineResponse),
  };
  const fetchMock = vi.fn();
  const self = {
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
  };

  // No Node, `new Request("/offline.html")` lança (URL relativa); no SW ela resolve contra a
  // origem. Um Request mínimo basta para inspecionar o que o SW pede ao cache.
  class FakeRequest {
    constructor(
      public url: string,
      public init: RequestInit = {}
    ) {}
  }

  vm.runInNewContext(SW_SOURCE, {
    self,
    caches,
    fetch: fetchMock,
    Request: FakeRequest,
    Response,
    Promise,
  });

  function dispatch(type: string, extra: Record<string, unknown> = {}) {
    let waited: Promise<unknown> | undefined;
    let responded: Promise<unknown> | undefined;
    listeners[type]!({
      ...extra,
      waitUntil: (p: Promise<unknown>) => {
        waited = p;
      },
      respondWith: (p: Promise<unknown>) => {
        responded = p;
      },
    });
    return { waited, responded };
  }

  return { dispatch, caches, cacheAdd, cachePut, fetchMock, self, offlineResponse };
}

describe("service worker (public/sw.js)", () => {
  let sw: ReturnType<typeof loadServiceWorker>;

  beforeEach(() => {
    sw = loadServiceWorker();
  });

  it("no install, guarda em cache apenas a página offline e assume sem esperar", async () => {
    const { waited } = sw.dispatch("install");
    await waited;

    expect(sw.caches.open).toHaveBeenCalledWith("diario-offline-v1");
    expect(sw.cacheAdd).toHaveBeenCalledTimes(1);
    // Só a página offline, buscada ignorando o cache HTTP (versão nova do SW = offline.html atual).
    expect(sw.cacheAdd).toHaveBeenCalledWith({ url: "/offline.html", init: { cache: "reload" } });
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });

  it("no activate, apaga caches de outras versões e assume as abas abertas", async () => {
    const { waited } = sw.dispatch("activate");
    await waited;

    expect(sw.caches.delete).toHaveBeenCalledWith("diario-offline-v0");
    expect(sw.caches.delete).toHaveBeenCalledWith("outro-cache");
    expect(sw.caches.delete).not.toHaveBeenCalledWith("diario-offline-v1");
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });

  it.each([
    ["POST de Server Action", { mode: "same-origin", method: "POST", url: "https://app/chat" }],
    ["streaming do /api/chat", { mode: "cors", method: "POST", url: "https://app/api/chat" }],
    ["chamada ao Supabase", { mode: "cors", method: "GET", url: "https://x.supabase.co/rest/v1" }],
    ["asset estático", { mode: "no-cors", method: "GET", url: "https://app/_next/static/a.js" }],
  ])("não intercepta requisição que não é navegação (%s)", (_label, request) => {
    const { responded } = sw.dispatch("fetch", { request });

    expect(responded).toBeUndefined();
    expect(sw.fetchMock).not.toHaveBeenCalled();
  });

  it("navegação com rede ok devolve a resposta da rede sem gravar nada em cache", async () => {
    const networkResponse = new Response("pagina autenticada");
    sw.fetchMock.mockResolvedValue(networkResponse);
    const request = { mode: "navigate", method: "GET", url: "https://app/historico" };

    const { responded } = sw.dispatch("fetch", { request });

    await expect(responded).resolves.toBe(networkResponse);
    expect(sw.fetchMock).toHaveBeenCalledWith(request);
    expect(sw.cachePut).not.toHaveBeenCalled();
    expect(sw.caches.open).not.toHaveBeenCalled();
  });

  it("navegação sem conexão devolve a página offline", async () => {
    sw.fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const request = { mode: "navigate", method: "GET", url: "https://app/chat" };

    const { responded } = sw.dispatch("fetch", { request });

    await expect(responded).resolves.toBe(sw.offlineResponse);
    expect(sw.caches.match).toHaveBeenCalledWith("/offline.html");
  });

  it("sem conexão e sem a página em cache, devolve erro de rede em vez de quebrar", async () => {
    sw.fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    sw.caches.match.mockResolvedValue(undefined);
    const request = { mode: "navigate", method: "GET", url: "https://app/" };

    const { responded } = sw.dispatch("fetch", { request });

    const response = (await responded) as Response;
    expect(response.type).toBe("error");
  });
});
