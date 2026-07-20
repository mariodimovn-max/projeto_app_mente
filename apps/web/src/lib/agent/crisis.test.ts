import { describe, expect, it } from "vitest";
import { CRISIS_RESPONSE_MESSAGE, detectCrisisSignal } from "./crisis";

describe("detectCrisisSignal", () => {
  it("detects explicit suicidal ideation", () => {
    expect(detectCrisisSignal("Ultimamente eu só penso: eu quero morrer.")).toBe(true);
  });

  it("detects suicidal ideation phrased with 'suicídio'", () => {
    expect(detectCrisisSignal("Tenho tido pensamentos suicidas essa semana toda.")).toBe(true);
  });

  it("detects the unaccented spelling of 'suicídio'", () => {
    expect(detectCrisisSignal("Ando pensando em suicidio o tempo todo.")).toBe(true);
  });

  it("detects self-harm signals", () => {
    expect(detectCrisisSignal("Ontem eu tive vontade de cortar os pulsos de novo.")).toBe(true);
  });

  it("detects medication abandonment signals", () => {
    expect(
      detectCrisisSignal("Semana passada eu parei de tomar o remédio sem falar com ninguém.")
    ).toBe(true);
  });

  it("detects the unaccented spelling of medication abandonment", () => {
    expect(detectCrisisSignal("Eu parei de tomar a medicacao ha duas semanas.")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectCrisisSignal("EU QUERO MORRER E NÃO SEI MAIS O QUE FAZER.")).toBe(true);
  });

  it("still detects a real signal when 'não' appears earlier in the sentence, unrelated to it", () => {
    expect(detectCrisisSignal("Eu não sei mais o que fazer, quero morrer.")).toBe(true);
  });

  it("does not false-positive on ordinary melancholy without explicit crisis signals", () => {
    expect(
      detectCrisisSignal("Estou muito triste, me sinto vazio, sem energia, é um fracasso total.")
    ).toBe(false);
  });

  it("does not false-positive on unrelated uses of 'parei' or 'remédio'", () => {
    expect(detectCrisisSignal("Parei de tomar café à noite e o remédio para dor de cabeça ajudou.")).toBe(
      false
    );
  });

  it("does not false-positive on a neutral message", () => {
    expect(
      detectCrisisSignal("Hoje fui ao mercado e depois assisti um filme com meus amigos.")
    ).toBe(false);
  });

  describe("negation", () => {
    it("does not fire when the signal is immediately denied with 'não'", () => {
      expect(
        detectCrisisSignal(
          "Só para constar, eu não penso em suicídio, só queria entender esse assunto."
        )
      ).toBe(false);
    });

    it("does not fire when the signal is immediately denied with 'nunca'", () => {
      expect(detectCrisisSignal("Nunca vou me matar, só estou desabafando.")).toBe(false);
    });

    it("does not fire when the signal is immediately denied with 'não vou'", () => {
      expect(detectCrisisSignal("Não vou me matar, só estou muito cansado hoje.")).toBe(false);
    });
  });

  describe("common idioms", () => {
    it("does not fire on 'morrer de rir'", () => {
      expect(detectCrisisSignal("Esse vídeo é tão engraçado, quero morrer de rir.")).toBe(false);
    });

    it("does not fire on 'overdose de cafeína'", () => {
      expect(detectCrisisSignal("Tomei uma overdose de cafeína hoje, ri litros.")).toBe(false);
    });

    it("does not fire on 'overdose de série'", () => {
      expect(detectCrisisSignal("Foi uma overdose de série esse final de semana.")).toBe(false);
    });

    it("still fires when the same short signal is not followed by a safe idiom", () => {
      expect(detectCrisisSignal("Acho que tomei uma overdose ontem à noite.")).toBe(true);
    });
  });

  describe("word-boundary protection", () => {
    it("does not match a short signal embedded inside an unrelated longer word", () => {
      expect(detectCrisisSignal("milhoesoverdosemilhoes não é uma palavra real")).toBe(false);
    });
  });

  describe("third-party mentions", () => {
    it("still fires for a third-party crisis mention, so the user gets the help resources", () => {
      expect(
        detectCrisisSignal("Minha irmã disse que tem tido pensamentos suicidas, o que eu faço?")
      ).toBe(true);
    });
  });
});

describe("CRISIS_RESPONSE_MESSAGE", () => {
  it("communicates the app's limits and directs to immediate help", () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain("não é atendimento de emergência");
    expect(CRISIS_RESPONSE_MESSAGE).toContain("Fale com um profissional agora");
  });

  it("includes concrete crisis resources", () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain("188");
    expect(CRISIS_RESPONSE_MESSAGE).toContain("CVV");
    expect(CRISIS_RESPONSE_MESSAGE).toContain("192");
  });

  it("addresses medication abandonment", () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain("medicação");
    expect(CRISIS_RESPONSE_MESSAGE).toContain("médico ou psiquiatra");
  });

  it("also addresses the case where it's someone else who is in crisis", () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain("outra pessoa");
  });
});
