import { describe, expect, it } from "vitest";
import type { EmotionalState } from "./emotional-state";
import type { SessionOpeningContext } from "./memory";
import {
  BASE_SYSTEM_PROMPT,
  STANDARD_OPENING_QUESTION,
  TONE_MAP,
  buildSystemPrompt,
  resolveMaxTokens,
} from "./prompts";

const ALL_STATES: EmotionalState[] = ["melancholy", "inflated", "confused", "neutral"];

describe("TONE_MAP", () => {
  it.each(ALL_STATES)("has a description and systemAddendum for '%s'", (state) => {
    expect(TONE_MAP[state].description).toBeTruthy();
    expect(TONE_MAP[state].systemAddendum).toBeTruthy();
  });
});

describe("buildSystemPrompt", () => {
  it.each(ALL_STATES)("includes the base prompt and the tone addendum for '%s'", (state) => {
    const result = buildSystemPrompt(state);
    expect(result).toContain(BASE_SYSTEM_PROMPT);
    expect(result).toContain(TONE_MAP[state].systemAddendum);
    expect(result).toContain("AJUSTE DE TOM PARA ESTA SESSÃO:");
  });

  it("never diagnoses or prescribes per the base prompt principles", () => {
    expect(BASE_SYSTEM_PROMPT).toContain("Nunca diagnostique nem prescreva");
  });

  it("defaults to low intensity, adding no extra length guidance", () => {
    expect(buildSystemPrompt("melancholy")).toBe(buildSystemPrompt("melancholy", "low"));
  });

  it("adds a brevity instruction for intense melancholy signals", () => {
    const result = buildSystemPrompt("melancholy", "high");
    expect(result).toContain("breve");
  });

  it("adds a depth instruction for intense non-melancholy signals", () => {
    const result = buildSystemPrompt("confused", "high");
    expect(result).toContain("aprofund");
  });

  it("shares the same depth instruction across all non-melancholy states", () => {
    const inflatedAddendum = buildSystemPrompt("inflated", "high").split("\n\n").pop();
    const confusedAddendum = buildSystemPrompt("confused", "high").split("\n\n").pop();
    const neutralAddendum = buildSystemPrompt("neutral", "high").split("\n\n").pop();
    expect(inflatedAddendum).toBe(confusedAddendum);
    expect(inflatedAddendum).toBe(neutralAddendum);
  });

  it("não inclui bloco de memória quando memoryContext é null (usuário sem sessões anteriores)", () => {
    const result = buildSystemPrompt("neutral", "low", null);
    expect(result).not.toContain("MEMÓRIA");
  });

  it("anexa o bloco de memória em camadas ao final do prompt quando fornecido", () => {
    const memoryContext = "MEMÓRIA DE SESSÕES ANTERIORES\n\nSínteses das últimas sessões...";
    const result = buildSystemPrompt("neutral", "low", memoryContext);
    expect(result.endsWith(memoryContext)).toBe(true);
  });

  it("inclui o bloco de memória mesmo com intensidade alta, após o ajuste de intensidade", () => {
    const memoryContext = "MEMÓRIA DE SESSÕES ANTERIORES\n\n...";
    const result = buildSystemPrompt("melancholy", "high", memoryContext);
    expect(result).toContain("breve");
    expect(result.endsWith(memoryContext)).toBe(true);
  });

  describe("abertura adaptativa (Story 3.6)", () => {
    it("não inclui instrução de abertura quando openingContext é null (padrão, mensagens fora da abertura da sessão)", () => {
      const result = buildSystemPrompt("neutral", "low", null, null);
      expect(result).not.toContain("ABERTURA DESTA SESSÃO");
    });

    it("instrui a usar a pergunta-guia estruturada padrão, verbatim, na primeira sessão do usuário", () => {
      const context: SessionOpeningContext = {
        isFirstSession: true,
        previousOpeningPhrase: null,
        responsePattern: null,
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain("primeira sessão do usuário");
      expect(result).toContain(`"${STANDARD_OPENING_QUESTION}"`);
    });

    it("instrui a oferecer mais estímulo quando o padrão de resposta recente é curto", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: null,
        responsePattern: "curto",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain("mensagens curtas");
      expect(result).toContain("mais estímulo");
      expect(result).not.toContain(STANDARD_OPENING_QUESTION);
    });

    it("instrui a abrir mais espaço quando o padrão de resposta recente é longo", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: null,
        responsePattern: "longo",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain("mensagens longas");
      expect(result).toContain("mais espaço");
    });

    it("instrui a nunca repetir literalmente a frase de abertura da sessão imediatamente anterior", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: "O que te trouxe aqui hoje?",
        responsePattern: "longo",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain('"O que te trouxe aqui hoje?"');
      expect(result).toContain("Nunca repita essa frase literalmente");
    });

    it("omite a linha de anti-repetição quando não há frase de abertura anterior conhecida", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: null,
        responsePattern: null,
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).not.toContain("Nunca repita essa frase literalmente");
    });

    it("anexa a instrução de abertura após o bloco de memória em camadas", () => {
      const memoryContext = "MEMÓRIA DE SESSÕES ANTERIORES\n\n...";
      const context: SessionOpeningContext = {
        isFirstSession: true,
        previousOpeningPhrase: null,
        responsePattern: null,
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", memoryContext, context);

      expect(result.indexOf(memoryContext)).toBeLessThan(result.indexOf("ABERTURA DESTA SESSÃO"));
    });

    it("inclui os temas recorrentes de user_patterns na abertura de uma sessão subsequente (AC2)", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: null,
        responsePattern: "longo",
        topThemes: ["sono", "trabalho"],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain("Temas recorrentes no histórico do usuário: sono, trabalho");
    });

    it("não inclui a linha de temas quando topThemes está vazio", () => {
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: null,
        responsePattern: "longo",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).not.toContain("Temas recorrentes");
    });

    it("trunca a frase de abertura anterior quando ela é muito longa", () => {
      const longPhrase = "a".repeat(500);
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: longPhrase,
        responsePattern: "longo",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).not.toContain(longPhrase);
      expect(result).toContain(`${"a".repeat(200)}…`);
    });

    it("não trunca uma frase de abertura anterior dentro do limite", () => {
      const shortPhrase = "O que te trouxe aqui hoje?";
      const context: SessionOpeningContext = {
        isFirstSession: false,
        previousOpeningPhrase: shortPhrase,
        responsePattern: "longo",
        topThemes: [],
      };
      const result = buildSystemPrompt("neutral", "low", null, context);

      expect(result).toContain(`"${shortPhrase}"`);
    });
  });
});

describe("resolveMaxTokens", () => {
  it("uses the standard token budget at low intensity, for every state", () => {
    const states: EmotionalState[] = ["melancholy", "inflated", "confused", "neutral"];
    for (const state of states) {
      expect(resolveMaxTokens(state, "low")).toBe(1024);
    }
  });

  it("shortens the token budget for intense melancholy (crisis-like signals)", () => {
    expect(resolveMaxTokens("melancholy", "high")).toBeLessThan(resolveMaxTokens("melancholy", "low"));
  });

  it("lengthens the token budget for intense, non-melancholy engagement", () => {
    expect(resolveMaxTokens("confused", "high")).toBeGreaterThan(resolveMaxTokens("confused", "low"));
    expect(resolveMaxTokens("inflated", "high")).toBeGreaterThan(resolveMaxTokens("inflated", "low"));
  });
});
