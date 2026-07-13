"use client";

import { useState, type FormEvent } from "react";
import { setPassword } from "@/lib/actions/setPassword";
import styles from "../page.module.css";

const MIN_PASSWORD_LENGTH = 8;

export function DefinirSenhaForm() {
  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const result = await setPassword(password);
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Nova senha</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Confirmar senha</span>
        <input
          type="password"
          name="confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
      </label>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <button className={styles.primaryButton} type="submit" disabled={submitting}>
        {submitting ? "Ativando..." : "Ativar conta"}
      </button>
    </form>
  );
}
