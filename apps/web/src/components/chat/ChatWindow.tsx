"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { DepthMeter } from "./DepthMeter";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { Aura } from "@/components/aura/Aura";
import { PatternPrivacyNotice } from "@/components/insights/PatternPrivacyNotice";
import { PrivacySeal } from "@/components/privacy/PrivacySeal";
import { SessionRestedNotice } from "@/components/insights/SessionRestedNotice";
import { SynthesisCard } from "@/components/insights/SynthesisCard";
import { endSession } from "@/lib/actions/endSession";
import { resumeSession } from "@/lib/actions/resumeSession";
import { depthFraction, depthLevelLabel, depthReadingLabel, nextDepth } from "@/lib/chat/depth";
import type { ChatMessage, ChatStatus } from "@/types/chat";
import type { SessionSynthesis } from "@/types/synthesis";
import styles from "./ChatWindow.module.css";

// 60 minutos de inatividade (Story 3.1, AC1/AC4) — exportado para ser usado nos testes
// com fake timers, em vez de duplicar o valor.
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

// Story 4.1, AC1: guarda o id da sessão em andamento no escopo da aba, para que sair de
// /chat pela PrimaryNav e voltar retome a conversa em vez de começar uma nova do zero.
// sessionStorage (não localStorage) é intencional — expira sozinho ao fechar a aba, o
// mesmo limite natural de "sessão em andamento".
export const ACTIVE_SESSION_STORAGE_KEY = "diario:activeSessionId";

interface ChatState {
  status: ChatStatus;
  messages: ChatMessage[];
  errorMessage: string | null;
  pendingText: string | null;
}

type ChatAction =
  | { type: "send_start"; text: string; userMessageId: string }
  | { type: "stream_start"; assistantMessageId: string }
  | { type: "stream_chunk"; delta: string }
  | { type: "stream_done" }
  | { type: "error"; message: string }
  | { type: "hydrate"; messages: ChatMessage[] };

const initialState: ChatState = {
  status: "idle",
  messages: [],
  errorMessage: null,
  pendingText: null,
};

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "send_start":
      return {
        status: "loading",
        errorMessage: null,
        pendingText: action.text,
        messages: [
          ...state.messages,
          {
            id: action.userMessageId,
            role: "user",
            content: action.text,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "stream_start":
      return {
        ...state,
        status: "streaming",
        messages: [
          ...state.messages,
          {
            id: action.assistantMessageId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "stream_chunk": {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") {
        return state;
      }
      messages[messages.length - 1] = { ...last, content: last.content + action.delta };
      return { ...state, messages };
    }
    case "stream_done":
      return { ...state, status: "idle", pendingText: null };
    case "error":
      return { ...state, status: "error", errorMessage: action.message };
    case "hydrate":
      return { ...state, status: "idle", errorMessage: null, pendingText: null, messages: action.messages };
    default:
      return state;
  }
}

export function ChatWindow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef<string | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);
  const [synthesis, setSynthesis] = useState<SessionSynthesis | null>(null);
  // Encerramento manual revela a síntese na hora; encerramento automático por inatividade
  // mostra antes o convite suave de SessionRestedNotice (AC4 — layout "Aura - Síntese").
  const [synthesisRevealed, setSynthesisRevealed] = useState(false);
  // Story 3.3, AC3: a Server Action sinaliza quando esta é a primeira vez que o
  // histórico do usuário é agregado para detecção de padrões — usado para exibir o
  // aviso de privacidade uma única vez.
  const [showPatternPrivacyNotice, setShowPatternPrivacyNotice] = useState(false);
  const [endSessionError, setEndSessionError] = useState<string | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const isEndingRef = useRef(false);
  // Story 4.1, AC1: evita que uma retomada de sessão em andamento (efeito assíncrono de
  // montagem) sobrescreva uma conversa nova que o usuário já começou a digitar/enviar
  // antes de a busca terminar.
  const hasSentRef = useRef(false);
  // Suprime o texto de estado vazio ("Escreva quando quiser começar.") enquanto a busca
  // pela sessão em andamento (se houver) ainda não terminou, para não piscar essa
  // mensagem por um instante antes de a conversa retomada aparecer.
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const storedSessionId = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    // Passa pelo mesmo continuation assíncrono (.then) mesmo quando não há nada para
    // retomar, para nunca chamar setState de forma síncrona no corpo do efeito.
    const pending = storedSessionId ? resumeSession(storedSessionId) : Promise.resolve(null);

    void pending.then((result) => {
      if (cancelled || hasSentRef.current) {
        return;
      }

      if (result && storedSessionId) {
        if ("error" in result) {
          window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        } else {
          sessionIdRef.current = storedSessionId;
          dispatch({ type: "hydrate", messages: result.messages });
        }
      }
      setHasCheckedResume(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function sendMessage(text: string) {
    hasSentRef.current = true;
    const userMessageId = crypto.randomUUID();
    // Nova atividade de chat invalida um erro de encerramento anterior — sem isso, o banner
    // de "Não consegui gerar a síntese..." ficaria preso na tela mesmo com a conversa seguindo.
    setEndSessionError(null);
    dispatch({ type: "send_start", text, userMessageId });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current ?? undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        dispatch({
          type: "error",
          message:
            data?.error?.message ?? "Não consegui enviar sua mensagem. Pode tentar novamente?",
        });
        return;
      }

      const newSessionId = response.headers.get("X-Session-Id");
      if (newSessionId) {
        sessionIdRef.current = newSessionId;
        window.sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, newSessionId);
      }
      const isCrisisResponse = response.headers.get("X-Crisis-Response") === "true";

      dispatch({ type: "stream_start", assistantMessageId: crypto.randomUUID() });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        dispatch({ type: "stream_chunk", delta: decoder.decode(value, { stream: true }) });
      }

      dispatch({ type: "stream_done" });
      // A crisis redirect isn't reflective depth — only advance the meter for real exchanges.
      if (!isCrisisResponse) {
        setDepth((current) => nextDepth(current));
      }
    } catch {
      dispatch({
        type: "error",
        message: "Não consegui completar a resposta. Pode tentar novamente?",
      });
    }
  }

  function handleRetry() {
    if (state.pendingText) {
      void sendMessage(state.pendingText);
    }
  }

  const isBusy = state.status === "loading" || state.status === "streaming";

  const handleEndSession = useCallback(
    async (trigger: "manual" | "auto") => {
      const sessionId = sessionIdRef.current;
      // isBusy evita encerrar com uma troca ainda em andamento (mensagem enviada mas sem
      // resposta persistida); isEndingRef evita chamadas concorrentes (clique + timer, ou
      // duplo clique) — ambos entrariam em conflito com a checagem de posse/leitura do banco
      // feita dentro da própria Server Action.
      if (!sessionId || isBusy || isEndingRef.current) {
        return;
      }

      isEndingRef.current = true;
      setIsEndingSession(true);
      setEndSessionError(null);

      try {
        const result = await endSession(sessionId, depth);

        if ("error" in result) {
          setEndSessionError(result.error);
          return;
        }

        // Sessão encerrada — não é mais "em andamento", então não deve ser retomada numa
        // próxima visita a /chat (AC1 é sobre continuidade, não sobre reabrir o que já fechou).
        window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        setSynthesis(result.synthesis);
        setShowPatternPrivacyNotice(result.showPatternPrivacyNotice);
        // Manual: o usuário já pediu para encerrar, mostra a síntese na hora. Automático: a
        // sessão foi encerrada em background sem ação do usuário (AC4) — mostra primeiro o
        // convite suave de SessionRestedNotice, só revelando a síntese quando ele quiser.
        setSynthesisRevealed(trigger === "manual");
      } catch {
        // A Server Action já trata seus próprios erros internos e retorna { error }; isto
        // só é alcançado se a chamada em si rejeitar (ex.: RPC de rede caindo) — sem isto, o
        // botão ficaria travado em "Gerando síntese..." para sempre, sem chance de tentar de novo.
        setEndSessionError(
          "Não consegui gerar a síntese desta sessão agora. Tente novamente."
        );
      } finally {
        isEndingRef.current = false;
        setIsEndingSession(false);
      }
    },
    [isBusy, depth]
  );

  const lastMessage = state.messages[state.messages.length - 1];
  // O agente já enviou cabeçalhos e começou a "streamar", mas o modelo pode levar um
  // tempo real para gerar o primeiro token — o indicador cobre esse intervalo também,
  // não só a fase de "loading" antes do stream começar.
  const isAwaitingFirstToken =
    lastMessage?.role === "assistant" && lastMessage.content === "" && state.status === "streaming";
  const isThinking = state.status === "loading" || isAwaitingFirstToken;
  // Uma bolha do assistente sem conteúdo nunca comunica nada por si só — escondida em
  // qualquer status (não só enquanto aguarda o primeiro token), para não deixá-la visível
  // para sempre se o stream cair ou terminar sem nenhum chunk.
  const visibleMessages = state.messages.filter((message) => message.role !== "assistant" || message.content !== "");
  // AC1: encerrar exige "pelo menos uma troca de mensagens" — uma resposta do
  // agente com conteúdo real confirma que a troca aconteceu.
  const hasCompletedExchange = state.messages.some(
    (message) => message.role === "assistant" && message.content !== ""
  );

  // Acompanha o fim da conversa automaticamente — sem isto, o container de histórico
  // (overflow-y: auto) nunca rola sozinho e o usuário pode ficar preso numa etapa
  // antiga enquanto novas mensagens (inclusive chunks do streaming) chegam abaixo.
  useEffect(() => {
    historyEndRef.current?.scrollIntoView?.({ block: "end" });
  }, [state.messages, isThinking]);

  // AC4: encerramento automático por inatividade, em background. O temporizador
  // reinicia a cada nova mensagem (histórico muda) e é cancelado assim que uma
  // síntese já existe, para não disparar de novo depois de a sessão já ter encerrado.
  useEffect(() => {
    if (!hasCompletedExchange || synthesis) {
      return;
    }

    const timer = setTimeout(() => {
      void handleEndSession("auto");
    }, INACTIVITY_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [state.messages, hasCompletedExchange, synthesis, handleEndSession]);

  return (
    <div className={styles.shell}>
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <div className={styles.mobileHeaderPresence}>
            <Aura size={30} />
            <span>a aura</span>
          </div>
          <div className={styles.mobileDepthBadge}>
            <span className={styles.mobileDepthDot} aria-hidden="true" />
            {depthReadingLabel(depth)} · {depthLevelLabel(depth)}
          </div>
        </div>
        <div className={styles.mobileDepthBar}>
          <div
            className={styles.mobileDepthBarFill}
            style={{ width: `${depthFraction(depth) * 100}%` }}
          />
        </div>
      </header>

      <aside className={styles.sidebar}>
        <DepthMeter depth={depth} />
      </aside>

      <div className={styles.main}>
        <div className={styles.history} aria-live="polite">
          {state.messages.length === 0 && hasCheckedResume && (
            <p className={styles.emptyState}>Escreva quando quiser começar.</p>
          )}
          {visibleMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isThinking && <ThinkingIndicator />}
          <div ref={historyEndRef} />
        </div>

        {state.status === "error" && !synthesis && (
          <div className={styles.errorBanner} role="alert">
            <p>{state.errorMessage}</p>
            <button type="button" className={styles.retryButton} onClick={handleRetry}>
              Tentar novamente
            </button>
          </div>
        )}

        {synthesis && synthesisRevealed ? (
          <div className={styles.composerArea}>
            {showPatternPrivacyNotice && <PatternPrivacyNotice />}
            <SynthesisCard synthesis={synthesis} />
          </div>
        ) : synthesis ? (
          <div className={styles.composerArea}>
            {/* O encerramento automático (AC4) mantém a síntese escondida atrás do convite
                suave até o usuário pedir para vê-la — se ele nunca clicar, a agregação de
                padrões já aconteceu em background (Story 3.3), então o aviso de privacidade
                precisa aparecer aqui também, não só depois da revelação. */}
            {showPatternPrivacyNotice && <PatternPrivacyNotice />}
            <SessionRestedNotice onReveal={() => setSynthesisRevealed(true)} />
          </div>
        ) : (
          <>
            {endSessionError && (
              <div className={styles.errorBanner} role="alert">
                <p>{endSessionError}</p>
              </div>
            )}

            <div className={styles.composerArea}>
              <ChatComposer disabled={isBusy} onSend={(text) => void sendMessage(text)} />
              {hasCompletedExchange && (
                <button
                  type="button"
                  className={styles.endSessionButton}
                  onClick={() => void handleEndSession("manual")}
                  disabled={isEndingSession || isBusy}
                  aria-busy={isEndingSession}
                >
                  {isEndingSession ? "Gerando síntese..." : "Encerrar sessão"}
                </button>
              )}
            </div>
          </>
        )}

        <div className={styles.privacyFooter}>
          <PrivacySeal />
        </div>
      </div>
    </div>
  );
}
