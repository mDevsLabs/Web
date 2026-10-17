/**
 * Stockage local pour les tutoriels onboarding mAI.
 * Versionné, uniquement localStorage — aucune DB.
 */

export const MAIN_KEY = "mai_onboarding_main_v1";
export const UPGRADE_KEY = "mai_onboarding_upgrade_v1";

export type MainStore = {
  version: 1;
  completed: boolean;
  dismissed: boolean;
  step: number; // index courant (0..n-1) pour reprise
  updatedAt: string;
};

export type UpgradeStore = {
  version: 1;
  lastTier: string; // dernier tier ayant déclenché le tuto upgrade
  completed: boolean;
  dismissed: boolean;
  step: number;
  updatedAt: string;
  seenTiers: string[]; // historique pour éviter re-show si déjà vu ce tier
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// ── Main ──
export function getMainStore(): MainStore | null {
  if (!isBrowser()) return null;
  return safeParse<MainStore>(localStorage.getItem(MAIN_KEY));
}

export function setMainStore(patch: Partial<MainStore>): MainStore {
  const prev = getMainStore();
  const now = new Date().toISOString();
  const next: MainStore = {
    ...({
      completed: false,
      dismissed: false,
      step: 0,
      updatedAt: now,
      version: 1 as const,
    } as MainStore),
    ...(prev || {}),
    ...patch,
    updatedAt: now,
    version: 1 as const,
  };
  if (isBrowser()) localStorage.setItem(MAIN_KEY, JSON.stringify(next));
  return next;
}

export function initMainIfMissing(): MainStore | null {
  // called after verifyRegister success — force pending
  return setMainStore({ completed: false, dismissed: false, step: 0 });
}

export function markMainCompleted(): void {
  setMainStore({ completed: true, dismissed: false });
}

export function markMainDismissed(): void {
  setMainStore({ dismissed: true });
}

export function shouldShowMain(): boolean {
  const s = getMainStore();
  if (!s) return false; // rien à montrer si jamais initialisé (pas de 1ère inscription)
  return !s.completed && !s.dismissed;
}

// ── Upgrade ──
export function getUpgradeStore(): UpgradeStore | null {
  if (!isBrowser()) return null;
  return safeParse<UpgradeStore>(localStorage.getItem(UPGRADE_KEY));
}

export function setUpgradeStore(patch: Partial<UpgradeStore>): UpgradeStore {
  const prev = getUpgradeStore();
  const now = new Date().toISOString();
  const next: UpgradeStore = {
    ...({
      completed: false,
      dismissed: false,
      lastTier: "",
      seenTiers: [],
      step: 0,
      updatedAt: now,
      version: 1 as const,
    } as UpgradeStore),
    ...(prev || {}),
    ...patch,
    updatedAt: now,
    version: 1 as const,
  };
  // ensure array
  if (!Array.isArray(next.seenTiers)) next.seenTiers = [];
  if (isBrowser()) localStorage.setItem(UPGRADE_KEY, JSON.stringify(next));
  return next;
}

export function initUpgradeForTier(tier: string): UpgradeStore {
  const normalized = (tier || "").trim();
  const prev = getUpgradeStore();
  // si déjà vu ce tier en completed, on réinitialise quand même pour re-montrer rapidement ?
  // spec: à chaque upgrade → montrer le mini tuto. Donc on reset dismissed/completed pour ce nouveau tier.
  const seen = prev?.seenTiers || [];
  return setUpgradeStore({
    completed: false,
    dismissed: false,
    lastTier: normalized,
    seenTiers: seen.includes(normalized) ? seen : [...seen, normalized],
    step: 0,
  });
}

export function markUpgradeCompleted(): void {
  setUpgradeStore({ completed: true, dismissed: false });
}

export function markUpgradeDismissed(): void {
  setUpgradeStore({ dismissed: true });
}

export function shouldShowUpgrade(): boolean {
  const s = getUpgradeStore();
  if (!s || !s.lastTier) return false;
  return !s.completed && !s.dismissed;
}

// ── Debug / reset ──
export function resetAllOnboarding(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(MAIN_KEY);
  localStorage.removeItem(UPGRADE_KEY);
}

export function debugOnboarding(): void {
  if (!isBrowser()) return;
  console.log(
    "[Onboarding] main",
    getMainStore(),
    "upgrade",
    getUpgradeStore()
  );
}
