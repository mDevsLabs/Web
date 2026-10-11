/**
 * ============================================================================
 * VIBE — IDENTITÉ DES LECTEURS SERVEUR (lib/vibe/server/identity.ts)
 * ============================================================================
 *
 * Pourquoi : une RSC qui lit la base Vibe doit dériver l'identité du cookie de
 * session hôte — jamais d'une prop, d'un query string ou du JWT stocké côté
 * client. `getMaiUser()` peut retomber sur l'email quand le jeton ne porte ni
 * `id` ni `sub` (`lib/auth/session.ts:213-217`) : une valeur contenant « @ »
 * n'est donc JAMAIS comparée à `users.id`, elle ne sert qu'à retrouver la
 * ligne par email.
 *
 * Le `id::text` renvoyé est la clé étrangère de toutes les tables Vibe
 * (integer en base réelle, cf. sondes de `schema.ts`) ; les requêtes
 * l'utilisent avec le cast sondé, jamais `Number(sub)` brut comme le backend.
 */
import "server-only";
import { cache } from "react";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { vibeSql } from "./db";
import { isUserIdForCast, userIdCast } from "./schema";

export type VibeIdentity = {
  tier: string;
  /** `users.id` canonique, en texte (transparable avec le cast sondé). */
  userId: string;
  username: string;
};

async function resolveVibeIdentityOnce(): Promise<VibeIdentity | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const token = await getMaiSessionToken();
  if (!token) {
    return null;
  }
  // getMaiUser applique sa propre vérification (signature locale, sinon
  // arbitrage de l'API qui a émis le jeton) — on ne redécide rien ici.
  const user = await getMaiUser(token);
  if (!user) {
    return null;
  }
  const rawId = String(user.id || "");
  const email = String(user.email || "")
    .trim()
    .toLowerCase();
  if (!rawId && !email) {
    return null;
  }
  try {
    const cast = await userIdCast();
    if (cast === "bigint" && isUserIdForCast(rawId, "bigint")) {
      const rows = await sql`
        SELECT id::text AS id, username, tier FROM users
        WHERE id = ${Number(rawId)} OR (LOWER(email) = ${email} AND ${email} <> '')
        LIMIT 1
      `;
      return fromRow(rows[0]);
    }
    if (cast === "uuid" && isUserIdForCast(rawId, "uuid")) {
      const rows = await sql`
        SELECT id::text AS id, username, tier FROM users
        WHERE id = ${rawId}::uuid OR (LOWER(email) = ${email} AND ${email} <> '')
        LIMIT 1
      `;
      return fromRow(rows[0]);
    }
    const rows = await sql`
      SELECT id::text AS id, username, tier FROM users
      WHERE id::text = ${rawId} OR (LOWER(email) = ${email} AND ${email} <> '')
      LIMIT 1
    `;
    return fromRow(rows[0]);
  } catch (err) {
    // Échec de résolution ⇒ pas d'hydratation, la page garde son chemin API.
    console.warn("[vibe-server] résolution d'identité impossible:", err);
    return null;
  }
}

function fromRow(row: any): VibeIdentity | null {
  if (!row) {
    return null;
  }
  return {
    tier: String(row.tier || "Free"),
    userId: String(row.id),
    username: String(row.username || ""),
  };
}

/**
 * Identité Vibe dérivée du cookie de session, mémoïsée par requête
 * (`React.cache`) : une page qui fait trois lectures ne paie la résolution
 * qu'une fois. Chaque lecteur l'appelle lui-même ; ne jamais lui faire
 * confiance depuis des props.
 */
export const resolveVibeIdentity = cache(resolveVibeIdentityOnce);
