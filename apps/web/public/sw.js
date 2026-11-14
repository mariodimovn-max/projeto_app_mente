// Story 6.1 — service worker mínimo do Diário (ver docs/adr/0007).
//
// Regra de privacidade: este SW guarda em cache APENAS a página offline estática. Nunca grava
// respostas de rede (páginas autenticadas, /api/chat, Server Actions, Supabase) — num aparelho
// compartilhado nenhum conteúdo íntimo pode ficar legível fora da sessão.
//
// Ao alterar public/offline.html, incremente a versão abaixo: o `activate` apaga os caches antigos.
const CACHE = "diario-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Só navegações (troca de página). Todo o resto — POST de Server Action, /api/chat,
  // Supabase, assets — segue direto para a rede, sem interceptação.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
    )
  );
});
