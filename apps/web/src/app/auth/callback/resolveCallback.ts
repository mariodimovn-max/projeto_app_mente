// Interpreta a URL de retorno dos links de e-mail padrão do Supabase ({{ .ConfirmationURL }}).
// O endpoint /auth/v1/verify do Supabase valida o token e redireciona para cá em um de dois
// formatos, conforme quem disparou o e-mail (ver ADR 0006):
// - fluxo implícito (convite via admin API, sem PKCE): sessão no fragmento
//   (#access_token=...&refresh_token=...&type=invite|recovery);
// - fluxo PKCE (recuperação de senha disparada pelo client @supabase/ssr, que é PKCE por padrão):
//   `?code=...` na query, a ser trocado pela sessão com exchangeCodeForSession — o code_verifier
//   ficou num cookie do mesmo navegador quando o pedido foi feito.
// Em caso de link expirado/inválido, o erro vem no fragmento (implícito) ou na query (PKCE):
// error=...&error_description=....
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
  // Código do fluxo PKCE (`?code=`), ou null. Só é usado quando não há tokens nem erro.
  code: string | null;
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

  const hasError =
    fragment.has("error") ||
    fragment.has("error_description") ||
    query.has("error") ||
    query.has("error_description");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  const tokens =
    !hasError && accessToken && refreshToken
      ? { access_token: accessToken, refresh_token: refreshToken }
      : null;
  const code = !hasError && !tokens ? query.get("code") || null : null;

  return {
    next: requestedNext ?? DEFAULT_NEXT_BY_TYPE[type],
    errorRedirect: INVALID_REDIRECT_BY_TYPE[type],
    tokens,
    code,
  };
}
