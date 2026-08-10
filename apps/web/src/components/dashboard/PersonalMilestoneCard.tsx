"use client";

import { useState } from "react";
import { deletePersonalMilestone, updatePersonalMilestone } from "@/lib/actions/personalMilestones";
import type { PersonalMilestone } from "@/lib/milestones/milestones";
import styles from "./PersonalMilestoneCard.module.css";

interface PersonalMilestoneCardProps {
  milestone: PersonalMilestone;
  onUpdated: (milestone: PersonalMilestone) => void;
  onDeleted: (id: string) => void;
}

const UNEXPECTED_SAVE_ERROR = "Não consegui salvar seu marco agora. Tente novamente.";
const UNEXPECTED_DELETE_ERROR = "Não consegui remover seu marco agora. Tente novamente.";
const TITLE_MAX_LENGTH = 140;
const THEME_MAX_LENGTH = 40;

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function progressCaption(progress: number): string {
  if (progress === 0) {
    return "Ainda não apareceu nas suas conversas.";
  }
  return `Apareceu em ${progress} ${pluralize(progress, "conversa", "conversas")}.`;
}

// Cartão de marco pessoal (Story 4.3): mostra o título livre definido pelo usuário, o tema
// usado para casar com `user_patterns` (AC2) e o progresso já calculado pelo servidor.
// Edição e exclusão (AC3) ficam inline, sem navegação — coerente com o tamanho pequeno
// dessa lista, sem precisar do gesto de swipe usado no Histórico (Story 3.5).
export function PersonalMilestoneCard({ milestone, onUpdated, onDeleted }: PersonalMilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [theme, setTheme] = useState(milestone.theme);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setTitle(milestone.title);
    setTheme(milestone.theme);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    const trimmedTheme = theme.trim();
    if (!trimmedTitle || !trimmedTheme || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await updatePersonalMilestone(milestone.id, {
        title: trimmedTitle,
        theme: trimmedTheme,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      onUpdated({
        ...milestone,
        title: trimmedTitle,
        theme: trimmedTheme.toLowerCase(),
        progress: result.progress,
      });
      setIsEditing(false);
    } catch {
      setError(UNEXPECTED_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deletePersonalMilestone(milestone.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      onDeleted(milestone.id);
    } catch {
      setError(UNEXPECTED_DELETE_ERROR);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <li className={styles.card}>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <label className={styles.field}>
            <span>O que você quer explorar?</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Tema para acompanhar</span>
            <input
              type="text"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              maxLength={THEME_MAX_LENGTH}
              required
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={cancelEditing}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSaving}>
              {isSaving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={styles.card}>
      <div className={styles.head}>
        <p className={styles.title}>{milestone.title}</p>
        <span className={styles.themeChip}>{milestone.theme}</span>
      </div>

      <p className={styles.progress}>{progressCaption(milestone.progress)}</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {confirmingDelete ? (
        <div className={styles.confirmGroup}>
          <p className={styles.confirmText}>Remover este marco pessoal?</p>
          <div className={styles.confirmButtons}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setConfirmingDelete(false)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.confirmDelete}
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? "Removendo…" : "Remover"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} onClick={startEditing}>
            Editar
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionDanger}`}
            onClick={() => setConfirmingDelete(true)}
          >
            Remover
          </button>
        </div>
      )}
    </li>
  );
}
