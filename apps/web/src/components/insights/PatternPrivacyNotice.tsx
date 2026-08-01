"use client";

import { useState } from "react";
import styles from "./PatternPrivacyNotice.module.css";

/**
 * Aviso de privacidade exibido na primeira vez que o histórico do usuário é usado para
 * detectar padrões longitudinais (Story 3.3, AC3 / FR-4) — informativo, não bloqueia nem
 * exige confirmação para a análise já feita. Some ao ser dispensado; como o servidor só
 * sinaliza `showPatternPrivacyNotice` na primeira agregação de cada usuário (Story 3.3),
 * ele não volta a aparecer em sessões futuras.
 */
export function PatternPrivacyNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className={styles.notice} role="status">
      <p className={styles.eyebrow}>Sobre seus padrões</p>
      <p className={styles.message}>
        A partir de agora, além da síntese de cada sessão, também guardamos um resumo dos temas,
        emoções e gatilhos que se repetem nas suas conversas — para te ajudar a perceber
        padrões ao longo do tempo. Isso fica só com você, protegido do mesmo jeito que o resto do
        que você escreve aqui.
      </p>
      <button type="button" className={styles.dismissButton} onClick={() => setDismissed(true)}>
        Entendi
      </button>
    </div>
  );
}
