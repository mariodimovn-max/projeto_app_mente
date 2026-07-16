"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { logout } from "@/lib/actions/logout";
import styles from "./LogoutButton.module.css";

export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) {
      cancelButtonRef.current?.focus();
    }
  }, [confirming]);

  function openConfirmation() {
    setError(null);
    setConfirming(true);
  }

  function cancelConfirmation() {
    setConfirming(false);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      cancelConfirmation();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const first = cancelButtonRef.current;
    const last = confirmButtonRef.current;
    if (!first || !last) {
      return;
    }

    // Mantém o foco dentro do diálogo (WCAG 2.1 AA): sem isso, Tab/Shift+Tab
    // escapariam para o conteúdo da página por trás do overlay, que
    // continua tecnicamente alcançável por teclado.
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    const result = await logout();
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={styles.trigger} onClick={openConfirmation}>
        Sair
      </button>
    );
  }

  return (
    <div className={styles.overlay} onKeyDown={handleDialogKeyDown}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <p id="logout-dialog-title" className={styles.dialogTitle}>
          Encerrar sessão?
        </p>
        <p id="logout-dialog-description" className={styles.dialogText}>
          Você precisará entrar novamente para acessar suas conversas.
        </p>

        {error && (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}

        <div className={styles.dialogActions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            onClick={cancelConfirmation}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Saindo…" : "Sair"}
          </button>
        </div>
      </div>
    </div>
  );
}
