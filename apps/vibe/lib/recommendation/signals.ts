/**
 * ============================================================================
 * VIBE RECOMMENDATION ENGINE — SIGNALS (lib/recommendation/signals.ts)
 * Fonctions pures de scoring : fraîcheur, engagement, vélocité, proximité
 * sociale, sécurité. Chaque signal renvoie une valeur bornée [0, 1]
 * (ou un multiplicateur neutre à 1) pour rester combinable linéairement.
 * ============================================================================
 */

/** Demi-vie de fraîcheur : une publication perd 50 % de fraîcheur tous les 18 h. */
export const FRESHNESS_HALF_LIFE_HOURS = 18;

/** Poids des impressions (vues) dans l'engagement brut — faible mais réel. */
export const VIEW_WEIGHT = 0.1;

export function ageInHours(publishedAt: Date, now: number = Date.now()): number {
  return Math.max(0.05, (now - publishedAt.getTime()) / (1000 * 60 * 60));
}

/** Décroissance exponentielle à demi-vie : 1.0 à la publication, 0.5 après 18 h. */
export function freshnessDecay(ageHours: number): number {
  return Math.exp((-Math.LN2 * ageHours) / FRESHNESS_HALF_LIFE_HOURS);
}

/** Engagement brut pondéré : Likes ×1, Reposts ×2.5, Réponses ×2, Vues ×0.1. */
export function rawEngagement(
  likes: number,
  reposts: number,
  replies: number,
  views: number
): number {
  return (
    likes * 1.0 +
    reposts * 2.5 +
    replies * 2.0 +
    views * VIEW_WEIGHT
  );
}

/** Compression logarithmique de l'engagement brut vers [0, 1]. */
export function engagementScore(rawEngagements: number): number {
  return Math.min(1.0, Math.log10(rawEngagements + 1) / 2.5);
}

/** Vélocité virale : engagement par heure écoulée, saturé à 1. */
export function velocityScore(rawEngagements: number, ageHours: number): number {
  return Math.min(1.0, rawEngagements / Math.max(0.5, ageHours) / 8.0);
}

/** Facteur de sécurité : pénalise la toxicité (0 → neutre, 1 → score nul). */
export function safetyFactor(toxicityScore: number | undefined): number {
  return Math.max(0, 1 - (toxicityScore || 0) * 2.5);
}

/**
 * Proximité sociale : abonnement + affinité mesurée (historique d'interactions
 * avec l'auteur), borné [0.2, 1].
 */
export function graphProximityScore(
  isFollowedAuthor: boolean | undefined,
  affinity: number | undefined
): number {
  const clampedAffinity = Math.max(0, Math.min(1, affinity || 0));
  return isFollowedAuthor ? 0.7 + 0.3 * clampedAffinity : 0.2 + 0.5 * clampedAffinity;
}

/** Affinement utilisateur : ×0.65 (pas intéressé) .. ×1.35 (intéressé). */
export function interestFactor(interestSignal: number | undefined): number {
  const clamped = Math.max(-1, Math.min(1, interestSignal || 0));
  return 1 + 0.35 * clamped;
}

/** Multiplicateurs de qualité : comptes vérifiés ×1.15, médias ×1.10. */
export function qualityBoost(isVerifiedAuthor?: boolean, hasMedia?: boolean): number {
  let boost = 1.0;
  if (isVerifiedAuthor) boost *= 1.15;
  if (hasMedia) boost *= 1.10;
  return boost;
}

/** Score dwell 0..1 : temps passé sur un post (profil temporel). */
export function dwellScore(ms?: number): number {
  if (!ms || ms <= 0) return 0;
  return Math.min(1, Math.log10(ms / 1000 + 1) / 1.5);
}

/** Boost contexte temporel : +10% si même partie de journée. */
export function dayPartBoost(publishedAt: Date, now: number = Date.now()): number {
  const h = (t: Date) => t.getHours();
  const part = (hh: number) => (hh < 6 ? 0 : hh < 12 ? 1 : hh < 18 ? 2 : 3);
  return part(h(publishedAt)) === part(h(new Date(now))) ? 0.1 : 0;
}
