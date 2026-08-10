"use client";

import { useState } from "react";
import { generateWeeklySummary } from "@/lib/actions/generateSummary";
import type { WeeklySummaryData } from "@/lib/summaries/weeklySummary";
import styles from "./WeeklySummaryCard.module.css";

const UNEXPECTED_ERROR = "Não consegui gerar o resumo agora. Tente novamente.";

// Mesmo fuso fixo usado em lib/dashboard/dashboard.ts — sem isso, o período exibido mudaria
// de dia conforme o fuso do navegador de cada usuário, divergindo do que foi de fato
// calculado no servidor.
const APP_TIMEZONE = "America/Sao_Paulo";

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

// Resumo semanal sob demanda (Story 4.4, AC1/AC2): botão único (só "Semana" existe até
// aqui — o seletor "Semana/Mês" descrito nos épicos só faz sentido quando o resumo mensal
// da Story 4.5 também existir). Texto + chips + linha do tempo simples, sem gráficos
// (AC2); nada aqui vem de conteúdo bruto de conversa (AC3).
export function WeeklySummaryCard() {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateWeeklySummary();
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

  return (
    <section className={styles.section} aria-label="Resumo semanal">
      <div className={styles.head}>
        <p className={styles.heading}>Resumo da semana</p>
        <button
          type="button"
          className={styles.generateButton}
          onClick={() => void handleGenerate()}
          disabled={isLoading}
        >
          {isLoading ? "Gerando…" : summary ? "Gerar de novo" : "Gerar resumo"}
        </button>
      </div>

      {!summary && !error && (
        <p className={styles.emptyText}>
          Veja os principais temas e emoções dos últimos 7 dias, reunidos em um só lugar.
        </p>
      )}

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
