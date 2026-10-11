/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — NOTIFICATIONS (vibe-dms-notifications.ts)
 * Liste, lecture, suppression et compteur des notifications utilisateur.
 * Scindé de vibe-dms.ts (limite de taille Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";

export function registerDMNotificationRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 5. NOTIFICATIONS
  const handleNotifications = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const sql = getDb();
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
      return c.json({ notifications: notifs });
    } catch {
      return c.json({ error: "Erreur notifications." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/notifications", "/vibe/notifications", "/v1/notifications"],
    handleNotifications
  );

  const handleMarkNotificationsRead = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      let body: any = {};
      try {
        body = await c.req.json();
      } catch {}

      const rawId = c.req.param?.("id") || body?.id || body?.notification_id;
      const notifId = rawId ? String(rawId).trim() : null;
      const sql = getDb();
      const isReadVal =
        body?.is_read === undefined ? true : Boolean(body.is_read);

      if (
        notifId &&
        notifId !== "all" &&
        notifId !== "undefined" &&
        notifId !== "null" &&
        notifId !== ""
      ) {
        await sql`
          UPDATE notifications
          SET is_read = ${isReadVal}
          WHERE id::text = ${notifId} AND recipient_id = ${userId}
        `;
      } else {
        await sql`
          UPDATE notifications
          SET is_read = ${isReadVal}
          WHERE recipient_id = ${userId}
        `;
      }
      return c.json({ id: notifId, is_read: isReadVal, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Error in handleMarkNotificationsRead:", err);
      return c.json(
        { details: err?.message, error: "Erreur marquage notification." },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/notifications/read",
      "/vibe/notifications/read",
      "/v1/notifications/read",
      "/v1/notifications/:id/read",
      "/api/vibe/notifications/:id/read",
    ],
    handleMarkNotificationsRead
  );
  registerMulti(
    "patch",
    [
      "/api/vibe/notifications/read",
      "/v1/notifications/read",
      "/v1/notifications/:id/read",
      "/api/vibe/notifications/:id/read",
    ],
    handleMarkNotificationsRead
  );

  const handleDeleteNotification = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      let body: any = {};
      try {
        body = await c.req.json();
      } catch {}

      const rawId = c.req.param?.("id") || body?.id || body?.notification_id;
      const notifId = rawId ? String(rawId).trim() : null;
      const sql = getDb();

      if (
        notifId &&
        notifId !== "all" &&
        notifId !== "clear" &&
        notifId !== "undefined" &&
        notifId !== "null" &&
        notifId !== ""
      ) {
        await sql`
          DELETE FROM notifications
          WHERE id::text = ${notifId} AND recipient_id = ${userId}
        `;
      } else {
        await sql`
          DELETE FROM notifications
          WHERE recipient_id = ${userId}
        `;
      }
      return c.json({ deleted_id: notifId || "all", success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Error in handleDeleteNotification:", err);
      return c.json(
        { details: err?.message, error: "Erreur suppression notification." },
        500
      );
    }
  };

  registerMulti(
    "delete",
    [
      "/api/vibe/notifications/:id",
      "/v1/notifications/:id",
      "/api/vibe/notifications",
      "/v1/notifications",
    ],
    handleDeleteNotification
  );
  registerMulti(
    "post",
    [
      "/api/vibe/notifications/:id/delete",
      "/v1/notifications/:id/delete",
      "/api/vibe/notifications/delete",
      "/v1/notifications/delete",
      "/api/vibe/notifications/clear",
      "/v1/notifications/clear",
    ],
    handleDeleteNotification
  );

  // Compteur léger pour les badges — évite de charger toutes les notifications
  const handleUnreadCount = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const sql = getDb();
      const [notifRow] = await sql`
        SELECT COUNT(*)::int AS unread_notifications FROM notifications WHERE recipient_id = ${userId} AND NOT is_read
      `;
      const [dmRow] = await sql`
        SELECT (
          (SELECT COUNT(*) FROM direct_messages
            WHERE recipient_id = ${userId} AND is_read = FALSE) +
          (SELECT COUNT(*) FROM direct_messages m
            JOIN dm_group_members gm ON gm.conversation_id = m.conversation_id AND gm.user_id = ${userId}
            WHERE m.sender_id <> ${userId}
              AND NOT COALESCE((m.read_by ? ${userId}::text), FALSE))
        )::int AS unread_messages
      `;
      return c.json({
        unread_messages: Number(dmRow?.unread_messages || 0),
        unread_notifications: Number(notifRow?.unread_notifications || 0),
      });
    } catch {
      return c.json({ error: "Erreur." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/notifications/unread_count",
      "/vibe/notifications/unread_count",
      "/v1/notifications/unread_count",
    ],
    handleUnreadCount
  );
}
