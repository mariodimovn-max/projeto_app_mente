import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard/dashboard";
import styles from "./DashboardStats.module.css";

interface DashboardStatsProps {
  data: DashboardData;
}

const STREAK_BAR_SLOTS = 7;

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// Indicadores de evolução da tela Início (Story 4.2): dias consecutivos, sessões
// concluídas e temas explorados, todos lidos do agregado `user_patterns` (mais o streak,
// calculado a partir das datas das sessões — ver lib/dashboard/dashboard.ts). Sem
// gamification (AC3): nenhum ponto, nível, badge ou comparação — só o retrato do que já
// aconteceu, na mesma linguagem serena do resto do app.
export function DashboardStats({ data }: DashboardStatsProps) {
  if (data.sessionCount === 0) {
    return (
      <section className={styles.empty} aria-label="Seus indicadores de evolução">
        <p className={styles.emptyText}>
          Seu retrato aparece aqui depois da primeira conversa encerrada.
        </p>
        <Link className={styles.emptyCta} href="/chat">
          Começar uma conversa
        </Link>
      </section>
    );
  }

  const filledSlots = Math.min(data.streakDays, STREAK_BAR_SLOTS);

  return (
    <section className={styles.stats} aria-label="Seus indicadores de evolução">
      <div className={styles.tiles}>
        <div className={styles.tile}>
          <p className={styles.tileLabel}>Presença</p>
          <div className={styles.tileValue}>
            <span className={styles.tileNumber}>{data.streakDays}</span>
            <span className={styles.tileUnit}>
              {pluralize(data.streakDays, "dia seguido aqui", "dias seguidos aqui")}
            </span>
          </div>
          <div className={styles.streakBar} aria-hidden="true">
            {Array.from({ length: STREAK_BAR_SLOTS }, (_, index) => (
              <span
                key={index}
                className={index < filledSlots ? styles.streakSlotFilled : styles.streakSlotEmpty}
              />
            ))}
          </div>
          <p className={styles.tileCaption}>
            Sem pressa para amanhã. Voltar quando quiser já é o suficiente.
          </p>
        </div>

        <div className={styles.tile}>
          <p className={styles.tileLabel}>Mergulhos</p>
          <div className={styles.tileValue}>
            <span className={styles.tileNumber}>{data.sessionCount}</span>
            <span className={styles.tileUnit}>
              {pluralize(data.sessionCount, "conversa concluída", "conversas concluídas")}
            </span>
          </div>
          <p className={styles.tileCaption}>
            Cada uma terminou com uma síntese guardada no seu diário.
          </p>
        </div>
      </div>

      {data.themes.length > 0 && (
        <div className={styles.themesTile}>
          <p className={styles.tileLabel}>Temas que você tem explorado</p>
          <ul className={styles.chips}>
            {data.themes.map((theme) => (
              <li key={theme.label} className={styles.chip}>
                {theme.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.footnote}>
        Um retrato do seu caminho, atualizado a cada mergulho. Aqui não há pontos, níveis
        nem metas — só você, mais perto de si.
      </p>
    </section>
  );
}
