"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./TranscriptBlock.module.css";

interface TranscriptBlockProps {
  transcript: string;
  disabled: boolean;
  onSave: (finalText: string) => void;
  onDiscard: () => void;
}

export function TranscriptBlock({ transcript, disabled, onSave, onDiscard }: TranscriptBlockProps) {
  const [value, setValue] = useState(transcript);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className={styles.block}>
      <p className={styles.status} role="status">
        Transcrição pronta — revise se quiser
      </p>

      <label className="sr-only" htmlFor="transcript-review">
        Transcrição da sua mensagem
      </label>
      <textarea
        ref={textareaRef}
        id="transcript-review"
        className={styles.textarea}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        aria-describedby="transcript-review-hint"
      />

      <div className={styles.footer}>
        <p id="transcript-review-hint" className={styles.hint}>
          Toque qualquer palavra para corrigir.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.discardButton} onClick={onDiscard} disabled={disabled}>
            Descartar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => onSave(value)}
            disabled={disabled || value.trim().length === 0}
          >
            Salvar transcrição
          </button>
        </div>
      </div>
    </div>
  );
}
