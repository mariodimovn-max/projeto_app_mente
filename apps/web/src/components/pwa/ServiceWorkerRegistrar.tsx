"use client";

import { useEffect } from "react";
import { startInstallPromptCapture } from "@/lib/pwa/installPrompt";

// Ponto de entrada do PWA no layout raiz. Não renderiza nada.
// - Story 6.2: começa a capturar o `beforeinstallprompt` já na primeira página (em qualquer
//   ambiente), para o item "Instalar" de Configurações não perder o evento.
// - Story 6.1: registra o service worker mínimo (public/sw.js) — só em produção, porque em dev
//   o SW atrapalha o HMR e mascara mudanças. Falha de registro não afeta o uso online do app,
//   então vai só para o console.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    startInstallPromptCapture();

    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => {
        console.error("Falha ao registrar o service worker", error);
      });
  }, []);

  return null;
}
