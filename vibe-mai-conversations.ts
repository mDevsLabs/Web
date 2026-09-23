/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : CONVERSATIONS (vibe-mai-conversations.ts)
 * Historique persisté, nouvelle discussion, liste, renommage, suppression et
 * duplication des conversations mAI. Scindé de vibe-mai.ts (limite de taille
 * Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import {
  ensureMAIConversations,
  getOrCreateConversation,
  resolveOwnedConversation,
  UUID_RE,
} from "./vibe-mai-core.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";

export function registerVibeMAIConversationRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 1ter. HISTORIQUE DE LA CONVERSATION mAI (persistance serveur, multi-conversations)
  const handleMAIHistory = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const requested = c.req.query("conversation_id") || "";
      const limit = Math.min(
        1000,
        Math.max(1, Number(c.req.query("limit") || 50))
      );
      const offset = Math.max(0, Number(c.req.query("offset") || 0));

      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, requested);
      if (conv.invalid)
        return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId =
        conv.id || (await getOrCreateConversation(sql, userId));
      if (!conversationId)
        return c.json({ conversation_id: null, has_more: false, messages: [] });

      const rows = await sql`
        SELECT id, sender_role, content, tool_calls, created_at FROM mai_messages
        WHERE conversation_id = ${conversationId}::uuid AND content IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `.catch(() => []);

      const messages = rows
        .filter((r: any) => String(r.content || "").trim())
        .reverse()
        .map((r: any) => ({
          content: String(r.content),
          created_at: r.created_at,
          id: String(r.id),
          role: r.sender_role === "assistant" ? "assistant" : "user",
          tool_calls: Array.isArray(r.tool_calls) ? r.tool_calls : [],
        }));

      return c.json({
        conversation_id: conversationId,
        has_more: rows.length === limit,
        messages,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI History Error:", err);
      return c.json({ conversation_id: null, messages: [] });
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/mai/history", "/vibe/mai/history", "/v1/mai/history"],
    handleMAIHistory
  );

  // 1quater. NOUVELLE CONVERSATION mAI
  const handleMAINewConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const sql = getDb();
      await ensureMAIConversations();
      const created = await sql`
        INSERT INTO mai_conversations (user_id, title) VALUES (${userId}, 'Discussion mAI') RETURNING id
      `;
      return c.json({ conversation_id: created[0]?.id || null, success: true });
    } catch (err: any) {
      console.error("[Vibe API] mAI New Conversation Error:", err);
      return c.json({ error: "Erreur création conversation." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/mai/history/new",
      "/vibe/mai/history/new",
      "/v1/mai/history/new",
    ],
    handleMAINewConversation
  );

  // 1quater-bis. LISTE DES CONVERSATIONS mAI (multi-conversations, page Studio)
  const handleMAIConversationsList = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();
      await ensureMAIConversations();
      const rows = await sql`
        SELECT c.id, c.title, c.model_id, c.is_pinned, c.created_at, c.updated_at,
               (SELECT COUNT(*)::int FROM mai_messages m WHERE m.conversation_id = c.id) AS message_count,
               (SELECT m2.content FROM mai_messages m2
                 WHERE m2.conversation_id = c.id AND m2.content IS NOT NULL
                 ORDER BY m2.created_at DESC LIMIT 1) AS last_message
        FROM mai_conversations c
        WHERE c.user_id = ${userId}
        ORDER BY c.updated_at DESC NULLS LAST
        LIMIT 100
      `.catch(() => []);
      return c.json({
        conversations: (rows as any[]).map((r) => ({
          created_at: r.created_at,
          id: String(r.id),
          is_pinned: Boolean(r.is_pinned),
          message_count: Number(r.message_count || 0),
          preview: stripHtmlTags(String(r.last_message || ""))
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 120),
          title: String(r.title || "Discussion mAI"),
          updated_at: r.updated_at,
        })),
        success: true,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Conversations List Error:", err);
      return c.json({ error: "Erreur conversations mAI." }, 500);
    }
  };
  registerMulti(
    "get",
    [
      "/api/vibe/mai/conversations",
      "/vibe/mai/conversations",
      "/v1/mai/conversations",
    ],
    handleMAIConversationsList
  );

  // Création via la même route que « Nouvelle discussion »
  registerMulti(
    "post",
    [
      "/api/vibe/mai/conversations",
      "/vibe/mai/conversations",
      "/v1/mai/conversations",
    ],
    handleMAINewConversation
  );

  // 1quater-ter. RENOMMER UNE CONVERSATION mAI
  const handleMAIRenameConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const id = String(c.req.param("conversationId") || "");
      if (!UUID_RE.test(id))
        return c.json({ error: "Conversation introuvable." }, 404);
      const body = await c.req.json().catch(() => ({}) as any);
      const clean = String(body?.title || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
      if (!clean) return c.json({ error: "Titre requis." }, 400);

      const sql = getDb();
      await ensureMAIConversations();
      const updated = await sql`
        UPDATE mai_conversations SET title = ${clean}
        WHERE id = ${id}::uuid AND user_id = ${userId}
        RETURNING id, title
      `.catch(() => []);
      if (updated.length === 0)
        return c.json({ error: "Conversation introuvable." }, 404);
      return c.json({
        conversation: {
          id: String(updated[0].id),
          title: String(updated[0].title),
        },
        success: true,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Rename Conversation Error:", err);
      return c.json({ error: "Erreur renommage conversation." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/mai/conversations/:conversationId/rename",
      "/vibe/mai/conversations/:conversationId/rename",
      "/v1/mai/conversations/:conversationId/rename",
    ],
    handleMAIRenameConversation
  );

  // 1quater-quater. SUPPRIMER UNE CONVERSATION mAI (messages en cascade)
  const handleMAIDeleteConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const id = String(c.req.param("conversationId") || "");
      if (!UUID_RE.test(id))
        return c.json({ error: "Conversation introuvable." }, 404);

      const sql = getDb();
      await ensureMAIConversations();
      const deleted = await sql`
        DELETE FROM mai_conversations WHERE id = ${id}::uuid AND user_id = ${userId} RETURNING id
      `.catch(() => []);
      if (deleted.length === 0)
        return c.json({ error: "Conversation introuvable." }, 404);
      return c.json({ deleted: String(deleted[0].id), success: true });
    } catch (err: any) {
      console.error("[Vibe API] mAI Delete Conversation Error:", err);
      return c.json({ error: "Erreur suppression conversation." }, 500);
    }
  };
  registerMulti(
    "delete",
    [
      "/api/vibe/mai/conversations/:conversationId",
      "/vibe/mai/conversations/:conversationId",
      "/v1/mai/conversations/:conversationId",
    ],
    handleMAIDeleteConversation
  );

  // 1quater-quinquies. DUPLIQUER UNE CONVERSATION mAI (messages copiés)
  const handleMAIDuplicateConversation = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const id = String(c.req.param("conversationId") || "");
      if (!UUID_RE.test(id))
        return c.json({ error: "Conversation introuvable." }, 404);

      const sql = getDb();
      await ensureMAIConversations();
      const src = await sql`
        SELECT title, model_id, system_prompt FROM mai_conversations
        WHERE id = ${id}::uuid AND user_id = ${userId} LIMIT 1
      `.catch(() => []);
      if (src.length === 0)
        return c.json({ error: "Conversation introuvable." }, 404);

      const baseTitle = String(src[0].title || "Discussion mAI").slice(0, 100);
      const created = await sql`
        INSERT INTO mai_conversations (user_id, title, model_id, system_prompt)
        VALUES (${userId}, ${`${baseTitle} (copie)`}, ${src[0].model_id || null}, ${src[0].system_prompt || null})
        RETURNING id
      `;
      const newId = String(created[0].id);
      await sql`
        INSERT INTO mai_messages (conversation_id, sender_role, content, tool_calls, created_at)
        SELECT ${newId}::uuid, sender_role, content, tool_calls, created_at
        FROM mai_messages WHERE conversation_id = ${id}::uuid ORDER BY created_at ASC
      `.catch(() => {});
      return c.json({ conversation_id: newId, success: true });
    } catch (err: any) {
      console.error("[Vibe API] mAI Duplicate Conversation Error:", err);
      return c.json({ error: "Erreur duplication conversation." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/mai/conversations/:conversationId/duplicate",
      "/vibe/mai/conversations/:conversationId/duplicate",
      "/v1/mai/conversations/:conversationId/duplicate",
    ],
    handleMAIDuplicateConversation
  );
}
