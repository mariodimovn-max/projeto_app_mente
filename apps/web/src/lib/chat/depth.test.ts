import { describe, expect, it } from "vitest";
import {
  MAX_DEPTH,
  depthFraction,
  depthLevelHint,
  depthLevelLabel,
  depthReadingLabel,
  nextDepth,
  resolveDepthLevel,
} from "./depth";

describe("resolveDepthLevel", () => {
  it("classifica 0-3 como superfície", () => {
    expect(resolveDepthLevel(0)).toBe("superficie");
    expect(resolveDepthLevel(3)).toBe("superficie");
  });

  it("classifica 4-7 como correntes", () => {
    expect(resolveDepthLevel(4)).toBe("correntes");
    expect(resolveDepthLevel(7)).toBe("correntes");
  });

  it("classifica 8+ como fundo", () => {
    expect(resolveDepthLevel(8)).toBe("fundo");
    expect(resolveDepthLevel(MAX_DEPTH)).toBe("fundo");
  });
});

describe("depthLevelLabel e depthLevelHint", () => {
  it("retornam rótulo e frase de incentivo coerentes com o nível", () => {
    expect(depthLevelLabel(2)).toBe("Superfície");
    expect(depthLevelHint(2)).toMatch(/superfície/i);

    expect(depthLevelLabel(5)).toBe("Correntes");
    expect(depthLevelHint(5)).toMatch(/correntes/i);

    expect(depthLevelLabel(10)).toBe("Fundo");
    expect(depthLevelHint(10)).toMatch(/fundo/i);
  });
});

describe("nextDepth", () => {
  it("incrementa em +2m por troca", () => {
    expect(nextDepth(0)).toBe(2);
    expect(nextDepth(4)).toBe(6);
  });

  it("nunca ultrapassa o limite máximo", () => {
    expect(nextDepth(11)).toBe(MAX_DEPTH);
    expect(nextDepth(MAX_DEPTH)).toBe(MAX_DEPTH);
  });
});

describe("depthReadingLabel", () => {
  it("formata a leitura em metros negativos", () => {
    expect(depthReadingLabel(0)).toBe("−0m");
    expect(depthReadingLabel(8)).toBe("−8m");
  });
});

describe("depthFraction", () => {
  it("normaliza a profundidade para uma fração entre 0 e 1", () => {
    expect(depthFraction(0)).toBe(0);
    expect(depthFraction(MAX_DEPTH)).toBe(1);
    expect(depthFraction(6)).toBeCloseTo(0.5);
  });
});
