import Link from "next/link";
import styles from "./PrivacySeal.module.css";

// Story 5.4, AC1/AC2: selo discreto repetido em qualquer tela onde dados sensíveis (mensagens,
// sínteses, resumos) aparecem — chat, histórico e insights (UX-DR13/UX-DR9, ux-patterns.md
// Padrão 5). A copy segue o modelo real de criptografia documentado em architecture.md
// ("criptografia em repouso + TLS em trânsito", não E2EE literal) — nunca "armazenadas
// localmente", que é o texto (desatualizado) que ainda está em ux-patterns.md.
export function PrivacySeal() {
  return (
    <p className={styles.seal}>
      <span className={styles.icon} aria-hidden="true">
        🔒
      </span>
      Transcrições armazenadas com criptografia ·{" "}
      <Link href="/privacidade" className={styles.link}>
        Como seus dados são usados
      </Link>
    </p>
  );
}
