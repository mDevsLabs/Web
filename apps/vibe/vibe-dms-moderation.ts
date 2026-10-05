/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs : MODÉRATION & GESTION (vibe-dms-moderation.ts)
 * Blocage/déblocage, signalements, renommage, suppression de conversation,
 * suppression et édition de message. Scindé de vibe-dms.ts (limite Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { dmPlainLength, getDmMessageCharLimit, pushToUsers } from "./vibe-dms-core.ts";

export function registerDMModerationRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 4d. BLOCK / UNBLOCK / LIST BLOCKED USERS
  const handleBlock = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const { user_id } = await c.req.json();
      const targetId = Number(user_id);
      if (!targetId || targetId === userId) return c.json({ error: "Utilisateur invalide." }, 400);

      const sql = getDb();
      await sql`
        INSERT INTO blocked_users (user_id, blocked_user_id)
        VALUES (${userId}, ${targetId})
        ON CONFLICT (user_id, blocked_user_id) DO NOTHING
      `;
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Block error:", err);
      return c.json({ error: "Erreur blocage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/block", "/vibe/dms/block", "/v1/dms/block"], handleBlock);

  const handleUnblock = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const { user_id } = await c.req.json();
      const targetId = Number(user_id);
      if (!targetId) return c.json({ error: "Utilisateur invalide." }, 400);

      const sql = getDb();
      await sql`DELETE FROM blocked_users WHERE user_id = ${userId} AND blocked_user_id = ${targetId}`;
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ error: "Erreur déblocage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/unblock", "/vibe/dms/unblock", "/v1/dms/unblock"], handleUnblock);

  const handleListBlocked = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const sql = getDb();
      const rows = await sql`
        SELECT b.id, b.blocked_user_id, b.created_at,
               u.username as blocked_username,
               pr.display_name as blocked_display_name,
               pr.avatar_url as blocked_avatar_url
        FROM blocked_users b
        JOIN users u ON u.id = b.blocked_user_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE b.user_id = ${userId}
        ORDER BY b.created_at DESC
      `;
      return c.json({ blocked: rows });
    } catch (err: any) {
      return c.json({ error: "Erreur liste bloqués." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/dms/blocked", "/vibe/dms/blocked", "/v1/dms/blocked"], handleListBlocked);

  // 4e. REPORT A CONVERSATION / MESSAGE
  const handleReport = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const { reported_user_id, reason, message_id } = await c.req.json();
      const targetId = Number(reported_user_id);
      if (!targetId) return c.json({ error: "Utilisateur à signaler requis." }, 400);

      const sql = getDb();
      await sql`
        INSERT INTO dm_reports (reporter_id, reported_user_id, message_id, reason)
        VALUES (${userId}, ${targetId}, ${message_id || null}, ${String(reason || 'non précisé').slice(0, 500)})
      `;
      return c.json({ success: true, message: "Signalement transmis à la modération." });
    } catch (err: any) {
      console.error("[vibe-dms] Report error:", err);
      return c.json({ error: "Erreur signalement." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/report", "/vibe/dms/report", "/v1/dms/report"], handleReport);

  // 4f. RENAME A CONVERSATION (nom local en 1-à-1, nom du groupe en admin)
  const handleRenameConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const { name } = await c.req.json();
      const customName = String(name || '').trim();

      const sql = getDb();

      // ── Groupe : renommage global réservé à l'administrateur ──
      if (rawKey.startsWith("group:")) {
        const groupId = rawKey.slice(6);
        const groupName = customName.slice(0, 100);
        if (!groupName) return c.json({ error: "Le nom du groupe est requis." }, 400);
        const convRows = await sql`SELECT created_by FROM dm_conversations WHERE id = ${groupId}::uuid AND is_group = TRUE LIMIT 1`;
        if (convRows.length === 0) return c.json({ error: "Groupe introuvable." }, 404);
        if (Number(convRows[0].created_by) !== userId) {
          return c.json({ error: "Seul l'administrateur du groupe peut le renommer." }, 403);
        }
        await sql`UPDATE dm_conversations SET group_name = ${groupName} WHERE id = ${groupId}::uuid`;
        const memberRows = await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid`;
        await pushToUsers((memberRows as any[]).map((r) => Number(r.user_id)), "group_updated", { conversation_id: groupId, action: "renamed" });
        return c.json({ success: true, group_name: groupName });
      }

      const partnerId = Number(rawKey);
      if (!partnerId) return c.json({ error: "Conversation invalide." }, 400);
      const trimmed = customName.slice(0, 50);
      if (!trimmed) {
        await sql`DELETE FROM dm_conv_meta WHERE user_id = ${userId} AND partner_id = ${partnerId}`;
      } else {
        await sql`
          INSERT INTO dm_conv_meta (user_id, partner_id, custom_name)
          VALUES (${userId}, ${partnerId}, ${trimmed})
          ON CONFLICT (user_id, partner_id)
          DO UPDATE SET custom_name = ${trimmed}
        `;
      }
      return c.json({ success: true, custom_name: trimmed || null });
    } catch (err: any) {
      console.error("[vibe-dms] Rename error:", err);
      return c.json({ error: "Erreur renommage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/conversations/:partnerId/rename", "/vibe/dms/conversations/:partnerId/rename", "/v1/dms/conversations/:partnerId/rename"], handleRenameConversation);

  // 4g. DELETE A CONVERSATION (côté compte courant : messages reçus/envoyés + conversation)
  const handleDeleteConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const partnerId = Number(c.req.param("partnerId"));
      if (!partnerId) return c.json({ error: "Partenaire invalide." }, 400);

      const sql = getDb();
      await sql`
        DELETE FROM direct_messages
        WHERE (sender_id = ${userId} AND recipient_id = ${partnerId})
           OR (sender_id = ${partnerId} AND recipient_id = ${userId})
      `;
      await sql`
        DELETE FROM dm_conversations
        WHERE (participant_one_id = ${userId} AND participant_two_id = ${partnerId})
           OR (participant_one_id = ${partnerId} AND participant_two_id = ${userId})
      `;
      await sql`DELETE FROM dm_conv_meta WHERE (user_id = ${userId} AND partner_id = ${partnerId})`;
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Delete conversation error:", err);
      return c.json({ error: "Erreur suppression conversation." }, 500);
    }
  };

  registerMulti("delete", ["/api/vibe/dms/conversations/:partnerId", "/vibe/dms/conversations/:partnerId", "/v1/dms/conversations/:partnerId"], handleDeleteConversation);

  // 4h. DELETE A SINGLE MESSAGE (seulement ses propres messages)
  const handleDeleteMessage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const messageId = c.req.param("messageId");
      if (!messageId) return c.json({ error: "Message invalide." }, 400);

      const sql = getDb();
      const rows = await sql`SELECT sender_id, recipient_id, conversation_id FROM direct_messages WHERE id = ${messageId}::uuid LIMIT 1`;
      if (rows.length === 0) return c.json({ error: "Message introuvable." }, 404);
      if (Number(rows[0].sender_id) !== userId) {
        return c.json({ error: "Vous ne pouvez supprimer que vos propres messages." }, 403);
      }
      const conversationId = rows[0].conversation_id;
      const recipientId = rows[0].recipient_id;
      await sql`DELETE FROM dm_reactions WHERE message_id = ${messageId}::uuid`.catch(() => {});
      await sql`DELETE FROM direct_messages WHERE id = ${messageId}::uuid`;
      // Diffusion temps réel aux autres membres (« supprimé pour tout le monde »)
      try {
        const convInfo = conversationId
          ? await sql`SELECT is_group FROM dm_conversations WHERE id = ${conversationId}::uuid LIMIT 1`
          : [];
        const payload = { id: messageId, conversation_id: conversationId ? String(conversationId) : null };
        if (convInfo[0]?.is_group) {
          const memberRows = await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${conversationId}::uuid`;
          await pushToUsers((memberRows as any[]).map((r) => Number(r.user_id)), "dm_message_deleted", payload, userId);
        } else if (recipientId) {
          await pushRealtimeEvent(Number(recipientId), "dm_message_deleted", payload);
        }
      } catch {}
      return c.json({ success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Delete message error:", err);
      return c.json({ error: "Erreur suppression message." }, 500);
    }
  };

  registerMulti("delete", ["/api/vibe/dms/messages/:messageId", "/vibe/dms/messages/:messageId", "/v1/dms/messages/:messageId"], handleDeleteMessage);

  // 4d. EDIT DM MESSAGE (avec limite de 60 minutes)
  const handleEditMessage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const messageId = c.req.param("messageId");

      if (!messageId) return c.json({ error: "ID du message requis." }, 400);

      const { content } = await c.req.json();
      if (!content || !content.trim()) {
        return c.json({ error: "Le contenu du message ne peut pas être vide." }, 400);
      }
      const sql = getDb();
      const dmCharLimit = await getDmMessageCharLimit(sql, userId);
      if (dmPlainLength(content) > dmCharLimit) {
        return c.json({ error: `Message trop long (${dmCharLimit.toLocaleString("fr-FR")} caractères max).` }, 400);
      }

      const rows = await sql`
        SELECT * FROM direct_messages WHERE id = ${messageId}::uuid LIMIT 1
      `;
      if (rows.length === 0) {
        return c.json({ error: "Message introuvable." }, 404);
      }
      const msg = rows[0];
      if (Number(msg.sender_id) !== userId) {
        return c.json({ error: "Vous ne pouvez modifier que vos propres messages." }, 403);
      }

      // Vérifier la limite de 60 minutes
      const createdAt = new Date(msg.created_at).getTime();
      const now = Date.now();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      if (diffMinutes > 60) {
        return c.json({ error: "Ce message a été envoyé il y a plus de 60 minutes et ne peut plus être modifié." }, 403);
      }

      const updated = await sql`
        UPDATE direct_messages
        SET content = ${content.trim()},
            is_edited = TRUE,
            edited_at = NOW()
        WHERE id = ${messageId}::uuid
        RETURNING *
      `;

      // Mettre à jour l'aperçu dans la conversation
      try {
        await sql`
          UPDATE dm_conversations
          SET last_message_preview = ${stripHtmlTags(String(content)).trim()}
          WHERE id = ${msg.conversation_id}::uuid
        `;
      } catch {}

      // Informer les autres membres en temps réel via SSE (destinataire ou groupe)
      try {
        const convInfo = await sql`SELECT is_group FROM dm_conversations WHERE id = ${msg.conversation_id}::uuid LIMIT 1`;
        if (convInfo[0]?.is_group) {
          const memberRows = await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${msg.conversation_id}::uuid`;
          await pushToUsers(
            (memberRows as any[]).map((r) => Number(r.user_id)),
            "dm_message_edited",
            { ...updated[0], conversation_id: String(msg.conversation_id) },
            userId
          );
        } else if (msg.recipient_id) {
          await pushRealtimeEvent(Number(msg.recipient_id), "dm_message_edited", updated[0]);
        }
      } catch {}

      return c.json({ success: true, message: updated[0] });
    } catch (err: any) {
      console.error("[vibe-dms] Edit message error:", err);
      return c.json({ error: "Erreur lors de la modification du message." }, 500);
    }
  };

  registerMulti("patch", ["/api/vibe/dms/messages/:messageId", "/vibe/dms/messages/:messageId", "/v1/dms/messages/:messageId"], handleEditMessage);
  registerMulti("put", ["/api/vibe/dms/messages/:messageId", "/vibe/dms/messages/:messageId", "/v1/dms/messages/:messageId"], handleEditMessage);
}
