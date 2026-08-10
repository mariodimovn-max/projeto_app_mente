import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import { WeeklySummaryCard } from "@/components/insights/WeeklySummaryCard";
import styles from "./page.module.css";

// Destino de navegação da Story 4.1. Resumo semanal sob demanda (Story 4.4) já mora aqui;
// resumo mensal (Story 4.5) e detecção de padrões (FR4) continuam pendentes.
export default async function InsightsPage() {
  const headerList = await headers();
  const isAuthenticated = headerList.get(SESSION_USER_HEADER) === "1";

  if (!isAuthenticated) {
    redirect("/auth");
  }

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Insights</h1>
          <p className={styles.subtitle}>Gere um resumo da sua semana sempre que quiser.</p>
        </header>
        <WeeklySummaryCard />
      </main>
      <PrimaryNav />
    </>
  );
}
