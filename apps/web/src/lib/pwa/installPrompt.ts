// Story 6.2: guarda o evento `beforeinstallprompt` do Chrome para o item "Instalar" de
// Configurações. O evento dispara UMA vez, no carregamento da primeira página — quem entra pela
// Home e navega (client-side) até Configurações o perderia se só o componente daquela tela
// escutasse. Por isso a captura começa no layout raiz (ServiceWorkerRegistrar) e o estado vive
// aqui, em nível de módulo, consumido via useSyncExternalStore.
//
// Nada é persistido (nem "já recusou"): o estado é só memória da página.

export type InstallPromptState = "unavailable" | "available" | "installed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let capturing = false;
let promptInFlight = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
  // Suprime o mini-infobar automático do Chrome: o convite só existe em Configurações ("sem
  // pressão"). A instalação continua possível pelo menu do navegador.
  event.preventDefault();
  deferredPrompt = event;
  notify();
}

function handleAppInstalled() {
  deferredPrompt = null;
  installed = true;
  notify();
}

/** Idempotente: registra os listeners de `window` uma única vez por carga de página. */
export function startInstallPromptCapture(): void {
  if (capturing || typeof window === "undefined") return;
  capturing = true;
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
}

function isRunningStandalone(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/** Snapshot estável (string) para o useSyncExternalStore. */
export function getInstallPromptState(): InstallPromptState {
  if (installed || isRunningStandalone()) return "installed";
  return deferredPrompt ? "available" : "unavailable";
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Abre o prompt nativo de instalação. Um BeforeInstallPromptEvent só pode ser usado uma vez, então
 * ele é descartado em qualquer desfecho (aceito ou recusado) — o item some até o Chrome oferecer
 * de novo numa próxima carga.
 */
export async function promptInstall(): Promise<void> {
  const event = deferredPrompt;
  if (!event || promptInFlight) return;
  // O evento continua guardado enquanto o prompt está aberto (o item fica visível, desabilitado)
  // e só é descartado depois da escolha; a trava impede um segundo prompt() no mesmo evento.
  promptInFlight = true;
  try {
    await event.prompt();
    await event.userChoice;
  } finally {
    deferredPrompt = null;
    promptInFlight = false;
    notify();
  }
}

/** Só para testes: volta o módulo ao estado inicial e remove os listeners de `window`. */
export function resetInstallPromptForTests(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
  }
  deferredPrompt = null;
  installed = false;
  capturing = false;
  promptInFlight = false;
  listeners.clear();
}
