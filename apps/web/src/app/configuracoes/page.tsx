import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { PrimaryNav } from "@/components/nav/PrimaryNav";
import { ExportDataButton } from "@/components/settings/ExportDataButton";
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton";
import styles from "./page.module.css";

// Story 5.1: primeira tela de "configurações da conta" do produto (ainda não existia — ver
// nota da Story 1.7). Story 5.2 adicionou a exclusão de conta; qualquer preferência futura
// deve entrar aqui também, no mesmo lugar.
export default async function ConfiguracoesPage() {
  const headerList = await headers();
  const isAuthenticated = headerList.get(SESSION_USER_HEADER) === "1";

  if (!isAuthenticated) {
    redirect("/auth");
  }

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>Gerencie seus dados e sua conta.</p>
        </header>
        <ExportDataButton />
        <DeleteAccountButton />
      </main>
      <PrimaryNav />
    </>
  );
}
