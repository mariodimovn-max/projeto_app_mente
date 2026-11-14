// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInstallPromptState,
  promptInstall,
  resetInstallPromptForTests,
  startInstallPromptCapture,
  subscribeInstallPrompt,
} from "./installPrompt";

function fakeInstallEvent(outcome: "accepted" | "dismissed" = "accepted") {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome, platform: "web" }),
    platforms: ["web"],
  });
  return { event, prompt };
}

function stubStandalone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches }),
  });
}

describe("installPrompt", () => {
  beforeEach(() => {
    resetInstallPromptForTests();
  });

  afterEach(() => {
    resetInstallPromptForTests();
    delete (window as unknown as Record<string, unknown>).matchMedia;
  });

  it("começa indisponível quando o navegador não ofereceu instalação", () => {
    startInstallPromptCapture();
    expect(getInstallPromptState()).toBe("unavailable");
  });

  it("guarda o evento mesmo antes de qualquer tela se inscrever, e suprime o mini-infobar", () => {
    startInstallPromptCapture();
    const { event } = fakeInstallEvent();

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(getInstallPromptState()).toBe("available");
  });

  it("notifica os inscritos quando o evento chega", () => {
    startInstallPromptCapture();
    const listener = vi.fn();
    subscribeInstallPrompt(listener);

    window.dispatchEvent(fakeInstallEvent().event);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("registra os listeners uma única vez, mesmo chamado várias vezes", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    startInstallPromptCapture();
    startInstallPromptCapture();

    const calls = addEventListener.mock.calls.filter(([type]) => type === "beforeinstallprompt");
    expect(calls).toHaveLength(1);
    addEventListener.mockRestore();
  });

  it("vira 'installed' quando o app é instalado, descartando o evento", () => {
    startInstallPromptCapture();
    window.dispatchEvent(fakeInstallEvent().event);

    window.dispatchEvent(new Event("appinstalled"));

    expect(getInstallPromptState()).toBe("installed");
  });

  it("vira 'installed' quando já roda como app instalado (display-mode: standalone)", () => {
    stubStandalone(true);
    startInstallPromptCapture();
    window.dispatchEvent(fakeInstallEvent().event);

    expect(getInstallPromptState()).toBe("installed");
  });

  it.each(["accepted", "dismissed"] as const)(
    "abre o prompt nativo e descarta o evento depois (%s) — ele só pode ser usado uma vez",
    async (outcome) => {
      startInstallPromptCapture();
      const { event, prompt } = fakeInstallEvent(outcome);
      window.dispatchEvent(event);
      const listener = vi.fn();
      subscribeInstallPrompt(listener);

      await promptInstall();

      expect(prompt).toHaveBeenCalledTimes(1);
      expect(getInstallPromptState()).toBe("unavailable");
      expect(listener).toHaveBeenCalled();
    }
  );

  it("mantém o evento enquanto o prompt está aberto e não abre um segundo prompt", async () => {
    startInstallPromptCapture();
    let resolveChoice!: (c: { outcome: "accepted"; platform: string }) => void;
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: new Promise((r) => {
        resolveChoice = r;
      }),
      platforms: ["web"],
    });
    window.dispatchEvent(event);

    const first = promptInstall();
    expect(getInstallPromptState()).toBe("available");
    await promptInstall();
    expect(prompt).toHaveBeenCalledTimes(1);

    resolveChoice({ outcome: "accepted", platform: "web" });
    await first;
    expect(getInstallPromptState()).toBe("unavailable");
  });

  it("promptInstall sem evento guardado não faz nada nem lança", async () => {
    startInstallPromptCapture();
    await expect(promptInstall()).resolves.toBeUndefined();
  });

  it("o cancelamento da inscrição para de notificar", () => {
    startInstallPromptCapture();
    const listener = vi.fn();
    const unsubscribe = subscribeInstallPrompt(listener);
    unsubscribe();

    window.dispatchEvent(fakeInstallEvent().event);

    expect(listener).not.toHaveBeenCalled();
  });
});
