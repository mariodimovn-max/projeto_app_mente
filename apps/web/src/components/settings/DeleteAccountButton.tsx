"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { deleteAccount } from "@/lib/actions/deleteAccount";
import styles from "./DeleteAccountButton.module.css";

const UNEXPECTED_ERROR = "Não foi possível excluir sua conta agora. Tente novamente em instantes.";

// Story 5.2: mesmo padrão de confirmação acessível do LogoutButton (role="alertdialog",
// focus trap, fecha com Escape), mas mantido como card separado do ExportDataButton — a ação é
// destrutiva e irreversível (AC4), então o texto do diálogo reforça isso explicitamente em vez
// de reaproveitar a linguagem neutra usada para logout/exportação. Em caso de sucesso, a própria
// Server Action redireciona (mesmo padrão de logout.ts), então não há estado de "sucesso" aqui.
export function DeleteAccountButton() {
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
    if (submitting) {
      return;
    }
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

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleConfirm() {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError(UNEXPECTED_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section} aria-label="Excluir minha conta">
      <div className={styles.card}>
        <p className={styles.heading}>Excluir minha conta</p>
        <p className={styles.description}>
          Remove permanentemente suas sessões, mensagens, sínteses e padrões identificados, além
          da sua conta de acesso. Essa ação não pode ser desfeita.
        </p>

        {error && !confirming && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="button" className={styles.deleteButton} onClick={openConfirmation}>
          Excluir minha conta
        </button>
      </div>

      {confirming && (
        <div className={styles.overlay} onKeyDown={handleDialogKeyDown}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-description"
          >
            <p id="delete-account-dialog-title" className={styles.dialogTitle}>
              Excluir sua conta permanentemente?
            </p>
            <p id="delete-account-dialog-description" className={styles.dialogText}>
              Todos os seus dados — sessões, mensagens, sínteses e padrões identificados — serão
              destruídos e não poderão ser recuperados. Sua conta de acesso também será removida.
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
                onClick={() => void handleConfirm()}
                disabled={submitting}
              >
                {submitting ? "Excluindo…" : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
