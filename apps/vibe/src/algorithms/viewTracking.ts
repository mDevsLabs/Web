/**
 * ============================================================================
 * VIBE — ALGORITHMES COMPTAGE DE VUES (src/algorithms/viewTracking.ts)
 * Règles de comptage d'impression façon X : un post est compté une seule fois
 * par session navigateur, s'il est resté visible (dwell) au-delà du seuil.
 * ============================================================================
 */

export const VIEW_VISIBILITY_THRESHOLD = 0.5;
export const VIEW_DWELL_MS = 1000;

/** Buckets de temps passé : skim <2s, lecture 2-8s, immersion >8s. */
export const VIEW_TIME_BUCKETS = { skim: 2000, read: 8000 } as const;

/** Score dwell 0..1 : compression log du temps visible cumulé. */
export function dwellScore(ms?: number): number {
  if (!ms || ms <= 0) return 0;
  return Math.min(1, Math.log10(ms / 1000 + 1) / 1.5);
}

/** Boost contexte temporel : +10% si post publié dans la même partie de journée. */
export function dayPartBoost(publishedAt: Date, now: Date = new Date()): number {
  const part = (d: Date) => {
    const h = d.getHours();
    if (h < 6) return 0;
    if (h < 12) return 1;
    if (h < 18) return 2;
    return 3;
  };
  return part(publishedAt) === part(now) ? 0.1 : 0;
}

const STORAGE_KEY = 'vibe_counted_views';
const MAX_TRACKED = 500;

function loadCounted(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persistCounted(ids: string[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_TRACKED)));
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on ignore,
    // la vue sera simplement potentiellement recomptée à chaque montage.
  }
}

export function hasCountedView(postId: string): boolean {
  return loadCounted().includes(postId);
}

export function markViewCounted(postId: string): void {
  const ids = loadCounted().filter((id) => id !== postId);
  ids.push(postId);
  persistCounted(ids);
}
