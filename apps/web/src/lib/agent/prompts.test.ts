import { describe, expect, it } from "vitest";
import type { EmotionalState } from "./emotional-state";
import { BASE_SYSTEM_PROMPT, TONE_MAP, buildSystemPrompt } from "./prompts";

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
});
