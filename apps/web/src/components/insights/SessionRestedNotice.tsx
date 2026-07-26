import { Aura } from "@/components/aura/Aura";
import styles from "./SessionRestedNotice.module.css";

interface SessionRestedNoticeProps {
  onReveal: () => void;
}

/**
 * Encerramento por inatividade (Story 3.1, AC4): a síntese já foi gerada em background,
 * mas em vez de despejar o conteúdo completo sem aviso, mostramos primeiro este convite
 * suave — o usuário decide quando quer ver, seguindo o layout do arquivo de design
 * "Aura - Síntese" (tela "encerramento por inatividade").
 */
export function SessionRestedNotice({ onReveal }: SessionRestedNoticeProps) {
  return (
    <div className={styles.notice} role="status">
      <div className={styles.auraWrap}>
        <Aura size={100} />
      </div>
      <p className={styles.eyebrow}>A sessão repousou</p>
      <p className={styles.message}>
        Faz um tempo que você não escreve. Guardei o que conversamos com cuidado.
      </p>
      <p className={styles.subMessage}>
        Preparei uma síntese do que exploramos hoje. Ela está esperando por você.
      </p>
      <button type="button" className={styles.revealButton} onClick={onReveal}>
        Ver a síntese
      </button>
      <p className={styles.caption}>Encerrada automaticamente após 60 min</p>
    </div>
  );
}
