import { describe, expect, it } from "vitest";
import type { EmotionalState } from "./emotional-state";
import { BASE_SYSTEM_PROMPT, TONE_MAP, buildSystemPrompt, resolveMaxTokens } from "./prompts";

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
