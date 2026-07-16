"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGE = "Não foi possível encerrar sua sessão agora. Tente novamente.";

export async function logout(): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: ERROR_MESSAGE };
  }

  redirect("/");
}
