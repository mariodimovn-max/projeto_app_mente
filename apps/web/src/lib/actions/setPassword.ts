"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_ERROR_MESSAGE = "Não foi possível ativar sua conta agora. Tente novamente.";

export async function setPassword(
  password: string,
  errorMessage: string = DEFAULT_ERROR_MESSAGE
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: errorMessage };
  }

  redirect("/");
}
