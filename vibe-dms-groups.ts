/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs : GROUPES (vibe-dms-groups.ts)
 * Création/gestion des groupes, masquage local des messages et traductions
 * mémorisées. Scindé de vibe-dms.ts (limite de taille Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import {
  assertMessageAccess,
  ensureDMTables,
  pushToUsers,
} from "./vibe-dms-core.ts";

export function registerDMGroupRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // ═════════════════════════════════════════════════════════════
  // 5. CONVERSATIONS DE GROUPE (migration 019, admin unique = créateur)
  // ═════════════════════════════════════════════════════════════

  /** Crée un groupe : { name, member_ids: number[] } — le créateur devient admin. */
  const handleCreateGroup = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const { name, member_ids } = await c.req.json();
      const groupName =
        String(name || "Nouveau groupe")
          .trim()
          .slice(0, 100) || "Nouveau groupe";
      const memberIds = Array.isArray(member_ids)
        ? Array.from(
            new Set(
              member_ids
                .map((x: any) => Number(x))
                .filter((n: number) => n && n !== userId)
            )
          ).slice(0, 49)
        : [];
      if (memberIds.length === 0)
        return c.json({ error: "Au moins un membre est requis." }, 400);

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const conv = await sql`
        INSERT INTO dm_conversations (participant_one_id, participant_two_id, is_group, group_name, created_by, last_message_preview, last_message_at)
        VALUES (${userId}, NULL, TRUE, ${groupName}, ${userId}, 'Groupe créé', NOW())
        RETURNING id
      `;
      const conversationId = String(conv[0].id);
      const allMembers = [userId, ...memberIds];
      for (const mid of allMembers) {
        await sql`
          INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
          VALUES (${conversationId}::uuid, ${mid}, ${mid === userId ? "admin" : "member"}, ${userId})
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;
        if (mid !== userId) {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, message)
            VALUES (${mid}, ${userId}, 'dm', ${`vous a ajouté au groupe « ${groupName} »`})
          `.catch(() => {});
          try {
            await pushRealtimeEvent(mid, "group_updated", {
              action: "added",
              conversation_id: conversationId,
            });
          } catch {}
        }
      }
      return c.json(
        {
          conversation_id: conversationId,
          member_count: allMembers.length,
          name: groupName,
          success: true,
        },
        201
      );
    } catch (err: any) {
      console.error("[vibe-dms] createGroup error:", err);
      return c.json({ error: "Erreur création groupe." }, 500);
    }
  };
  registerMulti(
    "post",
    ["/api/vibe/dms/groups", "/vibe/dms/groups", "/v1/dms/groups"],
    handleCreateGroup
  );

  /** Ajoute des membres (admin uniquement) — les ajoutés récupèrent tout l'historique. */
  const handleAddGroupMembers = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");
      const { member_ids } = await c.req.json();
      const memberIds = Array.isArray(member_ids)
        ? Array.from(
            new Set(member_ids.map((x: any) => Number(x)).filter(Boolean))
          ).slice(0, 49)
        : [];
      if (memberIds.length === 0)
        return c.json({ error: "Aucun membre à ajouter." }, 400);

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const convRows =
        await sql`SELECT is_group, group_name, created_by FROM dm_conversations WHERE id = ${groupId}::uuid LIMIT 1`;
      const conv = convRows[0];
      if (!conv || !conv.is_group)
        return c.json({ error: "Groupe introuvable." }, 404);
      if (Number(conv.created_by) !== userId)
        return c.json(
          {
            error: "Seul l'administrateur du groupe peut ajouter des membres.",
          },
          403
        );

      const groupName = String(conv.group_name || "Groupe");
      let added = 0;
      for (const mid of memberIds) {
        const res = await sql`
          INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
          VALUES (${groupId}::uuid, ${mid}, 'member', ${userId})
          ON CONFLICT (conversation_id, user_id) DO NOTHING
          RETURNING id
        `;
        if (res.length > 0) {
          added += 1;
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, message)
            VALUES (${mid}, ${userId}, 'dm', ${`vous a ajouté au groupe « ${groupName} »`})
          `.catch(() => {});
          // Le nouveau membre récupère tout l'historique : aucun filtrage nécessaire.
          try {
            await pushRealtimeEvent(mid, "group_updated", {
              action: "added",
              conversation_id: groupId,
            });
          } catch {}
        }
      }
      return c.json({ added, history_shared: true, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] addGroupMembers error:", err);
      return c.json({ error: "Erreur ajout membres." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/dms/groups/:groupId/members",
      "/vibe/dms/groups/:groupId/members",
      "/v1/dms/groups/:groupId/members",
    ],
    handleAddGroupMembers
  );

  /** Retire un membre (admin uniquement) ou quitte le groupe soi-même. */
  const handleRemoveGroupMember = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");
      const targetId = Number(c.req.param("userId"));

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const convRows =
        await sql`SELECT created_by FROM dm_conversations WHERE id = ${groupId}::uuid LIMIT 1`;
      if (convRows.length === 0)
        return c.json({ error: "Groupe introuvable." }, 404);
      const isAdmin = Number(convRows[0].created_by) === userId;
      // Soit l'admin retire quelqu'un, soit chacun se retire lui-même
      if (!isAdmin && targetId !== userId)
        return c.json(
          { error: "Seul l'administrateur peut retirer un membre." },
          403
        );
      if (targetId === Number(convRows[0].created_by))
        return c.json(
          { error: "L'administrateur ne peut pas quitter son propre groupe." },
          400
        );

      await sql`DELETE FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${targetId}`;
      try {
        await pushRealtimeEvent(targetId, "group_updated", {
          action: "removed",
          conversation_id: groupId,
        });
      } catch {}
      return c.json({ removed: targetId, success: true });
    } catch (err: any) {
      return c.json({ error: "Erreur retrait membre." }, 500);
    }
  };
  registerMulti(
    "delete",
    [
      "/api/vibe/dms/groups/:groupId/members/:userId",
      "/vibe/dms/groups/:groupId/members/:userId",
      "/v1/dms/groups/:groupId/members/:userId",
    ],
    handleRemoveGroupMember
  );

  /** Détails du groupe (nom, membres) pour l'affichage + gestion. */
  const handleGetGroup = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");
      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const rows = await sql`
        SELECT dm.id, dm.group_name, dm.group_avatar_url, dm.created_by, dm.last_message_at,
               (dm.created_by = ${userId}) as is_admin
        FROM dm_conversations dm
        JOIN dm_group_members gm ON gm.conversation_id = dm.id AND gm.user_id = ${userId}
        WHERE dm.id = ${groupId}::uuid
        LIMIT 1
      `;
      if (rows.length === 0)
        return c.json({ error: "Groupe introuvable." }, 404);
      const members = await sql`
        SELECT gm.user_id, gm.role, gm.joined_at, u.username,
               pr.display_name, pr.avatar_url
        FROM dm_group_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN profiles pr ON pr.user_id = gm.user_id
        WHERE gm.conversation_id = ${groupId}::uuid
        ORDER BY gm.joined_at ASC
      `;
      return c.json({ group: { ...rows[0], members } });
    } catch (err: any) {
      return c.json({ error: "Erreur détails groupe." }, 500);
    }
  };
  registerMulti(
    "get",
    [
      "/api/vibe/dms/groups/:groupId",
      "/vibe/dms/groups/:groupId",
      "/v1/dms/groups/:groupId",
    ],
    handleGetGroup
  );

  // 6. MASQUER UN MESSAGE (« supprimer pour moi », sans toucher aux autres membres)
  const handleHideMessage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const messageId = String(c.req.param("messageId") || "");
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          messageId
        )
      ) {
        return c.json({ error: "Message invalide." }, 400);
      }
      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const access = await assertMessageAccess(sql, userId, messageId);
      if (!access.ok)
        return c.json({ error: access.error }, access.code as any);
      await sql`
        INSERT INTO dm_hidden_messages (user_id, message_id)
        VALUES (${userId}, ${messageId}::uuid)
        ON CONFLICT (user_id, message_id) DO NOTHING
      `;
      return c.json({ hidden: true, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] Hide message error:", err);
      return c.json({ error: "Erreur masquage message." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/dms/messages/:messageId/hide",
      "/vibe/dms/messages/:messageId/hide",
      "/v1/dms/messages/:messageId/hide",
    ],
    handleHideMessage
  );

  // 7. TRADUCTION MÉMORISÉE D'UN MESSAGE (max 3 langues conservées)
  const handleSaveTranslation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const messageId = String(c.req.param("messageId") || "");
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          messageId
        )
      ) {
        return c.json({ error: "Message invalide." }, 400);
      }
      const { lang, text, detected } = await c.req.json().catch(() => ({}));
      const cleanLang = String(lang || "")
        .trim()
        .toLowerCase()
        .slice(0, 12);
      const cleanText = String(text || "")
        .trim()
        .slice(0, 5000);
      if (!cleanLang || !cleanText)
        return c.json({ error: "Langue et texte requis." }, 400);
      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const access = await assertMessageAccess(sql, userId, messageId);
      if (!access.ok)
        return c.json({ error: access.error }, access.code as any);

      const rows =
        await sql`SELECT translations FROM direct_messages WHERE id = ${messageId}::uuid LIMIT 1`;
      const current: Record<string, any> =
        rows[0]?.translations && typeof rows[0].translations === "object"
          ? { ...rows[0].translations }
          : {};
      current[cleanLang] = {
        at: new Date().toISOString(),
        detected: detected ? String(detected).slice(0, 12) : null,
        text: cleanText,
      };
      // Conserver au maximum les 3 langues les plus récentes
      const keys = Object.keys(current);
      if (keys.length > 3) {
        keys
          .sort(
            (a, b) =>
              Date.parse(current[a]?.at || 0) - Date.parse(current[b]?.at || 0)
          )
          .slice(0, keys.length - 3)
          .forEach((k) => delete current[k]);
      }
      await sql`UPDATE direct_messages SET translations = ${JSON.stringify(current)}::jsonb WHERE id = ${messageId}::uuid`;
      return c.json({ success: true, translations: current });
    } catch (err: any) {
      console.error("[vibe-dms] Save translation error:", err);
      return c.json({ error: "Erreur enregistrement traduction." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/dms/messages/:messageId/translations",
      "/vibe/dms/messages/:messageId/translations",
      "/v1/dms/messages/:messageId/translations",
    ],
    handleSaveTranslation
  );

  // 8. MISE À JOUR DU GROUPE (admin : nom et/ou avatar)
  const handleUpdateGroup = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");
      const { name, avatar_url } = await c.req.json().catch(() => ({}));

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const convRows =
        await sql`SELECT created_by, group_name, group_avatar_url FROM dm_conversations WHERE id = ${groupId}::uuid AND is_group = TRUE LIMIT 1`;
      if (convRows.length === 0)
        return c.json({ error: "Groupe introuvable." }, 404);
      if (Number(convRows[0].created_by) !== userId) {
        return c.json(
          { error: "Seul l'administrateur du groupe peut le modifier." },
          403
        );
      }

      if (name !== undefined) {
        const groupName = String(name).trim().slice(0, 100);
        if (!groupName)
          return c.json({ error: "Le nom du groupe est requis." }, 400);
        await sql`UPDATE dm_conversations SET group_name = ${groupName} WHERE id = ${groupId}::uuid`;
      }
      if (avatar_url !== undefined) {
        const url =
          avatar_url === null
            ? null
            : String(avatar_url).trim().slice(0, 1000) || null;
        await sql`UPDATE dm_conversations SET group_avatar_url = ${url} WHERE id = ${groupId}::uuid`;
      }

      const memberRows =
        await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid`;
      await pushToUsers(
        (memberRows as any[]).map((r) => Number(r.user_id)),
        "group_updated",
        { action: "updated", conversation_id: groupId }
      );
      const updated =
        await sql`SELECT group_name, group_avatar_url FROM dm_conversations WHERE id = ${groupId}::uuid LIMIT 1`;
      return c.json({ group: updated[0] || null, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] updateGroup error:", err);
      return c.json({ error: "Erreur mise à jour groupe." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/dms/groups/:groupId",
      "/vibe/dms/groups/:groupId",
      "/v1/dms/groups/:groupId",
    ],
    handleUpdateGroup
  );

  // 9. SUPPRESSION DU GROUPE (admin)
  const handleDeleteGroup = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const convRows =
        await sql`SELECT created_by FROM dm_conversations WHERE id = ${groupId}::uuid AND is_group = TRUE LIMIT 1`;
      if (convRows.length === 0)
        return c.json({ error: "Groupe introuvable." }, 404);
      if (Number(convRows[0].created_by) !== userId) {
        return c.json(
          { error: "Seul l'administrateur du groupe peut le supprimer." },
          403
        );
      }

      const memberRows =
        await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid`;
      const memberIds = (memberRows as any[]).map((r) => Number(r.user_id));
      await sql`DELETE FROM dm_reactions WHERE message_id IN (SELECT id FROM direct_messages WHERE conversation_id = ${groupId}::uuid)`.catch(
        () => {}
      );
      await sql`DELETE FROM direct_messages WHERE conversation_id = ${groupId}::uuid`;
      await sql`DELETE FROM dm_conversations WHERE id = ${groupId}::uuid`;
      await pushToUsers(memberIds, "group_updated", {
        action: "deleted",
        conversation_id: groupId,
      });
      return c.json({ deleted: groupId, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] deleteGroup error:", err);
      return c.json({ error: "Erreur suppression groupe." }, 500);
    }
  };
  registerMulti(
    "delete",
    [
      "/api/vibe/dms/groups/:groupId",
      "/vibe/dms/groups/:groupId",
      "/v1/dms/groups/:groupId",
    ],
    handleDeleteGroup
  );

  // 10. TRANSFERT D'ADMINISTRATION DU GROUPE (admin → membre)
  const handleTransferGroupAdmin = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const groupId = c.req.param("groupId");
      const targetId = Number(c.req.param("userId"));
      if (!targetId || targetId === userId)
        return c.json({ error: "Cible invalide." }, 400);

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const convRows =
        await sql`SELECT created_by FROM dm_conversations WHERE id = ${groupId}::uuid AND is_group = TRUE LIMIT 1`;
      if (convRows.length === 0)
        return c.json({ error: "Groupe introuvable." }, 404);
      if (Number(convRows[0].created_by) !== userId) {
        return c.json(
          { error: "Seul l'administrateur peut transférer son rôle." },
          403
        );
      }
      const targetMember = await sql`
        SELECT 1 FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${targetId} LIMIT 1
      `;
      if (targetMember.length === 0)
        return c.json(
          { error: "Ce membre ne fait pas partie du groupe." },
          404
        );

      await sql`UPDATE dm_group_members SET role = 'member' WHERE conversation_id = ${groupId}::uuid AND user_id = ${userId}`;
      await sql`UPDATE dm_group_members SET role = 'admin' WHERE conversation_id = ${groupId}::uuid AND user_id = ${targetId}`;
      await sql`UPDATE dm_conversations SET created_by = ${targetId} WHERE id = ${groupId}::uuid`;

      const memberRows =
        await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid`;
      await pushToUsers(
        (memberRows as any[]).map((r) => Number(r.user_id)),
        "group_updated",
        { action: "admin_transferred", conversation_id: groupId }
      );
      return c.json({ new_admin: targetId, success: true });
    } catch (err: any) {
      console.error("[vibe-dms] transferGroupAdmin error:", err);
      return c.json({ error: "Erreur transfert administration." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/dms/groups/:groupId/members/:userId/transfer-admin",
      "/vibe/dms/groups/:groupId/members/:userId/transfer-admin",
      "/v1/dms/groups/:groupId/members/:userId/transfer-admin",
    ],
    handleTransferGroupAdmin
  );
}
