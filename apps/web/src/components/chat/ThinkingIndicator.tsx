import { Aura } from "@/components/aura/Aura";
import styles from "./ThinkingIndicator.module.css";

export const THINKING_COPY = "Estou pensando sobre o que você trouxe...";

/**
 * Presença orgânica enquanto o agente processa a resposta (Story 2.7, AC1).
 * A duração reflete o estado real da requisição — não há temporizador fixo.
 * Sem role/aria-live próprios: já renderiza dentro do `.history` (aria-live="polite")
 * de ChatWindow — uma segunda região ao vivo aninhada duplicaria anúncios de leitor de tela.
 */
export function ThinkingIndicator() {
  return (
    <div className={styles.indicator}>
      <Aura size={22} />
      <p className={styles.copy}>{THINKING_COPY}</p>
    </div>
  );
}
