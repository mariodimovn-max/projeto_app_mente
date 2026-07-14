"use server";

import { createClient } from "@/lib/supabase/server";

const RATE_LIMITED_MESSAGE =
  "Muitas solicitações de redefinição de senha. Aguarde alguns minutos antes de tentar novamente.";

export async function requestPasswordReset(email: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error?.status === 429) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  // Nunca revela se o e-mail existe: mesmo retorno de sucesso independentemente
  // de o Supabase encontrar ou não uma conta com esse endereço.
}
