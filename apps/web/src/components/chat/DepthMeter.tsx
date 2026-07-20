import { Aura } from "@/components/aura/Aura";
import { depthFraction, depthLevelHint, depthLevelLabel, depthReadingLabel } from "@/lib/chat/depth";
import styles from "./DepthMeter.module.css";

interface DepthMeterProps {
  depth: number;
}

/**
 * Coluna esquerda do chat (desktop): aura + medidor de profundidade.
 * A aura desce ao longo do trilho conforme a conversa avança — a posição e o
 * preenchimento usam a variável CSS --depth-fraction para acompanhar a altura
 * real da coluna, em vez de pixels fixos do modelo de design original.
 */
export function DepthMeter({ depth }: DepthMeterProps) {
  const fraction = depthFraction(depth);

  return (
    <div
      className={styles.column}
      style={{ "--depth-fraction": fraction } as React.CSSProperties}
    >
      <p className={styles.label}>PROFUNDIDADE</p>

      <div className={styles.track} />
      <div className={styles.fill} />

      <span className={styles.markerTop}>0m · Superfície</span>
      <span className={styles.markerMid}>Correntes</span>
      <span className={styles.markerBottom}>Fundo</span>

      <div className={styles.auraWrap}>
        <Aura size={110} />
      </div>

      <div className={styles.reading}>
        <p className={styles.depthValue}>{depthReadingLabel(depth)}</p>
        <p className={styles.levelBadge}>{depthLevelLabel(depth)}</p>
        <p className={styles.hint}>{depthLevelHint(depth)}</p>
      </div>
    </div>
  );
}
