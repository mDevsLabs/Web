/**
 * ============================================================================
 * VIBE — LECTEUR /me (lib/vibe/server/queries/me.ts)
 * ============================================================================
 *
 * Réplique de `handleMe` (`vibe-users.ts:40-133`) : la ligne `users ⨝ profiles`
 * et les deux agrégats de quota (`weekly_usage`, `daily_image_usage`), pipelés
 * en une seule transaction HTTP Neon. Le payload produit est celui de l'API
 * (`buildMePayload`) — les composants ne voient aucune différence.
 *
 * Idée reçue à ne pas reproduire : le backend fait `Number(payload.sub)` ; ici
 * l'identité vient DÉJÀ de la base (canonicalisée par `resolveVibeIdentity`),
 * on ne re-parse aucun JWT.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { buildMePayload, getVibeWeekData } from "../shape";

export type VibeMePayload = ReturnType<typeof buildMePayload>;

export async function readMe(
  identity: VibeIdentity
): Promise<VibeMePayload | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  // users.id est integer en base réelle (sonde 2026-10-10, schema.ts) ; un id
  // non numérique ne peut exister ici — on échoue proprement vers l'API.
  const userId = Number(identity.userId);
  if (!Number.isFinite(userId)) {
    return null;
  }
  const { weekStartStr } = getVibeWeekData();

  const piped = await sql.transaction([
    sql`
      SELECT u.id, u.username, u.email, u.tier, u.avatar_url,
             COALESCE(u.created_at, NOW()) as created_at,
             (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
             pr.display_name, pr.bio, pr.banner_url, pr.website, pr.location, pr.interests, pr.followers_count, pr.following_count, pr.posts_count
      FROM users u
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE u.id = ${userId}
      LIMIT 1
    `,
    sql`SELECT COALESCE(SUM(tokens_used), 0) as tokens FROM weekly_usage WHERE user_id = ${userId} AND week_start = ${weekStartStr}::date`,
    sql`SELECT COALESCE(images_generated, 0) as images FROM daily_image_usage WHERE user_id = ${userId} AND usage_date = CURRENT_DATE`,
  ]);

  const row = piped[0][0];
  if (!row) {
    return null;
  }
  return buildMePayload(row, piped[1][0]?.tokens, piped[2][0]?.images);
}
