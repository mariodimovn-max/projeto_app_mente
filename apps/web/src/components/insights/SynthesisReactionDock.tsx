"use client";

import { useState } from "react";
import { deleteSynthesisReaction, saveSynthesisReaction } from "@/lib/actions/synthesisReaction";
import {
  SYNTHESIS_REACTION_COMMENT_MAX_LENGTH,
  SYNTHESIS_REACTION_EMOJIS,
  type SynthesisReactionEmoji,
} from "@/lib/synthesis/reactions";
import styles from "./SynthesisReactionDock.module.css";

interface SynthesisReactionDockProps {
  synthesisId: string;
}

const UNEXPECTED_SAVE_ERROR = "Não consegui salvar sua reação agora. Tente novamente.";
const UNEXPECTED_UNDO_ERROR = "Não consegui desfazer sua reação agora. Tente novamente.";

/**
 * Reação leve à síntese (Story 3.2), seguindo o layout do arquivo de design
 * "Aura - Reação": emoji ou comentário curto, nunca obrigatório (AC2). Emoji e comentário
 * são mutuamente exclusivos — cada ação salva (upsert) a reação da síntese, substituindo
 * a anterior; "desfazer" apaga a reação salva.
 */
export function SynthesisReactionDock({ synthesisId }: SynthesisReactionDockProps) {
  const [picked, setPicked] = useState<SynthesisReactionEmoji | null>(null);
  const [comment, setComment] = useState("");
  const [focused, setFocused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function handlePickEmoji(key: SynthesisReactionEmoji, label: string) {
    if (isSaving || picked === key) {
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveSynthesisReaction(synthesisId, { emoji: key });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setPicked(key);
      setSaved(true);
      setSavedLabel(`${label} · salvo com a síntese`);
    } catch {
      // A Server Action já trata seus próprios erros e retorna { error }; isto só é
      // alcançado se a chamada em si rejeitar (ex.: rede caindo) — sem isto, os botões
      // ficariam desabilitados para sempre em `isSaving`, sem chance de tentar de novo.
      setError(UNEXPECTED_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveComment() {
    const trimmed = comment.trim();
    if (!trimmed || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveSynthesisReaction(synthesisId, { comment: trimmed });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setPicked(null);
      setSaved(true);
      setSavedLabel("Comentário salvo com a síntese");
    } catch {
      setError(UNEXPECTED_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUndo() {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await deleteSynthesisReaction(synthesisId);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setPicked(null);
      setComment("");
      setSaved(false);
    } catch {
      setError(UNEXPECTED_UNDO_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  // AC2: sair sem reagir não é bloqueado nem exige nada — só esconde o convite
  // localmente, sem persistir nada.
  if (dismissed) {
    return (
      <p className={styles.dismissedNote} role="status">
        Tudo bem. A síntese continua salva por aqui.
      </p>
    );
  }

  const remaining = SYNTHESIS_REACTION_COMMENT_MAX_LENGTH - comment.length;
  const canSend = comment.trim().length > 0 && !isSaving;

  return (
    <div className={styles.dock}>
      <div className={styles.header}>
        <p className={styles.prompt}>Como isso ressoou em você?</p>
        <span className={styles.statusText}>
          {saved ? "reação vinculada" : "opcional · sem pressa"}
        </span>
      </div>

      <div className={styles.row}>
        <div className={styles.emojiRow} role="group" aria-label="Reagir com emoji">
          {SYNTHESIS_REACTION_EMOJIS.map(({ key, glyph, label, caption }) => (
            <button
              key={key}
              type="button"
              className={
                picked === key
                  ? `${styles.emojiButton} ${styles.emojiButtonActive}`
                  : styles.emojiButton
              }
              aria-pressed={picked === key}
              aria-label={label}
              title={label}
              disabled={isSaving}
              onClick={() => void handlePickEmoji(key, label)}
            >
              <span aria-hidden="true">{glyph}</span>
              <span className={styles.emojiCaption} aria-hidden="true">
                {caption}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <form
          className={focused ? `${styles.inputWrap} ${styles.inputWrapFocused}` : styles.inputWrap}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveComment();
          }}
        >
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={SYNTHESIS_REACTION_COMMENT_MAX_LENGTH}
            placeholder="ou deixe uma palavra…"
            className={styles.input}
            aria-label="Deixe um comentário curto sobre a síntese"
          />
          <span className={styles.counter}>{remaining}</span>
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!canSend}
            aria-label="Salvar comentário"
          >
            →
          </button>
        </form>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.footer}>
        {saved && (
          <div className={styles.savedPill} role="status">
            <span aria-hidden="true">✓</span>
            <span>{savedLabel}</span>
            <button
              type="button"
              className={styles.undoButton}
              disabled={isSaving}
              onClick={() => void handleUndo()}
            >
              desfazer
            </button>
          </div>
        )}
        <div className={styles.footerSpacer} />
        {!saved && (
          <button type="button" className={styles.skipButton} onClick={() => setDismissed(true)}>
            Sair sem reagir →
          </button>
        )}
      </div>
    </div>
  );
}
