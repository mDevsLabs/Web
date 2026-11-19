/**
 * Nettoyage du stockage de session hérité (issue #10).
 *
 * Avant le passage par le cookie httpOnly, le jeton de session était copié
 * dans `localStorage` (`mai_auth`) et dans des cookies lisibles par JavaScript
 * (`mai_user`, `mai_token`), pour 30 jours. À chaque visite, ces traces sont
 * effacées : un script exécuté dans l'origine ne doit plus rien pouvoir lire.
 * La session réelle vit uniquement dans le cookie httpOnly
 * `mai_session_token`, posé et lu côté serveur.
 */

const LEGACY_LOCAL_KEYS = ["mai_auth"] as const;
const LEGACY_COOKIES = ["mai_user", "mai_token"] as const;

export function purgeLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage inaccessible (mode privé, quota) : rien à nettoyer.
  }
  if (typeof document === "undefined") return;
  for (const name of LEGACY_COOKIES) {
    // Expiration dans le passé : le cookie lisible est effacé.
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }
}
