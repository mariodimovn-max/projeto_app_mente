"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMITED_MESSAGE =
  "Muitas solicitações de redefinição de senha. Aguarde alguns minutos antes de tentar novamente.";

// O link do e-mail padrão do Supabase ({{ .ConfirmationURL }}) redireciona, após validar o
// token, para esta URL com a sessão no fragmento — /auth/callback a captura e segue para
// /auth/redefinir-senha (ver ADR 0006). Sem redirectTo, o Supabase mandaria para o Site URL
// raiz e a sessão de recuperação se perderia. O origin precisa constar em
// additional_redirect_urls (supabase/config.toml).
async function recoveryRedirectUrl(): Promise<string | undefined> {
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    (headerList.get("host")
      ? `${headerList.get("x-forwarded-proto") ?? "http"}://${headerList.get("host")}`
      : null);

  return origin ? `${origin}/auth/callback?next=/auth/redefinir-senha` : undefined;
}

export async function requestPasswordReset(email: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const redirectTo = await recoveryRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : {}
  );

  if (error?.status === 429) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  // Nunca revela se o e-mail existe: mesmo retorno de sucesso independentemente
  // de o Supabase encontrar ou não uma conta com esse endereço.
}
