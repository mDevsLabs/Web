/**
 * ============================================================================
 * VIBE — LECTEUR CONVERSATIONS (lib/vibe/server/queries/dms.ts)
 * ============================================================================
 *
 * Réplique de `handleDMConversations` (`vibe-dms-conversations.ts:62-180`) :
 * conversations 1-1 (jointure participants, pseudo/ avatar/ blocage/ non-lus
 * du partenaire) et groupes (membres agrégés, livres reliés), fusionnés au
 * format `DMConversation` du client.
 *
 * Le fil lui-même (`GET /v1/dms/messages/:partner`) et l'envoi restent à
 * l'API : c'est du temps réel, pas du premier écran. Lecture strictement
 * privée — l'identité vient du cookie, aucune ne vient d'un paramètre.
 *
 * `publishScheduledDMs()` du handler n'est PAS reproduite : la publication
 * des DMs programmés appartient au cron `app/api/cron/vibe`.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { columnExists } from "../schema";
import { isoDeep } from "../shape";

function viewerIdOf(identity: VibeIdentity | null): number | null {
  return identity && /^\d+$/.test(String(identity.userId))
    ? Number(identity.userId)
    : null;
}

export async function readConversations(
  identity: VibeIdentity | null
): Promise<{ conversations: any[] } | null> {
  const sql = vibeSql();
  const userId = viewerIdOf(identity);
  if (!sql || userId === null) {
    return null;
  }
  // Colonnes ajoutées paresseusement par `ensureDMTables` : sans elles, la
  // page retombe sur l'API, qui les crée.
  if (!(await columnExists("dm_conversations", "is_group"))) {
    return null;
  }

  try {
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
            AND NOT COALESCE((m.read_by ? ${String(userId)}::text), FALSE)
        ) unread ON TRUE
        WHERE me.user_id = ${userId}
        ORDER BY dm.last_message_at DESC
      `.catch(() => []),
    ]);

    // Livres : métadonnées pour distinguer la conversation de groupe.
    const bookIds = Array.from(
      new Set(
        ((groups || []) as any[])
          .map((g) => g.book_id)
          .filter(Boolean)
          .map(String)
      )
    );
    let bookMeta = new Map<string, any>();
    if (bookIds.length > 0) {
      try {
        const rows =
          await sql`SELECT id, title, icon FROM vibe_books WHERE id = ANY(${bookIds}::uuid[])`;
        bookMeta = new Map((rows as any[]).map((b) => [String(b.id), b]));
      } catch {
        // vibe_books absent : groupes classiques.
      }
    }
    const groupConvs = ((groups || []) as any[]).map((g) => ({
      book_icon: g.book_id
        ? bookMeta.get(String(g.book_id))?.icon || null
        : null,
      book_id: g.book_id ? String(g.book_id) : null,
      book_title: g.book_id
        ? bookMeta.get(String(g.book_id))?.title || g.group_name || null
        : null,
      id: String(g.conversation_id),
      is_admin: Boolean(g.is_admin) && !g.book_id,
      is_book: Boolean(g.book_id),
      is_group: true,
      last_message_at: g.last_message_at,
      last_message_content: g.last_message_preview || "",
      last_message_preview: g.last_message_preview || "",
      members: g.members || [],
      partner_avatar_url: g.group_avatar_url || null,
      partner_display_name: g.group_name || "Groupe",
      partner_id: `group:${g.conversation_id}`,
      partner_username: g.group_name || "Groupe",
      unread_count: Number(g.unread_count || 0),
    }));

    return { conversations: isoDeep([...convs, ...groupConvs]) };
  } catch {
    return null;
  }
}
