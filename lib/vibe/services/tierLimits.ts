/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — LIMITES PAR FORFAIT (src/services/tierLimits.ts)
 * Miroir client des limites appliquées côté API Vibe (messages, publications,
 * médias). Le forfait vient de user.tier (/v1/me) : Free, Plus, Pro ou Max.
 * ============================================================================
 */

export const isPaidTier = (tier?: string | null): boolean =>
  ["plus", "pro", "max"].includes(
    String(tier || "")
      .trim()
      .toLowerCase()
  );

/** Longueur maximale d'une Vibe (publication), en texte brut. */
export const POST_CHARS_FREE = 1000;
/** Longueur maximale d'un message privé, en texte brut. */
export const DM_CHARS_FREE = 3000;
export const DM_CHARS_PAID = 10_000;
/** Taille totale des médias par publication / message. */
export const MEDIA_BYTES_FREE = 50 * 1024 * 1024;
export const MEDIA_BYTES_PAID = 1024 * 1024 * 1024;

/** Limite de caractères d'une Vibe — Infinity pour Plus/Pro/Max (illimité). */
export const getPostCharLimit = (tier?: string | null): number =>
  isPaidTier(tier) ? Number.POSITIVE_INFINITY : POST_CHARS_FREE;

/** Limite de caractères d'un message — 10 000 pour Plus/Pro/Max, 3 000 sinon. */
export const getDmCharLimit = (tier?: string | null): number =>
  isPaidTier(tier) ? DM_CHARS_PAID : DM_CHARS_FREE;

/** Limite de taille totale des médias — 1 Go pour Plus/Pro/Max, 50 Mo sinon. */
export const getMediaBytesLimit = (tier?: string | null): number =>
  isPaidTier(tier) ? MEDIA_BYTES_PAID : MEDIA_BYTES_FREE;

/** « 50 Mo » / « 1 Go » — libellés d'interface. */
export const formatMediaLimit = (bytes: number): string =>
  bytes >= MEDIA_BYTES_PAID ? "1 Go" : "50 Mo";
