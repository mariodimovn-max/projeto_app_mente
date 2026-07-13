import Link from "next/link";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>Acesso beta</p>
        <h1 id="auth-title" className={styles.title}>
          Entre com sua conta
        </h1>
        <p className={styles.subtitle}>
          O acesso é apenas por convite. Se você recebeu um e-mail de convite,
          abra o link nele para definir sua senha e ativar a conta.
        </p>

        {erro === "convite-invalido" && (
          <p className={styles.errorMessage} role="alert">
            Não foi possível validar seu convite. Ele pode ter expirado — peça
            um novo convite ao administrador do beta.
          </p>
        )}

        <LoginForm />

        <Link className={styles.secondaryLink} href="/">
          Voltar ao onboarding
        </Link>
      </section>
    </main>
  );
}
