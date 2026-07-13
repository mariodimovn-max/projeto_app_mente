import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Sem proxy.ts de refresh de sessão ainda (Story 1.5) — se isto for
            // chamado a partir de um Server Component, cookies não podem ser
            // gravados e o erro é esperado. Logamos para não mascarar outras
            // falhas reais (ex.: opções de cookie inválidas).
            console.error("Falha ao gravar cookies de sessão do Supabase:", error);
          }
        },
      },
    }
  );
}
