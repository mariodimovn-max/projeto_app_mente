"use client";

import { useState } from "react";
import { generateMonthlySummary, generateWeeklySummary } from "@/lib/actions/generateSummary";
import type { WeeklySummaryData } from "@/lib/summaries/weeklySummary";
import type { MonthlySummaryData } from "@/lib/summaries/monthlySummary";
import styles from "./SummaryCard.module.css";

type SummaryPeriod = "week" | "month";
type SummaryData = WeeklySummaryData | MonthlySummaryData;

const UNEXPECTED_ERROR = "Não consegui gerar o resumo agora. Tente novamente.";

// Mesmo fuso fixo usado em lib/dashboard/dashboard.ts — sem isso, o período exibido mudaria
// de dia conforme o fuso do navegador de cada usuário, divergindo do que foi de fato
// calculado no servidor.
const APP_TIMEZONE = "America/Sao_Paulo";

const PERIOD_COPY: Record<
  SummaryPeriod,
  { toggleLabel: string; heading: string; emptyText: string; sectionLabel: string }
> = {
  week: {
    toggleLabel: "Semana",
    heading: "Resumo da semana",
    emptyText: "Veja os principais temas e emoções dos últimos 7 dias, reunidos em um só lugar.",
    sectionLabel: "Resumo semanal",
  },
  month: {
    toggleLabel: "Mês",
    heading: "Resumo do mês",
    emptyText: "Veja os principais temas e emoções dos últimos 30 dias, reunidos em um só lugar.",
    sectionLabel: "Resumo mensal",
  },
};

function formatPeriodDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("pt-BR", { timeZone: APP_TIMEZONE, day: "2-digit", month: "short" })
    .replace(/\.$/, "");
}

function formatTimelineDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("pt-BR", {
      timeZone: APP_TIMEZONE,
      day: "2-digit",
      month: "short",
      weekday: "short",
    })
    .replace(/\.$/, "");
}

// Resumo semanal (Story 4.4) e mensal (Story 4.5) sob demanda, no mesmo cartão (AC2 da
// Story 4.5): um seletor Semana/Mês decide qual Server Action é chamada ao clicar em "Gerar
// resumo" — ambas calculam deterministicamente a partir de `session_syntheses`, sem
// histórico bruto de conversa (AC3). Trocar de período limpa o resumo/erro exibido, para não
// mostrar dado de um período com o rótulo do outro.
export function SummaryCard() {
  const [period, setPeriod] = useState<SummaryPeriod>("week");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectPeriod(nextPeriod: SummaryPeriod) {
    if (nextPeriod === period || isLoading) {
      return;
    }
    setPeriod(nextPeriod);
    setSummary(null);
    setError(null);
  }

  async function handleGenerate() {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = period === "week" ? await generateWeeklySummary() : await generateMonthlySummary();
      if ("error" in result) {
        setError(result.error);
        setSummary(null);
        return;
      }
      setSummary(result.summary);
    } catch {
      setError(UNEXPECTED_ERROR);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }

  const copy = PERIOD_COPY[period];

  return (
    <section className={styles.section} aria-label={copy.sectionLabel}>
      <div className={styles.periodToggle} role="group" aria-label="Selecionar período do resumo">
        {(Object.keys(PERIOD_COPY) as SummaryPeriod[]).map((key) => (
          <button
            key={key}
            type="button"
            className={
              period === key
                ? `${styles.periodButton} ${styles.periodButtonActive}`
                : styles.periodButton
            }
            aria-pressed={period === key}
            disabled={isLoading}
            onClick={() => handleSelectPeriod(key)}
          >
            {PERIOD_COPY[key].toggleLabel}
          </button>
        ))}
      </div>

      <div className={styles.head}>
        <p className={styles.heading}>{copy.heading}</p>
        <button
          type="button"
          className={styles.generateButton}
          onClick={() => void handleGenerate()}
          disabled={isLoading}
        >
          {isLoading ? "Gerando…" : summary ? "Gerar de novo" : "Gerar resumo"}
        </button>
      </div>

      {!summary && !error && <p className={styles.emptyText}>{copy.emptyText}</p>}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {summary && (
        <div className={styles.card}>
          <p className={styles.period}>
            {formatPeriodDate(summary.periodStart)} – {formatPeriodDate(summary.periodEnd)}
          </p>
          <p className={styles.progressNote}>{summary.progressNote}</p>

          {summary.topics.length > 0 && (
            <div className={styles.block}>
              <p className={styles.blockLabel}>Principais temas</p>
              <ul className={styles.chips}>
                {summary.topics.map((topic) => (
                  <li key={topic.label} className={styles.chip}>
                    {topic.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.emotions.length > 0 && (
            <div className={styles.block}>
              <p className={styles.blockLabel}>Emoções dominantes</p>
              <ul className={styles.chips}>
                {summary.emotions.map((emotion) => (
                  <li key={emotion.label} className={styles.chip}>
                    {emotion.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.timeline.length > 0 && (
            <div className={styles.block}>
              <p className={styles.blockLabel}>Linha do tempo</p>
              <ul className={styles.timeline}>
                {summary.timeline.map((entry) => (
                  <li key={entry.sessionId} className={styles.timelineItem}>
                    <span className={styles.timelineDate}>{formatTimelineDate(entry.createdAt)}</span>
                    <span className={styles.timelineTitle}>{entry.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.privacyCaption}>
            Este resumo reflete só temas e emoções, sem trechos das suas conversas.
          </p>
        </div>
      )}
    </section>
  );
}
