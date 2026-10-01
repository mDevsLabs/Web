/**
 * Lecture structurelle d'un jeton de session — SANS vérification de signature.
 *
 * Pourquoi ce module existe : deux points de l'application ne peuvent pas
 * vérifier la signature du jeton (le middleware est le premier à s'exécuter et
 * son secret de session lui est étranger ; l'interface n'a que le cookie). Or
 * la simple PRÉSENCE d'un cookie n'est pas une session : un jeton expiré ou
 * laissé par un autre environnement est un cookie mort.
 *
 * Conséquence observée avant ce module : un jeton expiré suffisait à faire
 * renvoyer `/login` vers `/`. L'utilisateur entrait dans une application sans
 * session — historique vide, API en 401, aucun menu utilisateur, donc aucune
 * déconnexion possible — et ne pouvait plus atteindre l'écran de connexion.
 *
 * Ce que ce module ne fait PAS, et ne doit jamais faire : décider qu'un
 * jeton est authentifié. Il répond à une seule question — « ce cookie
 * ressemble-t-il à une session encore en cours de vie ? ». La décision
 * d'authentification appartient à `lib/auth/session.ts` (signature + expiration)
 * puis, en cas de refus local, à l'API qui a émis le jeton.
 */

/** Décode une charge utile JWT en base64url, sans dépendance externe. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [header, payload] = token.split(".");
  if (!header || !payload) {
    return null;
  }
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const claims = JSON.parse(
      atob(base64.padEnd(base64.length + padding, "="))
    );
    return typeof claims === "object" && claims !== null
      ? (claims as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Un jeton est « vivant » s'il porte une expiration encore à venir. Un jeton
 * sans `exp` est traité comme mort : une session sans durée ne peut pas être
 * révoquée.
 */
export function isLiveSessionToken(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }
  const claims = decodeJwtPayload(token);
  return typeof claims?.exp === "number" && claims.exp * 1000 > Date.now();
}
