"use client";

import { useState } from "react";
import { createPersonalMilestone } from "@/lib/actions/personalMilestones";
import type { PersonalMilestone } from "@/lib/milestones/milestones";
import { PersonalMilestoneCard } from "./PersonalMilestoneCard";
import styles from "./PersonalMilestones.module.css";

interface PersonalMilestonesProps {
  initialMilestones: PersonalMilestone[];
}

const UNEXPECTED_SAVE_ERROR = "Não consegui salvar seu marco agora. Tente novamente.";
const TITLE_MAX_LENGTH = 140;
const THEME_MAX_LENGTH = 40;

// Marcos pessoais (Story 4.3, FR-7): foco de exploração definido pelo próprio usuário
// (AC1), com progresso derivado de `user_patterns` pelo servidor (AC2) e edição/remoção
// inline (AC3). Sem gamification — nenhuma barra de "meta atingida", só a contagem crua de
// quantas conversas já tocaram o tema, na mesma linguagem serena do resto do dashboard.
export function PersonalMilestones({ initialMilestones }: PersonalMilestonesProps) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdding() {
    setTitle("");
    setTheme("");
    setError(null);
    setIsAdding(true);
  }

  function cancelAdding() {
    setIsAdding(false);
    setError(null);
  }

  async function handleCreate() {
    const trimmedTitle = title.trim();
    const trimmedTheme = theme.trim();
    if (!trimmedTitle || !trimmedTheme || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await createPersonalMilestone({ title: trimmedTitle, theme: trimmedTheme });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const created: PersonalMilestone = {
        id: result.id,
        title: trimmedTitle,
        theme: trimmedTheme.toLowerCase(),
        progress: result.progress,
        createdAt: new Date().toISOString(),
      };
      setMilestones((current) => [created, ...current]);
      setIsAdding(false);
    } catch {
      setError(UNEXPECTED_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  function handleUpdated(updated: PersonalMilestone) {
    setMilestones((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleDeleted(id: string) {
    setMilestones((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className={styles.section} aria-label="Seus marcos pessoais">
      <div className={styles.head}>
        <p className={styles.heading}>Marcos pessoais</p>
        {!isAdding && (
          <button type="button" className={styles.addButton} onClick={startAdding}>
            + Novo marco
          </button>
        )}
      </div>

      {milestones.length === 0 && !isAdding && (
        <p className={styles.emptyText}>
          Defina um foco de exploração e acompanhe quantas vezes ele aparece nas suas
          conversas.
        </p>
      )}

      {isAdding && (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <label className={styles.field}>
            <span>O que você quer explorar?</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Quero entender meu relacionamento com dinheiro"
              maxLength={TITLE_MAX_LENGTH}
              autoFocus
              required
            />
          </label>
          <label className={styles.field}>
            <span>Tema para acompanhar</span>
            <input
              type="text"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="Ex.: dinheiro"
              maxLength={THEME_MAX_LENGTH}
              required
            />
            <p className={styles.hint}>
              Usamos essa palavra para contar quantas vezes o assunto aparece no seu histórico.
            </p>
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={cancelAdding}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSaving}>
              {isSaving ? "Salvando…" : "Salvar marco"}
            </button>
          </div>
        </form>
      )}

      {milestones.length > 0 && (
        <ul className={styles.list}>
          {milestones.map((milestone) => (
            <PersonalMilestoneCard
              key={milestone.id}
              milestone={milestone}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
