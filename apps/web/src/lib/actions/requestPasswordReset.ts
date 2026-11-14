"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMITED_MESSAGE =
  "Muitas solicitações de redefinição de senha. Aguarde alguns minutos antes de tentar novamente.";

const SEND_FAILED_MESSAGE =
  "Não conseguimos enviar o e-mail de redefinição agora. Tente de novo em alguns minutos; se continuar, fale com quem te convidou para o beta.";

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

interface ResetError {
  status?: number | undefined;
  code?: string | undefined;
  message?: string | undefined;
}

// Erros que só acontecem porque a conta não existe: responder com o mesmo sucesso genérico de
// sempre, para a tela nunca revelar quais e-mails têm conta.
function isAccountNotFound(error: ResetError): boolean {
  return error.code === "user_not_found" || /user not found/i.test(error.message ?? "");
}

function isRateLimited(error: ResetError): boolean {
  return error.status === 429 || error.code === "over_email_send_rate_limit";
}

export async function requestPasswordReset(email: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const redirectTo = await recoveryRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : {}
  );

  if (!error) {
    return undefined;
  }

  // Só código e status vão para o log — nunca o e-mail nem a mensagem do Supabase, que pode
  // conter o endereço (ex.: email_address_not_authorized no provedor de e-mail padrão).
  console.error("[requestPasswordReset] falha ao solicitar o e-mail de redefinição", {
    status: error.status,
    code: (error as ResetError).code,
  });

  if (isRateLimited(error as ResetError)) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  if (isAccountNotFound(error as ResetError)) {
    return undefined;
  }

  // Qualquer outra falha (ex.: provedor de e-mail padrão recusando o endereço, erro interno do
  // Supabase) não pode virar um "enviamos o link" — o usuário ficaria esperando um e-mail que
  // nunca sai. A mensagem é a mesma para qualquer conta, então não revela se o e-mail existe.
  return { error: SEND_FAILED_MESSAGE };
}
