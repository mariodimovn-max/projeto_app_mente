// Interpreta a URL de retorno dos links de e-mail padrão do Supabase ({{ .ConfirmationURL }}).
// O endpoint /auth/v1/verify do Supabase valida o token e redireciona para cá com a sessão no
// fragmento (#access_token=...&refresh_token=...&type=invite|recovery) ou, em caso de link
// expirado/inválido, com #error=...&error_description=.... Ver ADR 0006.
//
// Função pura (sem window) para ser testável: recebe `search` ("?next=...") e `hash` ("#...").

export type CallbackType = "invite" | "recovery";

export interface CallbackTokens {
  access_token: string;
  refresh_token: string;
}

export interface CallbackResolution {
  // Para onde ir se a sessão for estabelecida com sucesso.
  next: string;
  // Para onde ir se o fragmento já indica erro ou se nenhuma sessão for encontrada.
  errorRedirect: string;
  // Tokens do fragmento, ou null quando ele traz um erro do Supabase ou não traz os dois tokens.
  // O client do browser (@supabase/ssr) roda em modo PKCE e rejeita fragmentos implícitos por
  // conta própria ("Not a valid PKCE flow url"), então a página extrai os tokens aqui e os entrega
  // via auth.setSession() em vez de depender de detectSessionInUrl.
  tokens: CallbackTokens | null;
}

const DEFAULT_NEXT_BY_TYPE: Record<CallbackType, string> = {
  invite: "/auth/definir-senha",
  recovery: "/auth/redefinir-senha",
};

const INVALID_REDIRECT_BY_TYPE: Record<CallbackType, string> = {
  invite: "/auth?erro=convite-invalido",
  recovery: "/auth?erro=link-invalido",
};

function isCallbackType(value: string | null): value is CallbackType {
  return value === "invite" || value === "recovery";
}

// Só aceita caminhos internos (um único "/") — mesmo critério de /auth/confirm, evita open
// redirect via "next=//evil.com" ou "next=@evil.com/...".
function sanitizeNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return null;
}

export function resolveCallback(search: string, hash: string): CallbackResolution {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  const requestedNext = sanitizeNext(query.get("next"));

  // Em caso de erro o Supabase não repete o `type` no fragmento, então o tipo é inferido do
  // destino pedido — é o que decide qual mensagem de erro mostrar em /auth.
  const fragmentType = fragment.get("type");
  const type: CallbackType = isCallbackType(fragmentType)
    ? fragmentType
    : requestedNext?.startsWith("/auth/redefinir-senha")
      ? "recovery"
      : "invite";

  const hasError = fragment.has("error") || fragment.has("error_description");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");

  return {
    next: requestedNext ?? DEFAULT_NEXT_BY_TYPE[type],
    errorRedirect: INVALID_REDIRECT_BY_TYPE[type],
    tokens:
      !hasError && accessToken && refreshToken
        ? { access_token: accessToken, refresh_token: refreshToken }
        : null,
  };
}
