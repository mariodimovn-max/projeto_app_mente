import { describe, expect, it } from "vitest";
import { analyzeEmotionalState, detectEmotionalIntensity, detectEmotionalState } from "./emotional-state";

describe("detectEmotionalState", () => {
  it("detects melancholy from sadness/hopelessness signals", () => {
    expect(detectEmotionalState("Me sinto muito triste e sem energia hoje")).toBe(
      "melancholy",
    );
  });

  it("detects inflated ego from overconfidence/dismissive signals", () => {
    expect(
      detectEmotionalState("Eu sempre fui melhor que todos, óbvio que eu tenho razão"),
    ).toBe("inflated");
  });

  it("detects confusion from disorientation signals", () => {
    expect(
      detectEmotionalState("Não sei o que fazer, estou confuso, tudo ao mesmo tempo"),
    ).toBe("confused");
  });

  it("defaults to neutral when no signal matches", () => {
    expect(
      detectEmotionalState("Hoje fui ao mercado e depois assisti um filme com meus amigos"),
    ).toBe("neutral");
  });

  it("picks the state with the highest signal score when multiple match", () => {
    expect(
      detectEmotionalState(
        "Estou triste, mas também não sei o que fazer, não faz sentido, estou perdido",
      ),
    ).toBe("confused");
  });

  it("does not false-positive on 'mal' embedded inside unrelated words", () => {
    expect(
      detectEmotionalState("Isso é normal, sem problema, comprei uma mala nova"),
    ).toBe("neutral");
  });

  it("detects melancholy from the unaccented spelling 'inutil'", () => {
    expect(detectEmotionalState("Eu me sinto inutil")).toBe("melancholy");
  });

  it("does not double-count 'o que fazer' via the redundant 'que fazer' substring", () => {
    // "o que fazer" must contribute exactly one confused signal, not two — with the
    // old double-counting bug this scored confused=2 vs melancholy=1 ("triste"),
    // incorrectly picking "confused" instead of the tie-break-first "melancholy".
    expect(detectEmotionalState("Estou triste, o que fazer")).toBe("melancholy");
  });
});

describe("detectEmotionalIntensity", () => {
  it("is 'low' for neutral state regardless of message content", () => {
    expect(
      detectEmotionalIntensity(
        "Hoje fui ao mercado e depois assisti um filme com meus amigos",
        "neutral",
      ),
    ).toBe("low");
  });

  it("is 'low' when only one signal of the detected state matches", () => {
    expect(
      detectEmotionalIntensity("Me sinto muito triste hoje", "melancholy"),
    ).toBe("low");
  });

  it("is 'high' when three or more signals of the detected state match", () => {
    expect(
      detectEmotionalIntensity(
        "Estou triste, me sinto vazio, sem energia, sinto que não vale a pena, é um fracasso",
        "melancholy",
      ),
    ).toBe("high");
  });

  it("counts signals only for the given state, ignoring matches from other states", () => {
    expect(
      detectEmotionalIntensity(
        "Estou triste, mas também não sei o que fazer, não faz sentido, estou perdido",
        "melancholy",
      ),
    ).toBe("low");
  });
});

describe("analyzeEmotionalState", () => {
  it("returns the same state as detectEmotionalState", () => {
    const message = "Eu sempre fui melhor que todos, óbvio que eu tenho razão";
    expect(analyzeEmotionalState(message).state).toBe(detectEmotionalState(message));
  });

  it("returns the same intensity as detectEmotionalIntensity for the winning state", () => {
    const message =
      "Estou triste, me sinto vazio, sem energia, sinto que não vale a pena, é um fracasso";
    const { state, intensity } = analyzeEmotionalState(message);
    expect(intensity).toBe(detectEmotionalIntensity(message, state));
  });

  it("is 'low' intensity and 'neutral' state for a message with no signals", () => {
    expect(
      analyzeEmotionalState("Hoje fui ao mercado e depois assisti um filme com meus amigos"),
    ).toEqual({ state: "neutral", intensity: "low" });
  });

  it("is 'high' intensity when three or more signals of the winning state match", () => {
    expect(
      analyzeEmotionalState(
        "Não sei o que fazer, estou confuso, tudo ao mesmo tempo, não faz sentido",
      ),
    ).toEqual({ state: "confused", intensity: "high" });
  });
});
