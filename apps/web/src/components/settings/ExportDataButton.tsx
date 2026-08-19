"use client";

import { useState } from "react";
import { exportUserData } from "@/lib/actions/exportData";
import { downloadJsonFile } from "@/lib/export/downloadJson";
import styles from "./ExportDataButton.module.css";

const UNEXPECTED_ERROR = "Não consegui exportar seus dados agora. Tente novamente.";
const APP_TIMEZONE = "America/Sao_Paulo";

function formatFilenameDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

// Story 5.1: chama a Server Action exportUserData (AC1/AC3) e dispara o download do JSON
// retornado assim que a resposta chega (AC2) — sem estado intermediário de "arquivo pronto",
// o download acontece na mesma interação.
export function ExportDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleExport() {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setDone(false);

    try {
      const result = await exportUserData();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      downloadJsonFile(result.data, `meus-dados-${formatFilenameDate(result.data.exportedAt)}.json`);
      setDone(true);
    } catch {
      setError(UNEXPECTED_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.section} aria-label="Exportar meus dados">
      <div className={styles.card}>
        <p className={styles.heading}>Exportar meus dados</p>
        <p className={styles.description}>
          Baixe uma cópia completa das suas sessões, mensagens, sínteses e padrões identificados, em
          formato JSON.
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {done && !error && (
          <p className={styles.success} role="status">
            Download iniciado.
          </p>
        )}

        <button
          type="button"
          className={styles.exportButton}
          onClick={() => void handleExport()}
          disabled={isLoading}
        >
          {isLoading ? "Exportando…" : "Exportar meus dados"}
        </button>
      </div>
    </section>
  );
}
