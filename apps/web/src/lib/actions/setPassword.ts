"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setPassword(password: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível ativar sua conta agora. Tente novamente." };
  }

  redirect("/");
}
