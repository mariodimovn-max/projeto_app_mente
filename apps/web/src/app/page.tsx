import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_USER_HEADER } from "@/proxy";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData, type DashboardData } from "@/lib/dashboard/dashboard";
import { getWelcomeMessage } from "@/lib/dashboard/welcomeMessage";
import { getPersonalMilestones, type PersonalMilestone } from "@/lib/milestones/milestones";
import { LogoutButton } from "./LogoutButton";
import { Aura } from "@/components/aura/Aura";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PersonalMilestones } from "@/components/dashboard/PersonalMilestones";
import styles from "./page.module.css";

async function hasAuthenticatedSession() {
  // proxy.ts já valida a sessão (getUser()) em toda requisição e repassa o
  // resultado por header — evita que esta página, servida a cada visita
  // (inclusive anônima), pague uma segunda ida à rede ao Supabase Auth só
  // para decidir se mostra o header autenticado.
  const headerList = await headers();
  return headerList.get(SESSION_USER_HEADER) === "1";
}

type DashboardLoadResult =
  | { status: "no-session" }
  | { status: "error"; error: string }
  | { status: "ok"; data: DashboardData };

// O header de sessão (hasAuthenticatedSession) já foi validado pelo proxy, mas pode estar
// obsoleto num cookie vencido/inválido entre a validação e esta renderização — por isso o
// resultado é distinguido de "erro de carregamento" (status "no-session"): quem chama decide
// redirecionar para /auth em vez de mostrar um painel autenticado vazio, do jeito que
// /historico e /insights já fazem para essa mesma inconsistência.
async function loadDashboardData(): Promise<DashboardLoadResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "no-session" };
    }

    return { status: "ok", data: await getDashboardData(supabase, user.id) };
  } catch (error) {
    console.error(
      "Erro ao carregar indicadores de evolução:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return {
      status: "error",
      error: "Não consegui carregar seu retrato agora. Tente novamente em instantes.",
    };
  }
}

type MilestonesLoadResult =
  | { status: "no-session" }
  | { status: "error"; error: string }
  | { status: "ok"; data: PersonalMilestone[] };

// Carregada à parte de loadDashboardData: marcos pessoais (Story 4.3) são uma entidade
// própria (CRUD do usuário), não parte do agregado somente-leitura de user_patterns — uma
// falha aqui não deve derrubar os indicadores de evolução, nem o contrário.
async function loadPersonalMilestones(): Promise<MilestonesLoadResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "no-session" };
    }

    return { status: "ok", data: await getPersonalMilestones(supabase, user.id) };
  } catch (error) {
    console.error(
      "Erro ao carregar marcos pessoais:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return {
      status: "error",
      error: "Não consegui carregar seus marcos agora. Tente novamente em instantes.",
    };
  }
}

// Carregada à parte das duas funções acima pelo mesmo motivo da Story 4.3: a mensagem de
// boas-vindas (welcomeMessage.ts) é best-effort por dentro e nunca lança — este loader só
// existe para checar a sessão antes de chamá-la, então uma falha aqui não deve derrubar
// os indicadores de evolução nem os marcos pessoais.
async function loadWelcomeMessage(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return await getWelcomeMessage(supabase, user.id);
  } catch (error) {
    console.error(
      "Erro ao carregar a mensagem de boas-vindas:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return null;
  }
}

export default async function Home() {
  const isAuthenticated = await hasAuthenticatedSession();
  let dashboardResult: DashboardLoadResult | null = null;
  let milestonesResult: MilestonesLoadResult | null = null;
  let welcomeMessage: string | null = null;
  if (isAuthenticated) {
    [dashboardResult, milestonesResult, welcomeMessage] = await Promise.all([
      loadDashboardData(),
      loadPersonalMilestones(),
      loadWelcomeMessage(),
    ]);
  }

  if (dashboardResult?.status === "no-session") {
    redirect("/auth");
  }

  const dashboardData = dashboardResult?.status === "ok" ? dashboardResult.data : null;
  const dashboardError = dashboardResult?.status === "error" ? dashboardResult.error : null;
  const milestonesData = milestonesResult?.status === "ok" ? milestonesResult.data : null;
  const milestonesError = milestonesResult?.status === "error" ? milestonesResult.error : null;
  // Só é "primeira visita" de verdade quando nem o agregado nem o streak têm nada — uma
  // sessão em andamento (ainda sem síntese) já teria dias de streak, e não deveria ser
  // recebida com "sua primeira vez" nem com "de novo" (ela não voltou de fato ainda).
  const isFirstVisitEver = Boolean(
    dashboardData && dashboardData.sessionCount === 0 && dashboardData.streakDays === 0
  );

  return (
    <>
      {isAuthenticated && (
        <header className={styles.appHeader}>
          <div className={styles.appHeaderPresence}>
            <Aura size={26} />
            <span>seu espaço</span>
          </div>
          <div className={styles.appHeaderActions}>
            <Link className={styles.settingsLink} href="/configuracoes">
              Configurações
            </Link>
            <LogoutButton />
          </div>
        </header>
      )}
      <main className={styles.main}>
        {isAuthenticated ? (
          <section className={styles.dashboardSection}>
            <div className={styles.dashboardLayout}>
              <aside className={styles.dashboardAura}>
                <Aura size={64} className={styles.dashboardOrb} />
                <div className={styles.dashboardGreeting}>
                  <h1 className={styles.dashboardGreetingTitle}>
                    {isFirstVisitEver ? (
                      <>
                        Seu espaço
                        <br />
                        <span className={styles.titleEmphasis}>está pronto.</span>
                      </>
                    ) : (
                      <>
                        Bom te ver
                        <br />
                        <span className={styles.titleEmphasis}>de novo.</span>
                      </>
                    )}
                  </h1>
                  {!isFirstVisitEver && welcomeMessage && (
                    <p className={styles.dashboardGreetingMessage}>{welcomeMessage}</p>
                  )}
                </div>
                <p className={styles.dashboardAuraCaption}>Só você vê isto</p>
              </aside>

              <div className={styles.dashboardContent}>
                <div className={styles.dashboardHead}>
                  <p className={styles.eyebrow}>seu espaço · sua evolução</p>
                  <Link className={styles.primaryButton} href="/chat">
                    Ir para o chat
                  </Link>
                </div>

                {dashboardError ? (
                  <p className={styles.errorBanner} role="alert">
                    {dashboardError}
                  </p>
                ) : (
                  dashboardData && <DashboardStats data={dashboardData} />
                )}

                {milestonesError ? (
                  <p className={styles.errorBanner} role="alert">
                    {milestonesError}
                  </p>
                ) : (
                  milestonesData && <PersonalMilestones initialMilestones={milestonesData} />
                )}
              </div>
            </div>
          </section>
        ) : (
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
                <Link className={styles.primaryButton} href="/auth">
                  Começar a jornada
                </Link>

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
              <Aura size={230} className={styles.heroOrb} />
              <p className={styles.auraCaption}>A AURA · SUA PRESENÇA</p>
            </div>
          </section>
        )}
      </main>

      {isAuthenticated && <PrimaryNav />}
    </>
  );
}
