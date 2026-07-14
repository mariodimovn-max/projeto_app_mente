import Link from "next/link";
import { EsqueciSenhaForm } from "./EsqueciSenhaForm";
import styles from "../page.module.css";

export default function EsqueciSenhaPage() {
  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="esqueci-senha-title">
        <p className={styles.eyebrow}>Recuperação de acesso</p>
        <h1 id="esqueci-senha-title" className={styles.title}>
          Esqueceu sua senha?
        </h1>
        <p className={styles.subtitle}>
          Informe o e-mail da sua conta. Se ele existir, enviaremos um link
          para você definir uma nova senha.
        </p>

        <EsqueciSenhaForm />

        <Link className={styles.secondaryLink} href="/auth">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
