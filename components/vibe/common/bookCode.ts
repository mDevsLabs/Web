/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CODES DE PARTAGE DES LIVRES (bookCode.ts)
 * Normalisation des codes d'invitation (saisie manuelle ou URL de partage).
 * Miroir client de vibe-books.ts#normalizeBookCode.
 * ============================================================================
 */

import { toVibeAbsoluteUrl } from "@/components/vibe/router";

/** Alphabet sans caractères ambigus (pas de I, L, O, 0, 1). */
export const BOOK_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const BOOK_CODE_LENGTH = 8;

/**
 * Extrait un code normalisé depuis une saisie libre : code brut ou URL de
 * partage (« https://…/books/join/AB3DEFG7?x » → « AB3DEFG7 »).
 * Retourne '' si rien d'exploitable.
 */
export function extractBookCode(input: string): string {
  const text = String(input ?? "").trim();
  if (!text) return "";
  const segment = text.includes("/")
    ? text.split(/[/?#]/).filter(Boolean).pop() || ""
    : text;
  return segment
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export function isValidBookCode(code: string): boolean {
  return code.length >= 4 && code.length <= 12;
}

/**
 * Lien de partage complet pour un code donné. Passe par l'adaptateur de
 * routage : un code collé hors de `/vibe` mènerait à une page inexistante.
 */
export function buildBookJoinLink(code: string): string {
  return toVibeAbsoluteUrl(`/books/join/${code}`);
}
