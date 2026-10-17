/**
 * Persistance de la réduction du rail Wakies.
 *
 * Le nom du cookie est propre à Wakies : `sidebar_state` appartient déjà à la
 * barre latérale du chat, et les deux applications vivent dans des groupes de
 * routes séparés. Partager la clé ferait réduire une barre en changeant
 * d'application.
 */

export const WAKIES_NAV_COOKIE = "wakies_sidebar_state";

/** Un an : le choix d'affichage d'un espace de travail n'a pas d'expiration utile. */
const MAX_AGE = 60 * 60 * 24 * 365;

const REDUITE = "reduced";
const DEPLIEE = "full";

/** Valeur lue côté serveur (`cookies().get(...)?.value`) ou côté navigateur. */
export function estNavReduite(valeur: string | undefined): boolean {
  return valeur === REDUITE;
}

export function memoriserNavReduite(reduite: boolean): void {
  if (typeof document === "undefined") return;
  document.cookie = `${WAKIES_NAV_COOKIE}=${reduite ? REDUITE : DEPLIEE}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}
