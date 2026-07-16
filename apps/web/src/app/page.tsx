import Link from "next/link";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { LogoutButton } from "./LogoutButton";
import styles from "./page.module.css";

const pillars = [
  {
    title: "Propósito",
    description: "Explorar pensamentos e emoções com calma e honestidade.",
  },
  {
    title: "Privacidade",
    description: "Seus registros são tratados com cuidado e você decide como quer usar o app.",
  },
  {
    title: "Começar",
    description: "Uma sessão guiada para entrar em contato com o que está vivo em você.",
  },
];

async function hasAuthenticatedSession() {
  // proxy.ts já valida a sessão (getUser()) em toda requisição e repassa o
  // resultado por header — evita que esta página, servida a cada visita
  // (inclusive anônima), pague uma segunda ida à rede ao Supabase Auth só
  // para decidir se mostra o header autenticado.
  const headerList = await headers();
  return headerList.get(SESSION_USER_HEADER) === "1";
}

export default async function Home() {
  const isAuthenticated = await hasAuthenticatedSession();

  return (
    <>
      {isAuthenticated && (
        <header className={styles.appHeader}>
          <LogoutButton />
        </header>
      )}
      <main className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="onboarding-title">
          <p className={styles.eyebrow}>Onboarding</p>
          <h1 id="onboarding-title" className={styles.title}>
            Converse. Reflect. Notice.
          </h1>
          <p className={styles.subtitle}>
            Este app foi pensado como um espelho reflexivo para ajudar você a
            perceber padrões e se acolher com mais clareza. Não é terapia
            profissional, mas pode ser um espaço de escuta honesta.
          </p>

          <div className={styles.steps} aria-label="pilares do onboarding">
            {pillars.map((pillar) => (
              <article key={pillar.title} className={styles.step}>
                <p className={styles.stepTitle}>{pillar.title}</p>
                <p className={styles.stepDescription}>{pillar.description}</p>
              </article>
            ))}
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Privacidade</h2>
            <p className={styles.panelText}>
              Transcrições e notas são tratadas com cuidado e você pode acessar
              explicações simples sobre como elas são usadas antes de avançar.
            </p>

            <details className={styles.details}>
              <summary className={styles.summary}>Como usamos seus dados</summary>
              <p className={styles.detailText}>
                Usamos o conteúdo que você compartilha para melhorar a experiência
                do app, oferecer insights mais úteis e preservar seu histórico em
                uma sessão segura. Não compartilhamos suas informações com terceiros
                para fins comerciais.
              </p>
            </details>
          </div>

          <div className={styles.actions}>
            {isAuthenticated ? (
              <Link className={styles.primaryButton} href="/chat">
                Ir para o chat
              </Link>
            ) : (
              <Link className={styles.primaryButton} href="/auth">
                Começar sessão
              </Link>
            )}
            <p className={styles.notice}>
              Se estiver em risco imediato, ligue para os serviços de emergência
              locais.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
