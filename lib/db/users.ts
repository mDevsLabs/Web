import "server-only";

import { type CanonicalTier, parseCanonicalTier } from "@/lib/auth/plan";

// Lecture du forfait persisté : la table users est la SOURCE DE VÉRITÉ de
// l'abonnement. Aucune décision d'accès (Agent, quotas, limites de durée) ne
// doit reposer sur un tier déduit du JWT, d'un cookie ou d'une valeur client.
//
// users.id est l'identifiant canonique (uuid). Les colonnes username/email ne
// servent qu'aux jetons legacy dont le `sub` n'est pas un uuid : un users.id
// correspondant reste prioritaire et n'est jamais confondu avec un email.

export type PersistedTierResult =
  | { ok: true; tier: CanonicalTier }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

// users.id (texte tel que porté par la session) -> tier canonique persisté.
type TierCacheEntry = {
  expiresAt: number;
  tier: CanonicalTier;
};

const tierCache = new Map<string, TierCacheEntry>();
const TIER_CACHE_TTL_MS = 60_000; // 1 minute : équilibre fraîcheur / charge SQL
const TIER_CACHE_MAX_ENTRIES = 10_000; // garde-fou mémoire par instance

function cacheKey(userId: string): string {
  return userId.trim().toLowerCase();
}

export function invalidatePersistedTier(userId: string): void {
  tierCache.delete(cacheKey(userId));
}

// Invalidation globale : mutation de forfait échappant au cache (admin, script).
export function clearPersistedTierCache(): void {
  tierCache.clear();
}

type TierRow = { id: string | null; tier: string | null };

// Une seule lecture SQL, ordonnée par priorité d'identité (id d'abord). Les
// alias email/username ne sont consultés que si aucun users.id ne correspond.
// La comparaison email/username est insensible à la casse : le backend mAI
// normalise les siennes en minuscules, mais les jetons legacy peuvent porter
// l'identité avec une casse différente.
const TIER_LOOKUP_SQL = `
  SELECT id::text AS id, tier
  FROM users
  WHERE id::text = $1::text
     OR (email IS NOT NULL AND LOWER(email) = LOWER($1::text))
     OR (username IS NOT NULL AND LOWER(username) = LOWER($1::text))
  ORDER BY
    (id::text = $1::text) DESC,
    (email IS NOT NULL AND LOWER(email) = LOWER($1::text)) DESC,
    (username IS NOT NULL AND LOWER(username) = LOWER($1::text)) DESC
  LIMIT 1
`;

async function queryPersistedTier(userId: string): Promise<TierRow | null> {
  // Import paresseux : réutilise l'init paresseux et l'attente de migrations du
  // module de requêtes existant (même pattern que lib/db/agent-queries.ts).
  const { dbReady, getRawClient } = await import("./queries");
  await dbReady();
  const client = getRawClient();
  if (!client) {
    throw new Error("Postgres client indisponible.");
  }
  // unsafe() : SQL paramétré natif — le paramètre $1 ne peut pas altérer la
  // requête (injection impossible, mêmes garanties que les tags template).
  const rows = (await client.unsafe(TIER_LOOKUP_SQL, [userId])) as TierRow[];
  return rows[0] ?? null;
}

export async function getPersistedTier(params: {
  userId: string | null | undefined;
}): Promise<PersistedTierResult> {
  const userId = params.userId?.trim();
  if (!userId) {
    return { ok: false, reason: "missing" };
  }

  const key = cacheKey(userId);
  const cached = tierCache.get(key);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return { ok: true, tier: cached.tier };
  }

  let row: TierRow | null;
  try {
    row = await queryPersistedTier(userId);
  } catch (error) {
    // Base injoignable : échec ferme, pas de repli sur une autre source (le
    // JWT pourrait contenir un tier obsolète). Log serveur uniquement.
    console.error(
      "[persisted-tier] Lecture users.tier impossible, accès refusé :",
      error instanceof Error ? error.message : error
    );
    return { ok: false, reason: "unavailable" };
  }

  if (!row) {
    return { ok: false, reason: "missing" };
  }

  const tier = parseCanonicalTier(row.tier);
  if (!tier) {
    // Tier absent ou valeur inconnue : refus explicite, jamais de privilège.
    return { ok: false, reason: "invalid" };
  }

  if (tierCache.size >= TIER_CACHE_MAX_ENTRIES) {
    tierCache.clear();
  }
  tierCache.set(key, { expiresAt: now + TIER_CACHE_TTL_MS, tier });
  return { ok: true, tier };
}
