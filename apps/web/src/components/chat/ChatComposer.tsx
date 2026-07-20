"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH, messageContentSchema } from "@/lib/validation/message";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { TranscriptBlock } from "./TranscriptBlock";
import styles from "./ChatComposer.module.css";

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

type ComposerMode = "texto" | "voz";

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [mode, setMode] = useState<ComposerMode>("texto");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [justTranscribed, setJustTranscribed] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const justDiscardedTranscriptRef = useRef(false);

  const handleTranscript = useCallback((transcript: string) => {
    setPendingTranscript(transcript);
  }, []);

  const handleVoiceError = useCallback((message: string) => {
    setVoiceError(message);
  }, []);

  const speech = useSpeechRecognition({ onResult: handleTranscript, onError: handleVoiceError });
  const { status: speechStatus, stop: stopSpeech } = speech;

  useEffect(() => {
    if (disabled && speechStatus === "recording") {
      stopSpeech();
    }
  }, [disabled, speechStatus, stopSpeech]);

  useEffect(() => {
    if (mode === "texto" && justTranscribed) {
      textareaRef.current?.focus();
    }
  }, [mode, justTranscribed]);

  useEffect(() => {
    if (pendingTranscript === null && justDiscardedTranscriptRef.current) {
      micButtonRef.current?.focus();
      justDiscardedTranscriptRef.current = false;
    }
  }, [pendingTranscript]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = messageContentSchema.safeParse(text);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Mensagem inválida.");
      return;
    }

    setError(null);
    onSend(result.data);
    setText("");
    setJustTranscribed(false);
  }

  function handleMicClick() {
    setVoiceError(null);
    if (speech.status === "recording") {
      speech.stop();
    } else {
      speech.start();
    }
  }

  function handleRetryRecording() {
    setVoiceError(null);
    speech.start();
  }

  function handleContinueWithText() {
    setVoiceError(null);
    setMode("texto");
  }

  function handleSaveTranscript(finalText: string) {
    setText((current) => (current ? `${current} ${finalText}` : finalText));
    setPendingTranscript(null);
    setError(null);
    setMode("texto");
    setJustTranscribed(true);
  }

  function handleDiscardTranscript() {
    setPendingTranscript(null);
    justDiscardedTranscriptRef.current = true;
  }

  return (
    <div className={styles.dock}>
      <div className={styles.segmented} role="group" aria-label="Formato da mensagem">
        <button
          type="button"
          className={mode === "texto" ? `${styles.segButton} ${styles.segButtonActive}` : styles.segButton}
          aria-pressed={mode === "texto"}
          onClick={() => {
            if (speech.status === "recording") {
              speech.stop();
            }
            setPendingTranscript(null);
            setJustTranscribed(false);
            setMode("texto");
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7V5h16v2M9 19h6M12 5v14" />
          </svg>
          Escrever
        </button>
        <button
          type="button"
          className={mode === "voz" ? `${styles.segButton} ${styles.segButtonActive}` : styles.segButton}
          aria-pressed={mode === "voz"}
          onClick={() => {
            setVoiceError(null);
            setMode("voz");
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" stroke="none" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          Falar
        </button>
      </div>

      {mode === "texto" ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.bar}>
            <label className="sr-only" htmlFor="chat-message">
              Sua mensagem
            </label>
            <textarea
              ref={textareaRef}
              id="chat-message"
              className={styles.textarea}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setJustTranscribed(false);
              }}
              placeholder="escreva o que veio agora…"
              rows={1}
              disabled={disabled}
            />
            <button className={styles.sendButton} type="submit" disabled={disabled} aria-label="Enviar mensagem">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5M6 11l6-6 6 6"
                  stroke="var(--color-voice-icon, #06201e)"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {justTranscribed && (
            <p className={styles.transcriptionStatus} role="status">
              Transcrição pronta — revise se quiser
            </p>
          )}

          <div className={styles.footer}>
            <span className={styles.counter} aria-live="polite">
              Mínimo {MIN_MESSAGE_LENGTH} — {text.trim().length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>

          {error && (
            <p className={styles.errorMessage} role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className={styles.voiceDock}>
          {pendingTranscript !== null ? (
            <TranscriptBlock
              transcript={pendingTranscript}
              disabled={disabled}
              onSave={handleSaveTranscript}
              onDiscard={handleDiscardTranscript}
            />
          ) : !speech.isSupported ? (
            <p className={styles.voiceHint}>
              Seu navegador não é compatível com reconhecimento de voz. Use &quot;Escrever&quot; por
              enquanto.
            </p>
          ) : voiceError ? (
            <div className={styles.voiceError} role="alert">
              <p>{voiceError}</p>
              <div className={styles.voiceErrorActions}>
                <button type="button" className={styles.voiceErrorButton} onClick={handleRetryRecording}>
                  Regravar
                </button>
                <button
                  type="button"
                  className={styles.voiceErrorButtonSecondary}
                  onClick={handleContinueWithText}
                >
                  Continuar com texto
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                ref={micButtonRef}
                type="button"
                className={
                  speech.status === "recording"
                    ? `${styles.micButton} ${styles.micButtonActive}`
                    : styles.micButton
                }
                onClick={handleMicClick}
                disabled={disabled}
                aria-pressed={speech.status === "recording"}
                aria-label={speech.status === "recording" ? "Parar gravação" : "Iniciar gravação"}
              >
                <span className={styles.micIcon} aria-hidden="true" />
              </button>
              <div
                className={
                  speech.status === "recording"
                    ? `${styles.waveform} ${styles.waveformActive}`
                    : styles.waveform
                }
                aria-hidden="true"
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} className={styles.waveBar} />
                ))}
              </div>
              {speech.status === "recording" ? (
                <div className={styles.recordingStatus} role="status">
                  <span className={styles.recordingBadge}>Gravando...</span>
                  <p className={styles.voiceHint}>Fale com calma. Estamos captando suas palavras.</p>
                </div>
              ) : (
                <p className={styles.voiceHint}>Toque no microfone para gravar sua mensagem.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
