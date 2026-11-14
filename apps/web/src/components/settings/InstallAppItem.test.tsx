// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetInstallPromptForTests, startInstallPromptCapture } from "@/lib/pwa/installPrompt";
import { InstallAppItem } from "./InstallAppItem";

function offerInstall() {
  let resolveChoice!: (choice: { outcome: "accepted" | "dismissed"; platform: string }) => void;
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: new Promise((resolve) => {
      resolveChoice = resolve;
    }),
    platforms: ["web"],
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return { prompt, resolveChoice };
}

describe("InstallAppItem", () => {
  beforeEach(() => {
    resetInstallPromptForTests();
    startInstallPromptCapture();
  });

  afterEach(() => {
    resetInstallPromptForTests();
    delete (window as unknown as Record<string, unknown>).matchMedia;
  });

  it("não aparece quando o navegador não oferece instalação", () => {
    const { container } = render(<InstallAppItem />);
    expect(container).toBeEmptyDOMElement();
  });

  it("aparece quando o navegador oferece instalação, mesmo que o evento tenha chegado antes", () => {
    offerInstall();

    render(<InstallAppItem />);

    expect(screen.getByText("Instalar o Diário na tela inicial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Instalar" })).toBeEnabled();
  });

  it("aparece se o evento chegar com a tela já aberta", () => {
    render(<InstallAppItem />);
    expect(screen.queryByRole("button", { name: "Instalar" })).not.toBeInTheDocument();

    offerInstall();

    expect(screen.getByRole("button", { name: "Instalar" })).toBeInTheDocument();
  });

  it("abre o prompt nativo ao tocar, com o botão desabilitado enquanto ele está aberto, e some depois", async () => {
    const { prompt, resolveChoice } = offerInstall();
    render(<InstallAppItem />);

    fireEvent.click(screen.getByRole("button", { name: "Instalar" }));

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Instalar" })).toBeDisabled();

    await act(async () => {
      resolveChoice({ outcome: "dismissed", platform: "web" });
    });

    expect(screen.queryByRole("button", { name: "Instalar" })).not.toBeInTheDocument();
  });

  it("some quando o app é instalado", () => {
    offerInstall();
    render(<InstallAppItem />);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(screen.queryByRole("button", { name: "Instalar" })).not.toBeInTheDocument();
  });

  it("não aparece quando já roda como app instalado", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    offerInstall();

    const { container } = render(<InstallAppItem />);

    expect(container).toBeEmptyDOMElement();
  });
});
