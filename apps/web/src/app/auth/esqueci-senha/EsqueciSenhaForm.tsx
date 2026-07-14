"use client";

import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "@/lib/actions/requestPasswordReset";
import styles from "../page.module.css";

const SUCCESS_MESSAGE =
  "Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.";

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className={styles.subtitle} role="status">
        {SUCCESS_MESSAGE}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>E-mail</span>
        <input
          type="email"
          name="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <button className={styles.primaryButton} type="submit" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
