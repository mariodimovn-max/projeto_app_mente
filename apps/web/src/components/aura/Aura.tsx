import styles from "./Aura.module.css";

interface AuraProps {
  /** Diâmetro do orbe em pixels. */
  size: number;
}

/**
 * O orbe de luz que representa a presença da IA (Direção 1a — "Aura").
 * Puramente decorativo: a voz do agente já é lida via texto/aria-live,
 * então o orbe fica oculto de leitores de tela.
 */
export function Aura({ size }: AuraProps) {
  return (
    <div className={styles.aura} style={{ width: size, height: size }} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.core} />
    </div>
  );
}
