import { describe, expect, it } from "vitest";
import { chatRequestSchema, messageContentSchema } from "./message";

describe("messageContentSchema", () => {
  it("aceita mensagens dentro do intervalo de 10 a 5000 caracteres", () => {
    const result = messageContentSchema.safeParse("Hoje me senti bem em relação ao trabalho.");
    expect(result.success).toBe(true);
  });

  it("rejeita mensagens com menos de 10 caracteres", () => {
    const result = messageContentSchema.safeParse("oi tudo");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("pelo menos 10");
    }
  });

  it("rejeita mensagens com mais de 5000 caracteres", () => {
    const result = messageContentSchema.safeParse("a".repeat(5001));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("no máximo 5000");
    }
  });

  it("aparara espaços antes de validar o tamanho", () => {
    const result = messageContentSchema.safeParse("   oi   ");
    expect(result.success).toBe(false);
  });
});

describe("chatRequestSchema", () => {
  it("aceita um payload sem sessionId (primeira mensagem)", () => {
    const result = chatRequestSchema.safeParse({ message: "Uma mensagem válida de teste." });
    expect(result.success).toBe(true);
  });

  it("aceita um payload com sessionId em formato UUID", () => {
    const result = chatRequestSchema.safeParse({
      message: "Uma mensagem válida de teste.",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita sessionId que não é um UUID", () => {
    const result = chatRequestSchema.safeParse({
      message: "Uma mensagem válida de teste.",
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
