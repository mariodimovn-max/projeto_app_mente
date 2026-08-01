"use client";

import { useMemo, useState } from "react";
import { HistoryCard } from "./HistoryCard";
import { filterSessionsByQuery } from "@/lib/history/search";
import type { HistorySessionSummary } from "@/types/history";
import styles from "./HistoryList.module.css";

interface HistoryListProps {
  initialSessions: HistorySessionSummary[];
}

/**
 * Lista cronológica de sessões do Histórico (Story 3.5, AC1/AC2) — busca por
 * palavra-chave ou tema é um filtro local sobre a lista já carregada, então o resultado é
 * instantâneo (AC2, "menos de 1 segundo"), sem round-trip ao servidor.
 */
export function HistoryList({ initialSessions }: HistoryListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [query, setQuery] = useState("");

  const latestSessionId = sessions[0]?.id ?? null;
  const filtered = useMemo(() => filterSessionsByQuery(sessions, query), [sessions, query]);

  function handleMarkedChange(sessionId: string, marked: boolean) {
    setSessions((current) =>
      current.map((session) => (session.id === sessionId ? { ...session, marked } : session))
    );
  }

  function handleDeleted(sessionId: string) {
    setSessions((current) => current.filter((session) => session.id !== sessionId));
  }

  if (sessions.length === 0) {
    return <p className={styles.emptyState}>Suas conversas encerradas vão aparecer aqui.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchField}>
        <label className={styles.searchLabel} htmlFor="history-search">
          Buscar por palavra-chave ou tema
        </label>
        <input
          id="history-search"
          type="search"
          className={styles.searchInput}
          placeholder="Ex.: sono, ansiedade, propósito…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>Nenhuma sessão encontrada para &quot;{query}&quot;.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((session) => (
            <HistoryCard
              key={session.id}
              session={session}
              isLatest={session.id === latestSessionId}
              onMarkedChange={handleMarkedChange}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
