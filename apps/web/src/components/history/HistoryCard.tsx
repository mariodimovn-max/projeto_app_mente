"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { deleteSession, setSessionMarked } from "@/lib/actions/sessionHistory";
import type { HistorySessionSummary } from "@/types/history";
import styles from "./HistoryCard.module.css";

// Largura total das 3 ações reveladas pelo swipe (Revisar/Marcar/Excluir) — usada tanto
// para limitar o arraste quanto para decidir o "snap" final (abrir/fechar), e para
// dimensionar o painel de confirmação de exclusão, que ocupa a mesma área revelada.
const ACTIONS_WIDTH = 216;
const OPEN_THRESHOLD = ACTIONS_WIDTH / 2;

const MARK_ERROR = "Não consegui atualizar essa sessão agora. Tente novamente.";
const DELETE_ERROR = "Não consegui excluir essa sessão agora. Tente novamente.";

interface HistoryCardProps {
  session: HistorySessionSummary;
  isLatest: boolean;
  onMarkedChange: (sessionId: string, marked: boolean) => void;
  onDeleted: (sessionId: string) => void;
}

// ux-patterns.md ("Padrão 1 — Histórico de Sessões"): sessões antigas mostram data
// completa (com ano), recentes só dia e hora — usa o ano corrente como corte.
function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  const isCurrentYear = date.getFullYear() === new Date().getFullYear();
  const datePart = date
    .toLocaleDateString(
      "pt-BR",
      isCurrentYear
        ? { day: "2-digit", month: "short" }
        : { day: "2-digit", month: "short", year: "numeric" }
    )
    .replace(/\.$/, "");
  const timePart = date
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
  return `${datePart}, ${timePart}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Cartão de sessão do Histórico (Story 3.5, AC1/AC3): abre a sessão completa ao tocar no
 * corpo do cartão, e revela ações rápidas (Revisar/Marcar/Excluir) tanto por swipe quanto
 * pelo botão "⋯" — o botão garante que teclado e leitor de tela alcancem as mesmas ações
 * sem depender do gesto de arrastar.
 */
export function HistoryCard({ session, isLatest, onMarkedChange, onDeleted }: HistoryCardProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragBaseline, setDragBaseline] = useState(0);
  // Rastreado para ignorar um segundo ponteiro (ex.: outro dedo) enquanto já há um
  // arraste em andamento, em vez de deixá-lo sobrescrever o estado do primeiro.
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const offset = open ? -ACTIONS_WIDTH : 0;
  const currentX = isDragging ? dragX : offset;

  // Fechar o painel sempre limpa a confirmação de exclusão junto — sem isto, fechar por
  // swipe ou pelo botão "⋯" (em vez de "Cancelar") deixava `confirmingDelete` preso em
  // `true`, e reabrir o painel caía direto na confirmação de exclusão.
  function setPanelOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmingDelete(false);
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX !== null) {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const baseline = open ? -ACTIONS_WIDTH : 0;
    setActivePointerId(event.pointerId);
    setDragStartX(event.clientX);
    setDragBaseline(baseline);
    setDragX(baseline);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX === null || event.pointerId !== activePointerId) {
      return;
    }
    const delta = event.clientX - dragStartX;
    setDragX(clamp(dragBaseline + delta, -ACTIONS_WIDTH, 0));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX === null || event.pointerId !== activePointerId) {
      return;
    }
    setPanelOpen(dragX <= -OPEN_THRESHOLD);
    setDragStartX(null);
    setActivePointerId(null);
    setIsDragging(false);
  }

  function handleCardClick(event: React.MouseEvent) {
    if (open) {
      event.preventDefault();
      setPanelOpen(false);
    }
  }

  async function handleToggleMark() {
    if (isMarking) {
      return;
    }
    setIsMarking(true);
    setError(null);
    const nextMarked = !session.marked;

    try {
      const result = await setSessionMarked(session.id, nextMarked);
      if (!isMountedRef.current) {
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onMarkedChange(session.id, nextMarked);
    } catch {
      if (isMountedRef.current) {
        setError(MARK_ERROR);
      }
    } finally {
      if (isMountedRef.current) {
        setIsMarking(false);
      }
    }
  }

  async function handleConfirmDelete() {
    if (isDeleting) {
      return;
    }
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteSession(session.id);
      if (!isMountedRef.current) {
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onDeleted(session.id);
    } catch {
      if (isMountedRef.current) {
        setError(DELETE_ERROR);
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }

  return (
    <li className={styles.item}>
      <div className={styles.actionsLayer} aria-hidden={!open}>
        {confirmingDelete ? (
          <div
            className={styles.confirmPanel}
            style={{ width: ACTIONS_WIDTH }}
            role="group"
            aria-label="Confirmar exclusão"
          >
            <p className={styles.confirmText}>
              Excluir esta sessão e suas transcrições para sempre?
            </p>
            <div className={styles.confirmButtons}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
                tabIndex={open ? 0 : -1}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                aria-busy={isDeleting}
                tabIndex={open ? 0 : -1}
              >
                {isDeleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link
              href={`/historico/${session.id}`}
              className={styles.actionButton}
              tabIndex={open ? 0 : -1}
            >
              Revisar
            </Link>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => void handleToggleMark()}
              disabled={isMarking}
              tabIndex={open ? 0 : -1}
            >
              {session.marked ? "Desmarcar" : "Marcar"}
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionDanger}`}
              onClick={() => setConfirmingDelete(true)}
              tabIndex={open ? 0 : -1}
            >
              Excluir
            </button>
          </>
        )}
      </div>

      <div
        className={isDragging ? `${styles.cardShell} ${styles.dragging}` : styles.cardShell}
        style={{ transform: `translateX(${currentX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button
          type="button"
          className={styles.toggleActions}
          aria-expanded={open}
          aria-label="Ações rápidas"
          onClick={() => setPanelOpen(!open)}
        >
          <span aria-hidden="true">⋯</span>
        </button>

        <Link
          href={`/historico/${session.id}`}
          className={styles.cardLink}
          onClick={handleCardClick}
        >
          <div className={styles.cardHeader}>
            <time className={styles.date} dateTime={session.createdAt}>
              {formatSessionDate(session.createdAt)}
            </time>
            {isLatest && <span className={styles.latestBadge}>Última sessão</span>}
          </div>

          <h3 className={styles.title}>{session.title ?? "Conversa sem síntese"}</h3>

          {session.themes.length > 0 && (
            <ul className={styles.chips}>
              {session.themes.slice(0, 3).map((theme, index) => (
                <li key={`${theme}-${index}`} className={styles.chip}>
                  {theme}
                </li>
              ))}
            </ul>
          )}

          <div className={styles.footer}>
            <span className={session.hasSynthesis ? styles.synthesisBadge : styles.noSynthesisBadge}>
              {session.hasSynthesis ? "Síntese disponível" : "Sem síntese"}
            </span>
            {session.marked && <span className={styles.markedBadge}>Marcada</span>}
            <span className={styles.privacySeal}>Privado</span>
          </div>
        </Link>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
