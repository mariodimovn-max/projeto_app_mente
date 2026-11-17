// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";
import { getInstallPromptState, resetInstallPromptForTests } from "@/lib/pwa/installPrompt";

function stubServiceWorker(register: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register },
    configurable: true,
  });
}

describe("ServiceWorkerRegistrar", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    // Remove o stub para que o teste "sem suporte" enxergue um navigator sem serviceWorker.
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  });

  it("registra o service worker em produção, com escopo raiz e sem cache HTTP do script", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = vi.fn().mockResolvedValue({});
    stubServiceWorker(register);

    render(<ServiceWorkerRegistrar />);

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" })
    );
  });

  it("não registra fora de produção (evita interferir no HMR em dev)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const register = vi.fn().mockResolvedValue({});
    stubServiceWorker(register);

    render(<ServiceWorkerRegistrar />);

    expect(register).not.toHaveBeenCalled();
  });

  it("não quebra em navegador sem suporte a service worker", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect("serviceWorker" in navigator).toBe(false);

    expect(() => render(<ServiceWorkerRegistrar />)).not.toThrow();
  });

  it("falha de registro vai só para o console, sem lançar", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const register = vi.fn().mockRejectedValue(new Error("sem https"));
    stubServiceWorker(register);

    const { container } = render(<ServiceWorkerRegistrar />);

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

// Story 6.2: a captura do `beforeinstallprompt` começa no layout raiz, em qualquer ambiente,
// para o item "Instalar" de Configurações não perder o evento da primeira página.
describe("ServiceWorkerRegistrar — captura do convite de instalação", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetInstallPromptForTests();
  });

  it.each(["development", "production"])("começa a capturar o evento em %s", (env) => {
    vi.stubEnv("NODE_ENV", env);
    resetInstallPromptForTests();

    render(<ServiceWorkerRegistrar />);
    window.dispatchEvent(
      Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
        platforms: ["web"],
      })
    );

    expect(getInstallPromptState()).toBe("available");
  });
});
