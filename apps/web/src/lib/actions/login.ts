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
  // usuário de entrar, só fica registrada no log do servidor. Envolto em try/catch (achado da
  // revisão de código): sem isso, uma exceção lançada pelo insert (em vez de resolver com
  // { error }) escapava sem tratamento e bloqueava o login inteiro, o oposto do que o
  // best-effort promete.
  try {
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
    } else {
      // Não deveria acontecer para login por email/senha sem MFA (se não há erro, o Supabase
      // sempre retorna um user) — registrado para não passar em branco caso essa premissa mude.
      console.error("Login sem erro retornou sem usuário; auditoria não registrada.");
    }
  } catch (auditException) {
    console.error(
      "Erro inesperado ao registrar auditoria de login:",
      auditException instanceof Error
        ? { message: auditException.message, stack: auditException.stack }
        : auditException
    );
  }

  redirect("/");
}
