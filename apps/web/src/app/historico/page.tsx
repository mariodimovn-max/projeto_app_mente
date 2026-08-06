import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { createClient } from "@/lib/supabase/server";
import { listSessionHistory } from "@/lib/history/sessions";
import { HistoryList } from "@/components/history/HistoryList";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import type { HistorySessionSummary } from "@/types/history";
import styles from "./page.module.css";

export default async function HistoryPage() {
  const headerList = await headers();
  const isAuthenticated = headerList.get(SESSION_USER_HEADER) === "1";

  if (!isAuthenticated) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  let sessions: HistorySessionSummary[] = [];
  let loadError: string | null = null;
  try {
    sessions = await listSessionHistory(supabase, user.id);
  } catch (error) {
    console.error(
      "Erro ao carregar histórico de sessões:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    loadError = "Não consegui carregar seu histórico agora. Tente novamente em instantes.";
  }

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Histórico</h1>
          <p className={styles.subtitle}>Suas conversas anteriores, do jeito que você deixou.</p>
        </header>

        {loadError ? (
          <p className={styles.errorBanner} role="alert">
            {loadError}
          </p>
        ) : (
          <HistoryList initialSessions={sessions} />
        )}
      </main>
      <PrimaryNav />
    </>
  );
}
