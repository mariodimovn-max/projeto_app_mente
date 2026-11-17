import { describe, expect, it } from "vitest";
import { resolveCallback } from "./resolveCallback";

const TOKENS = { access_token: "a", refresh_token: "b" };

describe("resolveCallback", () => {
  it("convite válido sem next vai para /auth/definir-senha", () => {
    const result = resolveCallback("", "#access_token=a&refresh_token=b&type=invite");

    expect(result).toEqual({
      next: "/auth/definir-senha",
      errorRedirect: "/auth?erro=convite-invalido",
      tokens: TOKENS,
      code: null,
    });
  });

  it("recuperação válida sem next vai para /auth/redefinir-senha", () => {
    const result = resolveCallback("", "#access_token=a&refresh_token=b&type=recovery");

    expect(result).toEqual({
      next: "/auth/redefinir-senha",
      errorRedirect: "/auth?erro=link-invalido",
      tokens: TOKENS,
      code: null,
    });
  });

  it("respeita um next interno informado na query", () => {
    const result = resolveCallback("?next=/chat", "#access_token=a&refresh_token=b&type=invite");

    expect(result.next).toBe("/chat");
    expect(result.tokens).toEqual(TOKENS);
  });

  it("ignora next externo (open redirect) e usa o destino padrão do tipo", () => {
    expect(
      resolveCallback("?next=//evil.com", "#access_token=a&refresh_token=b&type=invite").next
    ).toBe("/auth/definir-senha");
    expect(
      resolveCallback("?next=https://evil.com", "#access_token=a&refresh_token=b&type=recovery")
        .next
    ).toBe("/auth/redefinir-senha");
  });

  it("não extrai tokens quando o Supabase devolve erro no fragmento (link expirado)", () => {
    const result = resolveCallback(
      "?next=/auth/definir-senha",
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid"
    );

    expect(result.tokens).toBeNull();
    expect(result.errorRedirect).toBe("/auth?erro=convite-invalido");
  });

  it("infere o tipo recovery a partir do next quando o fragmento de erro não traz type", () => {
    const result = resolveCallback("?next=/auth/redefinir-senha", "#error=access_denied");

    expect(result.tokens).toBeNull();
    expect(result.errorRedirect).toBe("/auth?erro=link-invalido");
  });

  it("não extrai tokens quando falta o refresh_token no fragmento", () => {
    expect(resolveCallback("", "#access_token=a&type=invite").tokens).toBeNull();
  });

  it("não extrai tokens quando não há fragmento nenhum", () => {
    const result = resolveCallback("", "");

    expect(result.tokens).toBeNull();
    expect(result.errorRedirect).toBe("/auth?erro=convite-invalido");
  });

  // Fluxo PKCE: recuperação de senha disparada pelo client @supabase/ssr (PKCE por padrão).
  it("recuperação PKCE: extrai o code da query e segue para /auth/redefinir-senha", () => {
    const result = resolveCallback("?next=/auth/redefinir-senha&code=abc-123", "");

    expect(result).toEqual({
      next: "/auth/redefinir-senha",
      errorRedirect: "/auth?erro=link-invalido",
      tokens: null,
      code: "abc-123",
    });
  });

  it("PKCE com erro na query (link expirado) não extrai code e aponta o erro de recuperação", () => {
    const result = resolveCallback(
      "?next=/auth/redefinir-senha&error=access_denied&error_code=otp_expired&error_description=expired",
      ""
    );

    expect(result.code).toBeNull();
    expect(result.tokens).toBeNull();
    expect(result.errorRedirect).toBe("/auth?erro=link-invalido");
  });

  it("prefere os tokens do fragmento quando a URL traz tokens e code", () => {
    const result = resolveCallback("?code=abc", "#access_token=a&refresh_token=b&type=invite");

    expect(result.tokens).toEqual(TOKENS);
    expect(result.code).toBeNull();
  });

  it("ignora code vazio", () => {
    expect(resolveCallback("?next=/auth/redefinir-senha&code=", "").code).toBeNull();
  });
});
