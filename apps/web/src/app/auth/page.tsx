import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Aura } from "@/components/aura/Aura";
import styles from "./page.module.css";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="auth-title">
        <div className={styles.heroAuraMobile}>
          <Aura size={110} />
        </div>

        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Acesso beta</p>
          <h1 id="auth-title" className={styles.title}>
            Entre na sua
            <br />
            <span className={styles.titleEmphasis}>conta.</span>
          </h1>
          <p className={styles.subtitle}>
            O acesso é apenas por convite. Se você recebeu um e-mail de
            convite, abra o link nele para definir sua senha e ativar a
            conta.
          </p>

          {erro === "convite-invalido" && (
            <p className={styles.errorMessage} role="alert">
              Não foi possível validar seu convite. Ele pode ter expirado —
              peça um novo convite ao administrador do beta.
            </p>
          )}

          {erro === "link-invalido" && (
            <p className={styles.errorMessage} role="alert">
              Não foi possível validar seu link de redefinição de senha. Ele
              pode ter expirado — solicite um novo abaixo.
            </p>
          )}

          <LoginForm />

          <div className={styles.linksRow}>
            <Link className={styles.secondaryLink} href="/auth/esqueci-senha">
              Esqueci minha senha
            </Link>

            <Link className={styles.secondaryLink} href="/">
              Voltar ao onboarding
            </Link>
          </div>
        </div>

        <div className={styles.heroAuraDesktop}>
          <Aura size={200} />
          <p className={styles.auraCaption}>A AURA · SUA PRESENÇA</p>
        </div>
      </section>
    </main>
  );
}
