import { Aura } from "@/components/aura/Aura";
import { depthLevelLabel, depthReadingLabel } from "@/lib/chat/depth";
import type { SessionSynthesis } from "@/types/synthesis";
import styles from "./SynthesisCard.module.css";

interface SynthesisCardProps {
  synthesis: SessionSynthesis;
}

function formatSynthesisDate(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(/\.$/, "");
  const timePart = date
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
  return `${datePart}, ${timePart}`;
}

/**
 * Encerramento visual de uma sessão (Story 3.1, AC2/AC3), seguindo o layout do arquivo de
 * design "Aura - Síntese": coluna com a aura em repouso + estatísticas da sessão, e o
 * conteúdo da síntese (título gerado, o que foi explorado, padrões como cartões, e a
 * pergunta aberta em destaque).
 */
export function SynthesisCard({ synthesis }: SynthesisCardProps) {
  return (
    <div className={styles.card} role="region" aria-label="Síntese da sessão">
      <div className={styles.statsColumn}>
        <div className={styles.auraWrap}>
          <Aura size={110} />
        </div>
        <p className={styles.restLine}>Foi bom descer com você.</p>
        <div className={styles.divider} />
        <dl className={styles.stats}>
          <div className={styles.statRow}>
            <dt>Profundidade</dt>
            <dd>
              {depthReadingLabel(synthesis.depth)} · {depthLevelLabel(synthesis.depth)}
            </dd>
          </div>
          <div className={styles.statRow}>
            <dt>Duração</dt>
            <dd>{synthesis.durationMinutes} min</dd>
          </div>
          <div className={styles.statRow}>
            <dt>Trocas</dt>
            <dd>{synthesis.exchangeCount}</dd>
          </div>
        </dl>
        <p className={styles.privacyCaption}>Síntese salva · só você vê</p>
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>Síntese · {formatSynthesisDate(synthesis.createdAt)}</p>
        <h2 className={styles.title}>{synthesis.title}</h2>

        {synthesis.themes.length > 0 && (
          <ul className={styles.chips}>
            {synthesis.themes.map((theme, index) => (
              <li key={`${theme}-${index}`} className={styles.chip}>
                {theme}
              </li>
            ))}
          </ul>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>O que exploramos</h3>
          <p className={styles.explored}>{synthesis.explored}</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Padrões que apareceram</h3>
          <ul className={styles.patternList}>
            {synthesis.patterns.map((pattern, index) => (
              <li key={`${pattern}-${index}`} className={styles.patternCard}>
                {pattern}
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.openQuestionBox}>
          <span className={styles.openQuestionMark} aria-hidden="true">
            ?
          </span>
          <p className={styles.openQuestionLabel}>Para levar com você</p>
          <p className={styles.openQuestion}>{synthesis.openQuestion}</p>
        </div>

        {/* Sem lógica própria ainda — não há histórico de sessões nem onde "guardar" um
            insight além do que já é salvo automaticamente; desabilitados até essas telas
            existirem, para não sugerir uma capacidade que o app ainda não tem. */}
        <div className={styles.actions}>
          <button type="button" className={styles.actionPrimary} disabled>
            Guardar no diário
          </button>
          <button type="button" className={styles.actionGhost} disabled>
            Ver a conversa
          </button>
        </div>
      </div>
    </div>
  );
}
