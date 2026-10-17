/**
 * ============================================================================
 * VIBE — LECTEUR CERCLE (lib/vibe/server/queries/circle.ts)
 * ============================================================================
 *
 * Réplique LECTURE SEULE de `handleGetCircle` (`vibe-circle.ts:74-99`). Le
 * handler créait le cercle par défaut s'il manquait (`getOrCreateUserCircle`,
 * un INSERT dans un GET) ; ici, absence de cercle ⇒ graine `null` et l'API le
 * crée au premier appel — la réparation appartient au backend, pas au lecteur.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { tableExists } from "../schema";
import { isoDeep } from "../shape";

export async function readCircle(
  identity: VibeIdentity
): Promise<{ circle: any; members: any[] } | null> {
  const sql = vibeSql();
  const userId = /^\d+$/.test(String(identity.userId))
    ? Number(identity.userId)
    : null;
  if (!sql || userId === null) {
    return null;
  }
  if (
    !(await tableExists("user_circles")) ||
    !(await tableExists("circle_members"))
  ) {
    return null;
  }
  try {
    const circleRows = await sql`
      SELECT * FROM user_circles WHERE user_id = ${userId} LIMIT 1
    `;
    if (circleRows.length === 0) {
      return null;
    }
    const members = await sql`
      SELECT u.id, u.username, u.is_verified, u.tier,
             p.display_name, p.avatar_url, cm.created_at AS added_at
      FROM circle_members cm
      JOIN users u ON u.id = cm.member_user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE cm.user_id = ${userId}
      ORDER BY cm.created_at DESC
      LIMIT 500
    `;
    return { circle: isoDeep(circleRows[0]), members: isoDeep(members) };
  } catch {
    return null;
  }
}
