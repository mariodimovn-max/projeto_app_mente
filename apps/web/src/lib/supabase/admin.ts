import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client com a service_role key — só para operações administrativas do Supabase Auth
// (ex.: excluir a conta de um usuário, Story 5.2) que a anon key/RLS não permitem.
// Nunca deve ser importado por código que roda no browser. Requer a variável de ambiente
// SUPABASE_SERVICE_ROLE_KEY (sem prefixo NEXT_PUBLIC_) configurada manualmente — não existia
// no projeto antes desta história.
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient não pode ser chamado no browser.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client não configurado: defina SUPABASE_SERVICE_ROLE_KEY (e NEXT_PUBLIC_SUPABASE_URL)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
