"use client";

import { useReducer, useRef, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { DepthMeter } from "./DepthMeter";
import { MessageBubble } from "./MessageBubble";
import { Aura } from "@/components/aura/Aura";
import { depthFraction, depthLevelLabel, depthReadingLabel, nextDepth } from "@/lib/chat/depth";
import type { ChatMessage, ChatStatus } from "@/types/chat";
import styles from "./ChatWindow.module.css";

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
  | { type: "error"; message: string };

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
    default:
      return state;
  }
}

export function ChatWindow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef<string | null>(null);
  const [depth, setDepth] = useState(0);

  async function sendMessage(text: string) {
    const userMessageId = crypto.randomUUID();
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
      }

      dispatch({ type: "stream_start", assistantMessageId: crypto.randomUUID() });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        dispatch({ type: "stream_chunk", delta: decoder.decode(value, { stream: true }) });
      }

      dispatch({ type: "stream_done" });
      setDepth((current) => nextDepth(current));
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
          {state.messages.length === 0 && (
            <p className={styles.emptyState}>Escreva quando quiser começar.</p>
          )}
          {state.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {state.status === "error" && (
          <div className={styles.errorBanner} role="alert">
            <p>{state.errorMessage}</p>
            <button type="button" className={styles.retryButton} onClick={handleRetry}>
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles.composerArea}>
          <ChatComposer disabled={isBusy} onSend={(text) => void sendMessage(text)} />
        </div>
      </div>
    </div>
  );
}
