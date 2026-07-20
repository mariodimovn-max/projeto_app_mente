"use client";

import { useState, type FormEvent } from "react";
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH, messageContentSchema } from "@/lib/validation/message";
import styles from "./ChatComposer.module.css";

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

type ComposerMode = "texto" | "voz";

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [mode, setMode] = useState<ComposerMode>("texto");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = messageContentSchema.safeParse(text);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Mensagem inválida.");
      return;
    }

    setError(null);
    onSend(result.data);
    setText("");
  }

  return (
    <div className={styles.dock}>
      <div className={styles.segmented} role="group" aria-label="Formato da mensagem">
        <button
          type="button"
          className={mode === "texto" ? `${styles.segButton} ${styles.segButtonActive}` : styles.segButton}
          aria-pressed={mode === "texto"}
          onClick={() => setMode("texto")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7V5h16v2M9 19h6M12 5v14" />
          </svg>
          Escrever
        </button>
        <button
          type="button"
          className={mode === "voz" ? `${styles.segButton} ${styles.segButtonActive}` : styles.segButton}
          aria-pressed={mode === "voz"}
          onClick={() => setMode("voz")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" stroke="none" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          Falar
        </button>
      </div>

      {mode === "texto" ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.bar}>
            <label className="sr-only" htmlFor="chat-message">
              Sua mensagem
            </label>
            <textarea
              id="chat-message"
              className={styles.textarea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="escreva o que veio agora…"
              rows={1}
              disabled={disabled}
            />
            <button className={styles.sendButton} type="submit" disabled={disabled} aria-label="Enviar mensagem">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5M6 11l6-6 6 6"
                  stroke="var(--color-voice-icon, #06201e)"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.footer}>
            <span className={styles.counter} aria-live="polite">
              Mínimo {MIN_MESSAGE_LENGTH} — {text.trim().length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>

          {error && (
            <p className={styles.errorMessage} role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className={styles.voiceDock}>
          <button
            type="button"
            className={styles.micButton}
            disabled
            aria-disabled="true"
            title="Gravação por voz chega em breve"
          >
            <span className={styles.micIcon} aria-hidden="true" />
          </button>
          <div className={styles.waveform} aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className={styles.waveBar} />
            ))}
          </div>
          <p className={styles.voiceHint}>
            Em breve: fale e a aura ouve. Por enquanto, use &quot;Escrever&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
