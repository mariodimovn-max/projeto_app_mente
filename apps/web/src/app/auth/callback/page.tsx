"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveCallback } from "./resolveCallback";
import styles from "../page.module.css";

// Destino dos links de e-mail padrão do Supabase (convite e recuperação de senha). No plano
// gratuito sem SMTP próprio não é possível editar os templates para usar token_hash (ver
// /auth/confirm e ADR 0006), então o Supabase entrega a sessão no fragmento da URL. Este
// componente roda no browser porque o fragmento nunca chega ao servidor: a página lê
// #access_token/#refresh_token, entrega-os ao client do Supabase (que grava a sessão nos
// cookies) e só então a navegação segue para a página de definir/redefinir senha, que já
// valida a sessão no servidor.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { next, errorRedirect, tokens } = resolveCallback(
      window.location.search,
      window.location.hash
    );

    if (!tokens) {
      router.replace(errorRedirect);
      return;
    }

    let cancelled = false;

    async function establishSession() {
      let hasSession = false;
      try {
        // setSession() valida os tokens e grava a sessão nos cookies (storage do @supabase/ssr),
        // de onde as páginas seguintes a leem no servidor. Não dá para contar com a detecção
        // automática do fragmento: o client está em modo PKCE e descarta fragmentos implícitos.
        const { data } = await createClient().auth.setSession(tokens);
        hasSession = Boolean(data.session);
      } catch {
        hasSession = false;
      }

      if (!cancelled) {
        router.replace(hasSession ? next : errorRedirect);
      }
    }

    void establishSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="callback-title">
        <p className={styles.eyebrow}>Acesso beta</p>
        <h1 id="callback-title" className={styles.title}>
          Validando seu link…
        </h1>
        <p className={styles.subtitle} role="status">
          Só um instante — estamos confirmando seu acesso.
        </p>
      </section>
    </main>
  );
}
