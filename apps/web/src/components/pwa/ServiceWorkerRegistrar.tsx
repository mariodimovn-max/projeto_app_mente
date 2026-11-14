"use client";

import { useEffect } from "react";

// Story 6.1: registra o service worker mínimo (public/sw.js) — só em produção, porque em dev
// o SW atrapalha o HMR e mascara mudanças. Não renderiza nada; falha de registro não afeta o
// uso online do app, então vai só para o console.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
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
