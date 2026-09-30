/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs : CONVERSATIONS & MESSAGES
 * (vibe-dms-conversations.ts)
 * Recherche d'utilisateurs, liste des conversations (1-1 + groupes), lecture
 * et envoi des messages. Scindé de vibe-dms.ts (limite de taille Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { ensureBooksTables } from "./vibe-books.ts";
import { dmPlainLength, getDmMessageCharLimit, ensureDMTables, generateMAIDMReply, publishScheduledDMs, resolveConversationId, fetchPinnedMessages, deriveForwardedFrom, fetchDMAttachedPost, attachDMAttachedPosts } from "./vibe-dms-core.ts";

export function registerDMDirectRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 1. SEARCH USERS FOR DM
  const handleDMUsers = async (c: any) => {
    try {
      const q = (c.req.query("q") || "").trim().toLowerCase();
      if (!q) return c.json({ users: [] });

      const sql = getDb();
      const users = await sql`
        SELECT u.id, u.username, u.tier,
               (COALESCE(u.is_verified, FALSE) OR LOWER(COALESCE(u.tier, '')) IN ('plus', 'pro', 'max')) as is_verified,
               pr.display_name, pr.avatar_url
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE LOWER(u.username) LIKE ('%' || ${q} || '%') OR LOWER(pr.display_name) LIKE ('%' || ${q} || '%')
        LIMIT 10
      `;
      return c.json({ users });
    } catch (err: any) {
      return c.json({ error: "Erreur recherche." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/dms/users", "/vibe/dms/users", "/v1/dms/users"], handleDMUsers);

  // 2. DM CONVERSATIONS
  const handleDMConversations = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      // Conversations 1-1 (schéma participant_one/two) + groupes 019 (via dm_group_members)
      const [convs, groups] = await Promise.all([
        sql`
          SELECT dm.*,
                 CASE WHEN dm.participant_one_id = ${userId} THEN u2.username ELSE u1.username END as partner_username,
                 CASE WHEN dm.participant_one_id = ${userId} THEN pr2.display_name ELSE pr1.display_name END as partner_display_name,
                 CASE WHEN dm.participant_one_id = ${userId} THEN pr2.avatar_url ELSE pr1.avatar_url END as partner_avatar_url,
                 CASE WHEN dm.participant_one_id = ${userId} THEN dm.participant_two_id ELSE dm.participant_one_id END as partner_id,
                 meta.custom_name,
                 (blk.id IS NOT NULL) as is_blocked,
                 COALESCE(unread.count, 0)::int as unread_count
          FROM dm_conversations dm
          JOIN users u1 ON u1.id = dm.participant_one_id
          JOIN users u2 ON u2.id = dm.participant_two_id
          LEFT JOIN profiles pr1 ON pr1.user_id = u1.id
          LEFT JOIN profiles pr2 ON pr2.user_id = u2.id
          LEFT JOIN dm_conv_meta meta
                 ON meta.user_id = ${userId}
                AND meta.partner_id = CASE WHEN dm.participant_one_id = ${userId} THEN dm.participant_two_id ELSE dm.participant_one_id END
          LEFT JOIN blocked_users blk
                 ON blk.user_id = ${userId}
                AND blk.blocked_user_id = CASE WHEN dm.participant_one_id = ${userId} THEN dm.participant_two_id ELSE dm.participant_one_id END
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS count FROM direct_messages m
            WHERE m.conversation_id = dm.id AND m.recipient_id = ${userId} AND m.is_read = FALSE
          ) unread ON TRUE
          WHERE COALESCE(dm.is_group, FALSE) = FALSE
            AND (dm.participant_one_id = ${userId} OR dm.participant_two_id = ${userId})
          ORDER BY dm.last_message_at DESC
        `,
        sql`
          SELECT dm.id as conversation_id,
                 dm.group_name,
                 dm.group_avatar_url,
                 dm.created_by,
                 dm.book_id,
                 dm.last_message_preview,
                 dm.last_message_at,
                 (dm.created_by = ${userId}) as is_admin,
                 COALESCE(unread.count, 0)::int as unread_count,
                 (
                   SELECT JSON_AGG(JSON_BUILD_OBJECT(
                     'user_id', gm.user_id, 'username', gu.username,
                     'display_name', gp.display_name, 'avatar_url', gp.avatar_url,
                     'role', gm.role
                   ) ORDER BY gm.joined_at ASC)
                   FROM dm_group_members gm
                   JOIN users gu ON gu.id = gm.user_id
                   LEFT JOIN profiles gp ON gp.user_id = gm.user_id
                   WHERE gm.conversation_id = dm.id
                 ) as members
          FROM dm_group_members me
          JOIN dm_conversations dm ON dm.id = me.conversation_id
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS count FROM direct_messages m
            WHERE m.conversation_id = dm.id
              AND m.sender_id <> ${userId}
              AND NOT COALESCE((m.read_by ? ${userId}::text), FALSE)
          ) unread ON TRUE
          WHERE me.user_id = ${userId}
          ORDER BY dm.last_message_at DESC
        `,
      ]);
      // Livres : métadonnées (titre, icône) pour distinguer la conversation de groupe
      const bookIds = Array.from(new Set(((groups || []) as any[]).map((g) => g.book_id).filter(Boolean).map(String)));
      let bookMeta = new Map<string, any>();
      if (bookIds.length > 0) {
        try {
          const rows = await sql`SELECT id, title, icon FROM vibe_books WHERE id = ANY(${bookIds}::uuid[])`;
          bookMeta = new Map((rows as any[]).map((b) => [String(b.id), b]));
        } catch {
          // vibe_books absent : conversations affichées comme des groupes classiques
        }
      }
      // Normalisation des groupes au format DMConversation (partner_id = id de conversation)
      const groupConvs = ((groups || []) as any[]).map((g) => ({
        id: String(g.conversation_id),
        partner_id: `group:${g.conversation_id}`,
        partner_username: g.group_name || 'Groupe',
        partner_display_name: g.group_name || 'Groupe',
        partner_avatar_url: g.group_avatar_url || null,
        last_message_preview: g.last_message_preview || '',
        last_message_content: g.last_message_preview || '',
        last_message_at: g.last_message_at,
        unread_count: Number(g.unread_count || 0),
        is_group: true,
        is_admin: Boolean(g.is_admin) && !g.book_id,
        is_book: Boolean(g.book_id),
        book_id: g.book_id ? String(g.book_id) : null,
        book_title: g.book_id ? (bookMeta.get(String(g.book_id))?.title || g.group_name || null) : null,
        book_icon: g.book_id ? (bookMeta.get(String(g.book_id))?.icon || null) : null,
        members: g.members || [],
      }));
      return c.json({ conversations: [...convs, ...groupConvs] });
    } catch (err: any) {
      return c.json({ error: "Erreur conversations." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/dms/conversations", "/vibe/dms/conversations", "/v1/dms/conversations"], handleDMConversations);

  // 3. DM MESSAGES (1-1 et groupes : les groupes utilisent conversationId "group:<uuid>")
  const handleDMMessages = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const isGroupKey = rawKey.startsWith("group:");
      const partnerId = Number(isGroupKey ? rawKey.slice(6) : rawKey);
      const groupId = isGroupKey ? rawKey.slice(6) : null;

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      await publishScheduledDMs().catch(() => {});

      if (isGroupKey) {
        // ── Conversation de GROUPE ──
        if (!groupId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)) {
          return c.json({ error: "Conversation introuvable." }, 404);
        }
        const memberRows = await sql`
          SELECT 1 FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${userId} LIMIT 1
        `;
        if (memberRows.length === 0) return c.json({ error: "Conversation introuvable." }, 404);

        const messages = await sql`
          SELECT m.*, u.username as sender_username,
                 r.content as reply_to_content,
                 ru.username as reply_to_username
          FROM direct_messages m
          JOIN users u ON u.id = m.sender_id
          LEFT JOIN direct_messages r ON r.id = m.reply_to_id
          LEFT JOIN users ru ON ru.id = r.sender_id
          WHERE m.conversation_id = ${groupId}::uuid
            AND NOT EXISTS (SELECT 1 FROM dm_hidden_messages h WHERE h.message_id = m.id AND h.user_id = ${userId})
          ORDER BY m.created_at ASC
          LIMIT 200
        `;
        // Un nouveau membre récupère tout l'historique : aucune restriction de date.

        try {
          const msgIds = messages.map((m: any) => m.id);
          if (msgIds.length > 0) {
            const reactions = await sql`
              SELECT message_id, emoji, user_id FROM dm_reactions
              WHERE message_id = ANY(${msgIds}::uuid[])
            `;
            const byMsg = new Map<string, { emoji: string; user_id: number }[]>();
            for (const r of reactions) {
              const key = String(r.message_id);
              if (!byMsg.has(key)) byMsg.set(key, []);
              byMsg.get(key)!.push({ emoji: r.emoji, user_id: Number(r.user_id) });
            }
            for (const m of messages) {
              const list = byMsg.get(String(m.id)) || [];
              const grouped: { emoji: string; count: number; mine: boolean }[] = [];
              for (const r of list) {
                const g = grouped.find((x) => x.emoji === r.emoji);
                if (g) {
                  g.count += 1;
                  g.mine = g.mine || r.user_id === userId;
                } else {
                  grouped.push({ emoji: r.emoji, count: 1, mine: r.user_id === userId });
                }
              }
              m.reactions = grouped;
            }
          }
        } catch {}

        // Publications jointes (conversations de Livre) : carte cliquable côté client
        await attachDMAttachedPosts(sql, messages);

        // Marquer comme lu : ajoute mon id dans read_by des messages des autres
        try {
          const unreadRows = messages.filter(
            (m: any) => Number(m.sender_id) !== userId && !((m.read_by || []) as string[]).map(String).includes(String(userId))
          );
          for (const m of unreadRows as any[]) {
            const readers = Array.isArray(m.read_by) ? m.read_by.map(String) : [];
            readers.push(String(userId));
            await sql`UPDATE direct_messages SET read_by = ${JSON.stringify(readers)}::jsonb WHERE id = ${m.id}::uuid`;
          }
        } catch {}

        return c.json({ messages, pinned_messages: await fetchPinnedMessages(sql, groupId!, userId) });
      }

      // ── Conversation 1-1 (flux historique) ──
      const messages = await sql`
        SELECT m.*, u.username as sender_username,
               r.content as reply_to_content,
               ru.username as reply_to_username
        FROM direct_messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN direct_messages r ON r.id = m.reply_to_id
        LEFT JOIN users ru ON ru.id = r.sender_id
        WHERE ((m.sender_id = ${userId} AND m.recipient_id = ${partnerId})
           OR (m.sender_id = ${partnerId} AND m.recipient_id = ${userId}))
          AND NOT EXISTS (SELECT 1 FROM dm_hidden_messages h WHERE h.message_id = m.id AND h.user_id = ${userId})
        ORDER BY m.created_at ASC
        LIMIT 100
      `;

      // Réactions emoji (table dm_reactions — ignorée silencieusement si absente)
      try {
        const msgIds = messages.map((m: any) => m.id);
        if (msgIds.length > 0) {
          const reactions = await sql`
            SELECT message_id, emoji, user_id FROM dm_reactions
            WHERE message_id = ANY(${msgIds}::uuid[])
          `;
          const byMsg = new Map<string, { emoji: string; user_id: number }[]>();
          for (const r of reactions) {
            const key = String(r.message_id);
            if (!byMsg.has(key)) byMsg.set(key, []);
            byMsg.get(key)!.push({ emoji: r.emoji, user_id: Number(r.user_id) });
          }
          for (const m of messages) {
            const list = byMsg.get(String(m.id)) || [];
            const grouped: { emoji: string; count: number; mine: boolean }[] = [];
            for (const r of list) {
              const g = grouped.find((x) => x.emoji === r.emoji);
              if (g) {
                g.count += 1;
                g.mine = g.mine || r.user_id === userId;
              } else {
                grouped.push({ emoji: r.emoji, count: 1, mine: r.user_id === userId });
              }
            }
            m.reactions = grouped;
          }
        }
      } catch {}

      await sql`
        UPDATE direct_messages SET is_read = TRUE, read_at = NOW()
        WHERE recipient_id = ${userId} AND sender_id = ${partnerId} AND is_read = FALSE
        AND (status IS NULL OR status = 'sent')
      `;
      // Messages épinglés de la conversation (aperçus, max 3, masqués exclus)
      let pinned_messages: any[] = [];
      try {
        const conversationId = await resolveConversationId(sql, userId, partnerId);
        if (conversationId) {
          pinned_messages = await fetchPinnedMessages(sql, conversationId, userId);
        }
      } catch {}
      return c.json({ messages, pinned_messages });
    } catch (err: any) {
      return c.json({ error: "Erreur messages." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/dms/messages/:partnerId", "/vibe/dms/messages/:partnerId", "/v1/dms/messages/:partnerId"], handleDMMessages);

  // 4. SEND DM (1-1 ou groupe)
  const handleSendDM = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const { recipient_id, content, reply_to_id, send_at, conversation_id, forwarded_from, attached_post_id } = await c.req.json();

      // ── GROUPE : conversation_id "group:<uuid>" → diffusion à tous les membres ──
      if (typeof conversation_id === "string" && conversation_id.startsWith("group:")) {
        const groupId = conversation_id.slice(6);
        if (!content || !content.trim()) return c.json({ error: "Contenu requis." }, 400);
        if (send_at) return c.json({ error: "La programmation d'envoi n'est pas disponible dans les groupes." }, 400);
        const sql = getDb();
        await ensureDMTables().catch(() => {});
        const dmCharLimit = await getDmMessageCharLimit(sql, userId);
        if (dmPlainLength(content) > dmCharLimit) return c.json({ error: `Message trop long (${dmCharLimit.toLocaleString("fr-FR")} caractères max).` }, 400);
        const memberRows = await sql`
          SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid
        `;
        const memberIds = (memberRows as any[]).map((r) => Number(r.user_id));
        if (!memberIds.includes(userId)) return c.json({ error: "Conversation introuvable." }, 404);

        // Conversation de Livre ? (book_id non nul → publication jointe autorisée)
        const convRows = await sql`
          SELECT book_id, group_name FROM dm_conversations WHERE id = ${groupId}::uuid LIMIT 1
        `.catch(() => []);
        const bookId = convRows[0]?.book_id ? String(convRows[0].book_id) : null;
        const convName = String(convRows[0]?.group_name || "Groupe");

        // Publication jointe (carte cliquable) : réservée aux conversations de Livre,
        // et le post doit appartenir au Livre concerné.
        let validAttachedPostId: string | null = null;
        const rawAttached = typeof attached_post_id === "string" ? attached_post_id : "";
        if (rawAttached) {
          if (!bookId) {
            return c.json({ error: "Les publications jointes ne sont disponibles que dans les conversations de Livre." }, 400);
          }
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawAttached)) {
            return c.json({ error: "Publication invalide." }, 400);
          }
          await ensureBooksTables(sql).catch(() => {});
          const okPost = await sql`
            SELECT 1 FROM vibe_book_items WHERE book_id = ${bookId}::uuid AND post_id = ${rawAttached}::uuid LIMIT 1
          `.catch(() => []);
          if (okPost.length === 0) return c.json({ error: "Cette publication ne fait pas partie du Livre." }, 400);
          validAttachedPostId = rawAttached;
        }

        // Réponse à un message du même groupe (validation d'appartenance)
        let validReplyTo: string | null = null;
        let replyPreview: { reply_to_content: string; reply_to_username: string } | null = null;
        if (typeof reply_to_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reply_to_id)) {
          const rRows = await sql`
            SELECT r.content AS reply_to_content, u.username AS reply_to_username
            FROM direct_messages r JOIN users u ON u.id = r.sender_id
            WHERE r.id = ${reply_to_id}::uuid AND r.conversation_id = ${groupId}::uuid
            LIMIT 1
          `;
          if (rRows.length > 0) {
            validReplyTo = reply_to_id;
            replyPreview = { reply_to_content: String(rRows[0].reply_to_content), reply_to_username: String(rRows[0].reply_to_username) };
          }
        }

        // Transfert : l'auteur d'origine est re-dérivé depuis la base (anti-usurpation)
        const forwardedFrom = await deriveForwardedFrom(sql, forwarded_from);

        // Extraction des mentions : @tous (urgent, tout le groupe) + @username urgents
        const plain = stripHtmlTags(String(content));
        const mentionMatches = Array.from(new Set(plain.match(/@([a-zA-Z0-9_]{1,30})/g) || [])).map((m: string) => m.slice(1));
        const isUrgentAll = mentionMatches.some((m) => m.toLowerCase() === "tous");
        const memberUsernames = memberIds.length
          ? await sql`SELECT id, username FROM users WHERE id = ANY(${memberIds})`
          : [];
        const urgentUsernames = isUrgentAll
          ? []
          : memberUsernames.filter((u: any) => mentionMatches.some((m) => m.toLowerCase() === String(u.username).toLowerCase()));

        const msg = await sql`
          INSERT INTO direct_messages (conversation_id, sender_id, content, mentions, urgent_mentions, reply_to_id, forwarded_from, attached_post_id)
          VALUES (${groupId}::uuid, ${userId}, ${content.trim()}, ${JSON.stringify(mentionMatches)}::jsonb, ${JSON.stringify(isUrgentAll ? ["tous"] : urgentUsernames.map((u: any) => u.username))}::jsonb, ${validReplyTo}, ${forwardedFrom ? JSON.stringify(forwardedFrom) : null}::jsonb, ${validAttachedPostId})
          RETURNING *
        `;
        await sql`
          UPDATE dm_conversations SET last_message_preview = ${stripHtmlTags(String(content)).trim().slice(0, 120)}, last_message_at = NOW()
          WHERE id = ${groupId}::uuid
        `;
        // Infos de la publication jointe (diffusées aux membres pour la carte cliquable)
        const attachedPost = validAttachedPostId ? await fetchDMAttachedPost(sql, validAttachedPostId) : null;
        // Notification : urgente pour @tous / @user, normale sinon (hors expéditeur)
        const senderInfo = await sql`
          SELECT u.username, p.display_name FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ${userId} LIMIT 1
        `;
        for (const mid of memberIds) {
          if (mid === userId) continue;
          const mentioned = isUrgentAll || urgentUsernames.some((u: any) => Number(u.id) === mid);
          const notifType = mentioned ? 'mention' : 'dm';
          const notifMsg = isUrgentAll
            ? '🚨 vous a mentionné (urgent @tous) dans le groupe'
            : mentioned
            ? '🚨 vous a mentionné en urgence dans le groupe'
            : bookId
            ? `a envoyé un message dans le Livre « ${convName} »`
            : 'a envoyé un message dans le groupe';
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, message)
            VALUES (${mid}, ${userId}, ${notifType}, ${notifMsg})
          `.catch(() => {});
          try {
            await pushRealtimeEvent(mid, "dm_message", {
              ...msg[0],
              ...(replyPreview || {}),
              sender_username: senderInfo[0]?.username || null,
              sender_display_name: senderInfo[0]?.display_name || null,
              conversation_id: groupId,
              attached_post: attachedPost,
            });
          } catch {}
        }
        return c.json({ success: true, message: { ...msg[0], attached_post: attachedPost } }, 201);
      }

      const recId = Number(recipient_id);

      if (!recId || !content || !content.trim()) {
        return c.json({ error: "Destinataire et contenu requis." }, 400);
      }
      if (recId === userId) {
        return c.json({ error: "Impossible de s'envoyer un message à soi-même." }, 400);
      }

      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const dmCharLimit = await getDmMessageCharLimit(sql, userId);
      if (dmPlainLength(content) > dmCharLimit) {
        return c.json({ error: `Message trop long (${dmCharLimit.toLocaleString("fr-FR")} caractères max).` }, 400);
      }

      // Envoi programmé : date future → status 'scheduled', pas de SSE immédiat
      let scheduledAt: string | null = null;
      if (send_at) {
        const ts = Date.parse(String(send_at));
        if (Number.isNaN(ts) || ts <= Date.now()) {
          return c.json({ error: "Date d'envoi invalide ou passée." }, 400);
        }
        scheduledAt = new Date(ts).toISOString();
      }

      // Blocage : impossible d'envoyer si l'un des deux a bloqué l'autre
      const blockCheck = await sql`
        SELECT 1 FROM blocked_users
        WHERE (user_id = ${userId} AND blocked_user_id = ${recId})
           OR (user_id = ${recId} AND blocked_user_id = ${userId})
        LIMIT 1
      `;
      if (blockCheck.length > 0) {
        return c.json({ error: "Impossible d'envoyer un message : utilisateur bloqué." }, 403);
      }

      // Vérifier les paramètres de messages du destinataire
      let recipientSettings: any[] = [];
      try {
        recipientSettings = await sql`
          SELECT allow_dms, dms_enabled
          FROM user_settings
          WHERE user_id = ${recId}
          LIMIT 1
        `;
      } catch (settingsErr) {
        console.warn("[vibe-dms] Note: user_settings check skipped or table incomplete:", settingsErr);
      }

      if (recipientSettings.length > 0) {
        const s = recipientSettings[0];
        const dmPolicy = s.allow_dms || 'everyone';
        const dmsEnabled = s.dms_enabled !== false;
        if (!dmsEnabled || dmPolicy === 'nobody') {
          return c.json({ error: "Cet utilisateur n'accepte pas les messages privés." }, 403);
        }
        if (dmPolicy === 'following') {
          const isFollowing = await sql`
            SELECT 1 FROM follows WHERE follower_id = ${recId} AND following_id = ${userId} LIMIT 1
          `;
          if (isFollowing.length === 0) {
            return c.json({ error: "Cet utilisateur n'accepte les messages que de ses abonnements." }, 403);
          }
        }
      }

      const p1 = userId < recId ? userId : recId;
      const p2 = userId < recId ? recId : userId;

      const convRows = await sql`
        INSERT INTO dm_conversations (participant_one_id, participant_two_id, last_message_preview, last_message_at)
        VALUES (${p1}, ${p2}, ${stripHtmlTags(String(content)).trim()}, NOW())
        ON CONFLICT (participant_one_id, participant_two_id)
        DO UPDATE SET last_message_preview = ${stripHtmlTags(String(content)).trim()}, last_message_at = NOW()
        RETURNING id
      `;

      const conversationId = convRows[0].id;
      const validReplyTo = typeof reply_to_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reply_to_id) ? reply_to_id : null;
      const forwardedFrom = await deriveForwardedFrom(sql, forwarded_from);
      const msg = scheduledAt ? await sql`
        INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, content, reply_to_id, status, send_at, forwarded_from)
        VALUES (${conversationId}::uuid, ${userId}, ${recId}, ${content.trim()}, ${validReplyTo}, 'scheduled', ${scheduledAt}::timestamptz, ${forwardedFrom ? JSON.stringify(forwardedFrom) : null}::jsonb)
        RETURNING *
      ` : await sql`
        INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, content, reply_to_id, forwarded_from)
        VALUES (${conversationId}::uuid, ${userId}, ${recId}, ${content.trim()}, ${validReplyTo}, ${forwardedFrom ? JSON.stringify(forwardedFrom) : null}::jsonb)
        RETURNING *
      `;

      // Message programmé : réponse immédiate, pas de notification ni SSE
      if (scheduledAt) {
        return c.json({ success: true, message: msg[0], scheduled: true }, 201);
      }

      try {
        await sql`
          INSERT INTO notifications (recipient_id, actor_id, type, message)
          VALUES (${recId}, ${userId}, 'dm', 'vous a envoyé un message')
        `;
      } catch {}

      // Temps réel : pousse le message au destinataire (flux SSE)
      try {
        const senderInfo = await sql`
          SELECT u.username, p.display_name, p.avatar_url
          FROM users u LEFT JOIN profiles p ON p.user_id = u.id
          WHERE u.id = ${userId} LIMIT 1
        `;
        await pushRealtimeEvent(recId, "dm_message", {
          ...msg[0],
          sender_username: senderInfo[0]?.username || null,
          sender_display_name: senderInfo[0]?.display_name || null,
          sender_avatar_url: senderInfo[0]?.avatar_url || null,
        });
      } catch (rtErr) {
        console.warn("[vibe-dms] realtime dm_message push failed:", rtErr);
      }

      // Réponse automatique pour le compte @bot de test
      const recipientUser = await sql`SELECT username FROM users WHERE id = ${recId} LIMIT 1`;
      if (recipientUser.length > 0 && recipientUser[0].username === 'bot') {
        setTimeout(async () => {
          try {
            const botMsg = await sql`
              INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, content)
              VALUES (${conversationId}::uuid, ${recId}, ${userId}, 'Bot')
              RETURNING *
            `;
            await sql`
              UPDATE dm_conversations SET last_message_preview = 'Bot', last_message_at = NOW()
              WHERE id = ${conversationId}::uuid
            `;
            await pushRealtimeEvent(userId, "dm_message", botMsg[0] || { conversation_id: conversationId, sender_id: recId, recipient_id: userId, content: 'Bot' });
          } catch {}
        }, 100);
      }

      // Réponse automatique du compte officiel mAI (conversation avec historique,
      // usage hebdomadaire débité à l'expéditeur)
      if (recipientUser.length > 0 && recipientUser[0].username === 'mai') {
        const maiUserId = recId;
        const senderMessage = String(content).trim().slice(0, 4000);
        setTimeout(async () => {
          try {
            await generateMAIDMReply(sql, conversationId, userId, maiUserId, senderMessage);
          } catch (maiErr) {
            console.warn("[vibe-dms] mAI DM reply failed:", maiErr);
          }
        }, 1200 + Math.floor(Math.random() * 1800));
      }

      return c.json({ success: true, message: msg[0] }, 201);
    } catch (err: any) {
      console.error("[vibe-dms] Error in handleSendDM:", err);
      return c.json({ error: err.message || "Erreur envoi message." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/messages", "/vibe/dms/messages", "/v1/dms/messages"], handleSendDM);
}
