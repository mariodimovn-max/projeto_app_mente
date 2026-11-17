import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Story 6.2 / ADR 0008 — guarda da interpretação híbrida do NFR6:
// - conteúdo e interação ≥ 14px (`var(--fs-sm)` ou maior);
// - rótulos decorativos e metadados ≥ 12px, SÓ via `var(--fs-xs)`.
// Por isso nenhum CSS pode declarar fonte literal (rem/em/px) abaixo de 14px: texto pequeno tem
// de passar pelo token, o que torna o uso uma escolha consciente e revisável.

const SRC = join(__dirname, "../..");
const MIN_LITERAL_REM = 0.875;

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

function toRem(value: number, unit: string): number {
  return unit === "px" ? value / 16 : value;
}

interface Violation {
  location: string;
  declaration: string;
}

function findSmallFontLiterals(css: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const declaration = /font(?:-size)?\s*:\s*([^;}]+)/g;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(css))) {
    const value = match[1] ?? "";
    // Ignora o que vem depois da barra (line-height) e as variáveis.
    const sizePart = value.replace(/\/\s*[\d.]+[a-z%]*/gi, "");
    const literals = [...sizePart.matchAll(/(\d*\.?\d+)(rem|em|px)\b/g)];
    if (literals.some(([, n, unit]) => toRem(Number(n), unit!) < MIN_LITERAL_REM)) {
      const line = css.slice(0, match.index).split("\n").length;
      violations.push({ location: `${relative(SRC, file)}:${line}`, declaration: match[0].trim() });
    }
  }
  return violations;
}

const variablesCss = readFileSync(join(SRC, "styles/variables.css"), "utf-8");

function readTokenRem(name: string): number {
  const match = variablesCss.match(new RegExp(`--${name}:\\s*([\\d.]+)rem`));
  if (!match?.[1]) throw new Error(`Token --${name} não encontrado em variables.css`);
  return Number(match[1]);
}

describe("tipografia mínima (NFR6, ADR 0008)", () => {
  it("nenhum CSS declara fonte literal abaixo de 14px — texto menor só via var(--fs-xs)", () => {
    const violations = cssFiles(SRC).flatMap((file) =>
      findSmallFontLiterals(readFileSync(file, "utf-8"), file)
    );

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("--fs-xs, o único caminho para texto pequeno, vale 12px", () => {
    expect(readTokenRem("fs-xs") * 16).toBeCloseTo(12, 5);
  });

  it("o detector pega shorthand, font-size, px e clamp(), e ignora line-height e tokens", () => {
    const sample = [
      ".a { font: 400 0.6875rem var(--font-mono); }",
      ".b { font-size: 12px; }",
      ".c { font: 400 clamp(0.6875rem, 1vw, 1rem) var(--font-mono); }",
      ".d { font: 400 var(--fs-sm)/1.4 var(--font-sans); }",
      ".e { font: 500 1rem/0.5 var(--font-sans); }",
      ".f { font-size: var(--fs-xs); }",
    ].join("\n");

    const found = findSmallFontLiterals(sample, join(SRC, "x.css")).map((v) => v.location);

    expect(found).toEqual(["x.css:1", "x.css:2", "x.css:3"]);
  });
});
