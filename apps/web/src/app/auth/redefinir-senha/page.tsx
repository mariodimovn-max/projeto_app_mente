import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RedefinirSenhaForm } from "./RedefinirSenhaForm";
import styles from "../page.module.css";

function isRecoverySession(amr: unknown): boolean {
  if (!Array.isArray(amr)) {
    return false;
  }
  return amr.some((entry) => (typeof entry === "string" ? entry : entry?.method) === "recovery");
}

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Uma sessão comum de login (ex.: usuário já autenticado navegando direto
  // para esta URL) não deve poder trocar a senha sem passar pelo link de
  // recuperação por e-mail — só a presença do método "recovery" no `amr` da
  // sessão prova que ela veio de um `verifyOtp({ type: "recovery" })` recém-
  // concluído em /auth/confirm.
  if (!data || !isRecoverySession(data.claims.amr)) {
    redirect("/auth?erro=link-invalido");
  }

  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="redefinir-senha-title">
        <p className={styles.eyebrow}>Recuperação de acesso</p>
        <h1 id="redefinir-senha-title" className={styles.title}>
          Redefina sua senha
        </h1>
        <p className={styles.subtitle}>
          Escolha uma nova senha para acessar sua conta ({data.claims.email}).
        </p>

        <RedefinirSenhaForm />
      </section>
    </main>
  );
}
