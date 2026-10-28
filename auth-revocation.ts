/**
 * Décision de révocation d'un JWT, partagée par le backend Val Town.
 *
 * Deux autorités de révocation coexistent (SQLite Val Town et PostgreSQL).
 * Une seule réponse « révoqué » suffit à refuser ; en revanche, une autorité
 * indisponible ne vaut PAS « non révoqué » : l'état est inconnu et la requête
 * protégée doit être temporairement refusée (503 côté HTTP), jamais acceptée
 * sur la seule signature du jeton.
 *
 * Module volontairement sans import Deno/Next : il est utilisé par config.ts
 * et testé directement par Vitest.
 */

export type RevocationProbeResult = "revoked" | "active" | "unavailable";

export type RevocationState = "revoked" | "active" | "unknown";

/** Une autorité d'authentification n'a pas pu répondre : refus temporaire. */
export class AuthAuthorityUnavailableError extends Error {
  readonly code = "auth_authority_unavailable";

  constructor(message = "État d'authentification indisponible.") {
    super(message);
    this.name = "AuthAuthorityUnavailableError";
  }
}

/** Le compte porté par le jeton est bloqué : refus définitif de la session. */
export class AccountBlockedError extends Error {
  readonly code = "account_blocked";

  constructor(message = "Compte bloqué.") {
    super(message);
    this.name = "AccountBlockedError";
  }
}

export function decideRevocationState(
  results: readonly RevocationProbeResult[]
): RevocationState {
  if (results.includes("revoked")) {
    return "revoked";
  }
  if (results.includes("unavailable")) {
    return "unknown";
  }
  return "active";
}

export async function evaluateRevocationProbes(
  probes: ReadonlyArray<() => Promise<RevocationProbeResult>>
): Promise<RevocationState> {
  const results = await Promise.all(
    probes.map(async (probe) => {
      try {
        return await probe();
      } catch {
        return "unavailable" as const;
      }
    })
  );
  return decideRevocationState(results);
}
