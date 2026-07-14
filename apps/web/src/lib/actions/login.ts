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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Nunca revela se o e-mail existe ou não — mesma mensagem genérica para
    // credenciais inválidas, independentemente da causa real.
    return { error: error.status === 429 ? RATE_LIMITED_MESSAGE : INVALID_CREDENTIALS_MESSAGE };
  }

  redirect("/");
}
