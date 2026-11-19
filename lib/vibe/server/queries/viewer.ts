import type { VibeIdentity } from "../identity";

/**
 * Extrait l'identifiant numérique du compte Vibe connecté (viewer).
 */
export function viewerIdOf(identity: VibeIdentity | null): number | null {
  return identity && /^\d+$/.test(String(identity.userId))
    ? Number(identity.userId)
    : null;
}
