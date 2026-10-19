/**
 * Extraction de la référence publique d'une clé API.
 *
 * Module volontairement sans dépendance : il est importé à la fois par le code
 * serveur (`lib/api-key-manager.ts`) et par des composants clients
 * (`components/account/account-utils.ts`). Il ne doit donc jamais importer quoi que
 * ce soit qui touche au runtime serveur (base de données, variables d'environnement).
 */

/** Longueur maximale d'un préfixe exposé publiquement pour les formats hérités. */
export const MAX_PUBLIC_PREFIX_LENGTH = 11;

/** Format de référence seul, sans segment secret : `mai-TIER-XXXXX`. */
const PUBLIC_REF_PATTERN = /^mai-(?:free|plus|pro|max)-[A-Z0-9]{5}$/i;

/** Une chaîne est-elle déjà une référence publique (donc sûre à afficher) ? */
export function isPublicApiKeyRef(value: string): boolean {
  return PUBLIC_REF_PATTERN.test(value.trim());
}

/**
 * Extrait le préfixe public exact d'une clé. Cette fonction ne doit jamais
 * retourner une clé courte entière : les formats historiques exposent au
 * maximum leurs 11 premiers caractères.
 */
export function getApiKeyRef(
  secretKey: string | null | undefined
): string | null {
  if (!secretKey || typeof secretKey !== "string") return null;
  const value = secretKey.trim();
  if (!value || /^[a-f0-9]{64}$/i.test(value)) return null;

  const maiMatch = value.match(/^(mai-(?:free|plus|pro|max)-[A-Z0-9]{5})-/i);
  if (maiMatch) return maiMatch[1];

  if (/^mai_live[A-Za-z0-9_-]{8,}$/.test(value))
    return value.slice(0, MAX_PUBLIC_PREFIX_LENGTH);
  if (/^mp-[A-Za-z0-9_-]{12,}$/.test(value))
    return value.slice(0, MAX_PUBLIC_PREFIX_LENGTH);
  if (/^sk_mp_[A-Za-z0-9_-]{8,}$/.test(value))
    return value.slice(0, MAX_PUBLIC_PREFIX_LENGTH);
  return null;
}
