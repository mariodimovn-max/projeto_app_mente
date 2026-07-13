"use client";

import styles from "./page.module.css";

export function LoginForm() {
  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <label className={styles.field}>
        <span>E-mail</span>
        <input
          type="email"
          name="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.field}>
        <span>Senha</span>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </label>

      <p className={styles.subtitle}>Login ainda não está disponível nesta versão.</p>

      <button className={styles.primaryButton} type="submit" disabled>
        Entrar
      </button>
    </form>
  );
}
