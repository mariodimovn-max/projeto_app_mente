import { describe, expect, it, vi } from "vitest";

// As fontes do next/font só funcionam no build do Next; aqui basta um stub.
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "font-var", className: "font-class" });
  return { Instrument_Sans: font, Newsreader: font, Space_Mono: font };
});

describe("layout raiz — viewport", () => {
  it("cobre a tela inteira (viewport-fit=cover) para liberar as áreas seguras, com tema escuro", async () => {
    const { viewport } = await import("./layout");

    expect(viewport).toEqual({ themeColor: "#080f12", colorScheme: "dark", viewportFit: "cover" });
  });

  it("não define interactiveWidget — a nav fixa fica atrás do teclado em vez de subir com ele", async () => {
    const { viewport } = await import("./layout");

    expect(viewport).not.toHaveProperty("interactiveWidget");
  });
});
