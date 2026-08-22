"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMITED_MESSAGE =
  "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
const INVALID_CREDENTIALS_MESSAGE =
  "E-mail ou senha incorretos. Verifique os dados e tente novamente.";

export async function login(
  email: string,
  password: string
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Nunca revela se o e-mail existe ou não — mesma mensagem genérica para
    // credenciais inválidas, independentemente da causa real.
    return { error: error.status === 429 ? RATE_LIMITED_MESSAGE : INVALID_CREDENTIALS_MESSAGE };
  }

  // Story 5.3 (AC1): best-effort, mesmo padrão de exportData.ts — o login já foi bem-sucedido
  // no Supabase Auth, então uma falha ao gravar a trilha de auditoria não deve impedir o
  // usuário de entrar, só fica registrada no log do servidor.
  if (data.user) {
    const { error: auditError } = await supabase.from("audit_log").insert({
      user_id: data.user.id,
      action: "login",
    });

    if (auditError) {
      console.error("Erro ao registrar auditoria de login:", {
        message: auditError.message,
        code: auditError.code,
        details: auditError.details,
        hint: auditError.hint,
      });
    }
  }

  redirect("/");
}
