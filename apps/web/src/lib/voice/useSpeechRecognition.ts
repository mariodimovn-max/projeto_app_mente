"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechRecognitionStatus = "idle" | "recording" | "error";

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  status: SpeechRecognitionStatus;
  start: () => void;
  stop: () => void;
}

const ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "not-allowed": "Não conseguimos acessar seu microfone. Verifique a permissão do navegador.",
  "service-not-allowed": "Não conseguimos acessar seu microfone. Verifique a permissão do navegador.",
  "no-speech": "Não captamos nenhuma fala. Tente de novo, um pouco mais perto do microfone.",
  "audio-capture": "Não encontramos um microfone disponível. Verifique se ele está conectado.",
};

export const DEFAULT_VOICE_ERROR_MESSAGE =
  "Ocorreu um problema ao processar a sua voz. Vamos tentar de novo?";

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function useSpeechRecognition({
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      }
    };
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current) return;

    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) return;

    const recognition = new Constructor();
    recognition.lang = "pt-BR";
    // Single-utterance capture: the browser auto-stops (and fires "end") once
    // it detects a pause, instead of listening indefinitely in the background.
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;

      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results.item(i);
        if (result.isFinal) {
          transcript += result.item(0).transcript;
        }
      }
      const trimmed = transcript.trim();
      if (trimmed) {
        onResultRef.current(trimmed);
      }
    };

    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;

      recognitionRef.current = null;
      setStatus("error");
      onErrorRef.current(ERROR_MESSAGES[event.error] ?? DEFAULT_VOICE_ERROR_MESSAGE);
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;

      recognitionRef.current = null;
      setStatus((current) => (current === "error" ? current : "idle"));
    };

    recognitionRef.current = recognition;
    setStatus("recording");

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("error");
      onErrorRef.current(DEFAULT_VOICE_ERROR_MESSAGE);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported: isSpeechRecognitionSupported(), status, start, stop };
}
