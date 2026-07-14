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
            // Server Components não podem gravar cookies (a renovação de sessão
            // acontece em proxy.ts) — o erro é esperado nesse caso. Logamos para
            // não mascarar outras falhas reais (ex.: opções de cookie inválidas).
            console.error("Falha ao gravar cookies de sessão do Supabase:", error);
          }
        },
      },
    }
  );
}
