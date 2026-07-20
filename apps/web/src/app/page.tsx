import Link from "next/link";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { LogoutButton } from "./LogoutButton";
import { Aura } from "@/components/aura/Aura";
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
          <div className={styles.appHeaderPresence}>
            <Aura size={26} />
            <span>seu espaço</span>
          </div>
          <LogoutButton />
        </header>
      )}
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="onboarding-title">
          <div className={styles.heroAuraMobile}>
            <Aura size={158} />
          </div>

          <div className={styles.heroText}>
            <p className={styles.eyebrow}>seu espaço</p>
            <h1 id="onboarding-title" className={styles.title}>
              Conheça você
              <br />
              <span className={styles.titleEmphasis}>melhor.</span>
            </h1>
            <p className={styles.subtitle}>
              Um espaço para conversar consigo mesmo e enxergar seus próprios
              padrões. Cada conversa é um mergulho — quanto mais fundo você
              desce, mais você se conhece.
            </p>

            <div className={styles.ctaRow}>
              {isAuthenticated ? (
                <Link className={styles.primaryButton} href="/chat">
                  Ir para o chat
                </Link>
              ) : (
                <Link className={styles.primaryButton} href="/auth">
                  Começar a jornada
                </Link>
              )}

              <details className={styles.details}>
                <summary className={styles.ghostButton}>Como usamos seus dados</summary>
                <p className={styles.detailText}>
                  Usamos o conteúdo que você compartilha para melhorar a experiência
                  do app, oferecer insights mais úteis e preservar seu histórico em
                  uma sessão segura. Não compartilhamos suas informações com terceiros
                  para fins comerciais.
                </p>
              </details>
            </div>

            <p className={styles.privacyLine}>
              <span className={styles.privacyDot} aria-hidden="true" />
              Privado e criptografado · não é terapia profissional
            </p>
          </div>

          <div className={styles.heroAuraDesktop}>
            <Aura size={230} />
            <p className={styles.auraCaption}>A AURA · SUA PRESENÇA</p>
          </div>
        </section>

        <section className={`${styles.content} container`}>
          <div className={styles.steps} aria-label="pilares do onboarding">
            {pillars.map((pillar) => (
              <article key={pillar.title} className={styles.step}>
                <p className={styles.stepTitle}>{pillar.title}</p>
                <p className={styles.stepDescription}>{pillar.description}</p>
              </article>
            ))}
          </div>

          <p className={styles.notice}>
            Se estiver em risco imediato, ligue para os serviços de emergência
            locais.
          </p>
        </section>
      </main>
    </>
  );
}
