import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const variablesCss = readFileSync(
  join(__dirname, "../../styles/variables.css"),
  "utf-8"
);

function readToken(name: string): string {
  const match = variablesCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) {
    throw new Error(`Token --${name} não encontrado em variables.css`);
  }
  return match[1].trim();
}

describe("contrastRatio", () => {
  it("calcula 21:1 entre preto e branco", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("calcula 1:1 para cores iguais", () => {
    expect(contrastRatio("#4FD1CA", "#4FD1CA")).toBeCloseTo(1, 5);
  });

  it("rejeita cores em formato não-hexadecimal em vez de retornar NaN silenciosamente", () => {
    expect(() => contrastRatio("#0C1118", "rgba(255,255,255,0.08)")).toThrow(
      /hexadecimal/
    );
  });
});

describe("contraste dos tokens do design system (WCAG 2.1 AA — mínimo 4.5:1)", () => {
  const bg = readToken("color-bg");
  const surface = readToken("color-surface");
  const text = readToken("color-text");
  const muted = readToken("color-muted");

  it("texto principal sobre o fundo padrão", () => {
    expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto secundário (muted) sobre o fundo padrão", () => {
    expect(contrastRatio(bg, muted)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto principal sobre superfícies (cards)", () => {
    expect(contrastRatio(surface, text)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto secundário (muted) sobre superfícies (cards)", () => {
    expect(contrastRatio(surface, muted)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("escala tipográfica (WCAG 2.1 SC 1.4.4 — Resize Text)", () => {
  it.each(["fs-sm", "fs-md", "fs-lg", "fs-xl", "fs-xxl"])(
    "--%s é definido em unidade relativa (rem), não em px",
    (token) => {
      expect(readToken(token)).toMatch(/^-?\d*\.?\d+rem$/);
    }
  );

  it("fs-sm corresponde a 14px e fs-xl a 24px na base padrão de 16px", () => {
    expect(parseFloat(readToken("fs-sm")) * 16).toBeCloseTo(14, 5);
    expect(parseFloat(readToken("fs-xl")) * 16).toBeCloseTo(24, 5);
  });
});
