"use client";

import { useState, type FormEvent } from "react";
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH, messageContentSchema } from "@/lib/validation/message";
import styles from "./ChatComposer.module.css";

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Sua mensagem</span>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="O que está vivo em você agora?"
          rows={3}
          disabled={disabled}
        />
      </label>

      <div className={styles.footer}>
        <span className={styles.counter} aria-live="polite">
          Mínimo {MIN_MESSAGE_LENGTH} — {text.trim().length}/{MAX_MESSAGE_LENGTH}
        </span>
        <button className={styles.sendButton} type="submit" disabled={disabled}>
          Enviar
        </button>
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
