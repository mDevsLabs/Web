/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SERVICE PWA (src/services/pwa.ts)
 * Enregistrement du service worker, mises à jour, installation (A2HS),
 * détection standalone / iOS.
 * ============================================================================
 */

let waitingWorker: ServiceWorker | null = null;
let updateCallback: (() => void) | null = null;
let deferredInstallPrompt: any = null;
let controllerReloadPending = false;
let installAvailable = false;
const installListeners = new Set<() => void>();

/** Vrai sur iPhone / iPad (y compris iPad récent signalé comme Mac). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1)
  );
}

/** Vrai quand l'app tourne en mode installé (PWA standalone). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const fromMedia = window.matchMedia?.('(display-mode: standalone)')?.matches;
  return Boolean(fromMedia || (navigator as any).standalone === true);
}

/** Vrai quand le navigateur a signalé une installation possible. */
export function canInstall(): boolean {
  return installAvailable;
}

/** Abonnement aux changements de disponibilité de l'installation. */
export function onInstallAvailable(cb: () => void): () => void {
  installListeners.add(cb);
  return () => installListeners.delete(cb);
}

function emitInstallAvailability() {
  installAvailable = deferredInstallPrompt !== null;
  installListeners.forEach((cb) => cb());
}

/** Ouvre l'invite d'installation native. Retourne true si acceptée. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    emitInstallAvailability();
    return choice?.outcome === 'accepted';
  } catch {
    deferredInstallPrompt = null;
    emitInstallAvailability();
    return false;
  }
}

/** Abonnement à la disponibilité d'une mise à jour du service worker. */
export function onUpdateAvailable(cb: () => void): () => void {
  updateCallback = cb;
  if (waitingWorker) cb();
  return () => {
    if (updateCallback === cb) updateCallback = null;
  };
}

/** Active le nouveau service worker puis recharge la page. */
export function applyUpdate(): void {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  controllerReloadPending = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

/** À appeler une fois au démarrage (main.tsx). */
export function registerSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    emitInstallAvailability();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    emitInstallAvailability();
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!controllerReloadPending) return;
    controllerReloadPending = false;
    window.location.reload();
  });

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const track = (worker: ServiceWorker | null) => {
          if (!worker) return;
          waitingWorker = worker;
          updateCallback?.();
        };

        // Worker en attente d'activation (visite précédente déjà terminée)
        track(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // « installed » + controller existant = mise à jour prête (pas 1re install)
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              track(registration.waiting || installing);
            }
          });
        });
      })
      .catch(() => {});
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
