/**
 * ============================================================================
 * VIBE — LECTEURS NOTIFICATIONS (lib/vibe/server/queries/notifications.ts)
 * ============================================================================
 *
 * Réplique de `handleUnreadCount` (`vibe-dms-notifications.ts:193-221`) :
 * compteurs de notifications non lues + messages directs non lus (1-1 et
 * groupes via `dm_group_members`/`read_by` jsonb). Le lot 5 ajoutera la liste
 * complète (`readNotifications`), qui reproduira les exclusions block/mute du
 * handler.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { isoDeep } from "../shape";

export type VibeUnreadCounts = {
  unread_messages: number;
  unread_notifications: number;
};

/**
 * Réplique de `handleNotifications` (`vibe-dms-notifications.ts:18-48`) : les
 * 100 derniers événements du destinataire, acteur joint, en excluant
 * blocages (dans les deux sens) et masquages. Authentifié uniquement — sans
 * jeton le handler répond 401 et le client affiche son écran de connexion.
 */
export async function readNotifications(
  identity: VibeIdentity
): Promise<{ notifications: any[] } | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const userId = Number(identity.userId);
  if (!Number.isFinite(userId)) {
    return null;
  }
  try {
    const notifs = await sql`
      SELECT n.*,
             u.username as actor_username,
             COALESCE(u.avatar_url, pr.avatar_url) as actor_avatar_url,
             COALESCE(pr.display_name, u.username) as actor_display_name,
             (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as actor_verified
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE n.recipient_id = ${userId}
        AND (n.actor_id IS NULL OR (
          n.actor_id NOT IN (SELECT COALESCE(blocked_user_id, -1) FROM blocked_users WHERE user_id = ${userId})
          AND n.actor_id NOT IN (SELECT COALESCE(user_id, -1) FROM blocked_users WHERE blocked_user_id = ${userId})
          AND n.actor_id NOT IN (SELECT COALESCE(muted_user_id, -1) FROM muted_users WHERE user_id = ${userId})
        ))
      ORDER BY n.created_at DESC
      LIMIT 100
    `;
    return { notifications: isoDeep(notifs) };
  } catch {
    return null;
  }
}

export async function readUnreadCounts(
  identity: VibeIdentity
): Promise<VibeUnreadCounts | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const userId = Number(identity.userId);
  if (!Number.isFinite(userId)) {
    return null;
  }

  const piped = await sql.transaction([
    sql`
      SELECT COUNT(*)::int AS unread_notifications FROM notifications
      WHERE recipient_id = ${userId} AND NOT is_read
    `,
    sql`
      SELECT (
        (SELECT COUNT(*) FROM direct_messages
          WHERE recipient_id = ${userId} AND is_read = FALSE) +
        (SELECT COUNT(*) FROM direct_messages m
          JOIN dm_group_members gm ON gm.conversation_id = m.conversation_id AND gm.user_id = ${userId}
          WHERE m.sender_id <> ${userId}
            AND NOT COALESCE((m.read_by ? ${String(userId)}::text), FALSE))
      )::int AS unread_messages
    `,
  ]);

  const notifRow = piped[0][0];
  const dmRow = piped[1][0];
  if (!notifRow || !dmRow) {
    return null;
  }
  return {
    unread_messages: Number(dmRow.unread_messages || 0),
    unread_notifications: Number(notifRow.unread_notifications || 0),
  };
}
