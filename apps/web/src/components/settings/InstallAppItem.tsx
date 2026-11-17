"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getInstallPromptState,
  promptInstall,
  subscribeInstallPrompt,
} from "@/lib/pwa/installPrompt";
import styles from "./InstallAppItem.module.css";

// Story 6.2: convite discreto de instalação — só existe aqui em Configurações, e só aparece quando
// o navegador realmente oferece a instalação (nunca um botão morto). O servidor renderiza
// "unavailable" para não haver divergência de hidratação.
export function InstallAppItem() {
  const state = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptState,
    () => "unavailable" as const
  );
  const [isPrompting, setIsPrompting] = useState(false);

  if (state !== "available") {
    return null;
  }

  async function handleInstall() {
    setIsPrompting(true);
    try {
      await promptInstall();
    } finally {
      setIsPrompting(false);
    }
  }

  return (
    <section className={styles.section} aria-label="Instalar o Diário">
      <div className={styles.card}>
        <p className={styles.heading}>Instalar o Diário na tela inicial</p>
        <p className={styles.description}>
          Abra o Diário direto da tela inicial do celular, em tela cheia, como um app.
        </p>
        <button
          type="button"
          className={styles.installButton}
          onClick={handleInstall}
          disabled={isPrompting}
        >
          Instalar
        </button>
      </div>
    </section>
  );
}
