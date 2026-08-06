import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import styles from "./page.module.css";

// Destino de navegação da Story 4.1. O conteúdo do dashboard (indicadores de
// evolução, resumos sob demanda) é escopo das Stories 4.2/4.4/4.5 — aqui só a
// tela em si, alcançável pela PrimaryNav.
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
          <p className={styles.subtitle}>
            Em breve: seus padrões e resumos vão aparecer aqui.
          </p>
        </header>
      </main>
      <PrimaryNav />
    </>
  );
}
