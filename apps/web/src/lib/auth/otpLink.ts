// Regras do link de e-mail/convite com token_hash (/auth/confirm), compartilhadas entre a página
// (GET, sem efeito colateral) e a Server Action que de fato consome o token (POST).

export const DEFAULT_NEXT_PATH_BY_TYPE = {
  invite: "/auth/definir-senha",
  recovery: "/auth/redefinir-senha",
} as const;

export type OtpLinkType = keyof typeof DEFAULT_NEXT_PATH_BY_TYPE;

export const INVALID_REDIRECT_BY_TYPE: Record<OtpLinkType, string> = {
  invite: "/auth?erro=convite-invalido",
  recovery: "/auth?erro=link-invalido",
};

export const FALLBACK_INVALID_REDIRECT = "/auth?erro=convite-invalido";

export function isOtpLinkType(type: unknown): type is OtpLinkType {
  return type === "invite" || type === "recovery";
}

export function resolveNextPath(next: unknown, fallback: string): string {
  // Só aceita caminhos internos (um único "/") — evita open redirect via
  // "next=@evil.com/..." ou "next=//evil.com" e o caso de "next=" vazio.
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}
