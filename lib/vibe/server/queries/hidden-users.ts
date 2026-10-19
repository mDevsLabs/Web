/**
 * ============================================================================
 * VIBE — Auteurs cachés (lib/vibe/server/queries/hidden-users.ts)
 * ============================================================================
 *
 * Réplique serveur de `resolveHiddenUserIds` (`vibe-common.ts:61-86`) : les
 * comptes masqués (mute) et bloqués dans les DEUX sens, exclus de tous les
 * flux. Table absente ou visiteur anonyme ⇒ filtre désactivé, comme le
 * handler.
 */
import "server-only";
import { vibeSql } from "../db";

export async function resolveHiddenUserIds(
  currentUserId: number | null
): Promise<{
  blockedIds: number[];
  mutedIds: number[];
}> {
  const sql = vibeSql();
  if (!sql || !currentUserId) {
    return { blockedIds: [], mutedIds: [] };
  }
  try {
    const [mutedRows, blockedRows] = await Promise.all([
      sql`SELECT muted_user_id FROM muted_users WHERE user_id = ${currentUserId}`,
      sql`
        SELECT blocked_user_id FROM blocked_users WHERE user_id = ${currentUserId}
        UNION
        SELECT user_id FROM blocked_users WHERE blocked_user_id = ${currentUserId}
      `,
    ]);
    return {
      blockedIds: blockedRows
        .map((r: any) => Number(r.blocked_user_id))
        .filter(Boolean),
      mutedIds: mutedRows
        .map((r: any) => Number(r.muted_user_id))
        .filter(Boolean),
    };
  } catch {
    return { blockedIds: [], mutedIds: [] };
  }
}
