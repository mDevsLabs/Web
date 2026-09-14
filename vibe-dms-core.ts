/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs : SOCLE PARTAGÉ (vibe-dms-core.ts)
 * Tables DM (ensureDMTables), compte officiel mAI, helpers SSE et requêtes
 * communes aux routes DMs. Scindé de vibe-dms.ts (limite de taille Val Town).
 * ============================================================================
 */

import {
  getDb,
  getTierMaiTokenLimit,
  getUserQuotaBoost,
  getWeekData,
  isPaidTier,
} from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";

/** Longueurs maximales d'un message privé (texte brut, HTML décompté) par forfait. */
export const DM_MESSAGE_CHARS_FREE = 3000;
export const DM_MESSAGE_CHARS_PAID = 10_000;
export const dmPlainLength = (content: unknown): number =>
  stripHtmlTags(String(content ?? "")).length;

/** Limite du compte : 10 000 caractères pour Plus/Pro/Max, 3 000 sinon. */
export const getDmMessageCharLimit = async (
  sql: any,
  userId: number
): Promise<number> => {
  try {
    const rows = await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
    return isPaidTier(rows[0]?.tier)
      ? DM_MESSAGE_CHARS_PAID
      : DM_MESSAGE_CHARS_FREE;
  } catch {
    return DM_MESSAGE_CHARS_FREE;
  }
};

/**
 * Crée les tables de modération DM si besoin (idempotent, exécuté une fois).
 * — blocked_users : relations de blocage
 * — dm_reports    : signalements
 * — dm_conv_meta  : métadonnées locales par utilisateur (renommage conversation)
 * — dm_reactions  : réactions emoji + colonne reply_to_id (réponses)
 */
let dmTablesReady = false;
export async function ensureDMTables() {
  if (dmTablesReady) return;
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT NOT NULL,
        blocked_user_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, blocked_user_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS muted_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT NOT NULL,
        muted_user_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, muted_user_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS dm_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id BIGINT NOT NULL,
        reported_user_id BIGINT,
        message_id UUID,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS dm_conv_meta (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT NOT NULL,
        partner_id BIGINT NOT NULL,
        custom_name TEXT,
        UNIQUE (user_id, partner_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS dm_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL,
        user_id BIGINT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (message_id, user_id, emoji)
      )
    `;
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`.catch(
      () => {}
    );
    // Messages de groupe (migration 019) : conversations multi-participants
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE`.catch(
      () => {}
    );
    // Les groupes utilisent participant_two_id = NULL (plusieurs groupes par compte
    // malgré UNIQUE(participant_one_id, participant_two_id) — les NULL sont distincts)
    await sql`ALTER TABLE dm_conversations ALTER COLUMN participant_two_id DROP NOT NULL`.catch(
      () => {}
    );
    // Les messages de groupe n'ont pas de destinataire unique (lecture via read_by)
    await sql`ALTER TABLE direct_messages ALTER COLUMN recipient_id DROP NOT NULL`.catch(
      () => {}
    );
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS group_name VARCHAR(100)`.catch(
      () => {}
    );
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS group_avatar_url TEXT`.catch(
      () => {}
    );
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS created_by BIGINT`.catch(
      () => {}
    );
    await sql`
      CREATE TABLE IF NOT EXISTS dm_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        added_by BIGINT,
        UNIQUE (conversation_id, user_id)
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_group_members_conv ON dm_group_members(conversation_id)`.catch(
      () => {}
    );
    await sql`CREATE INDEX IF NOT EXISTS idx_group_members_user ON dm_group_members(user_id)`.catch(
      () => {}
    );
    // Mentions urgentes (@tous / @utilisateur) + lecture multi-membres (groupes)
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS urgent_mentions JSONB DEFAULT '[]'`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'`.catch(
      () => {}
    );
    // Messages programmés (même mécanique que les posts planifiés)
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent'`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS send_at TIMESTAMPTZ`.catch(
      () => {}
    );
    await sql`UPDATE direct_messages SET status = 'sent' WHERE status IS NULL`.catch(
      () => {}
    );
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_scheduled ON direct_messages(status, send_at) WHERE status = 'scheduled'`.catch(
      () => {}
    );
    // Traduction mémorisée, transfert (attribution) et masquage local (« pour moi »)
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'`.catch(
      () => {}
    );
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS forwarded_from JSONB`.catch(
      () => {}
    );
    await sql`
      CREATE TABLE IF NOT EXISTS dm_hidden_messages (
        user_id BIGINT NOT NULL,
        message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, message_id)
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_hidden_user ON dm_hidden_messages(user_id)`.catch(
      () => {}
    );
    // Messages épinglés (max 3 par conversation, visibles des deux participants)
    await sql`
      CREATE TABLE IF NOT EXISTS dm_pinned_messages (
        conversation_id UUID NOT NULL,
        message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        pinned_by BIGINT NOT NULL,
        pinned_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (conversation_id, message_id)
      )
    `.catch(() => {});
    // Conversations de Livre (chantier « Livres dans Messages ») : rattachement
    // d'une conversation de groupe à un Livre. Pas de FK : vibe_books peut ne
    // pas encore exister au démarrage.
    await sql`ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS book_id UUID`.catch(
      () => {}
    );
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_conversations_book ON dm_conversations(book_id) WHERE book_id IS NOT NULL`.catch(
      () => {}
    );
    // Publication jointe à un message (carte cliquable dans les conversations de Livre)
    await sql`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attached_post_id UUID`.catch(
      () => {}
    );
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_attached_post ON direct_messages(attached_post_id) WHERE attached_post_id IS NOT NULL`.catch(
      () => {}
    );
    dmTablesReady = true;
  } catch (err) {
    console.warn("[vibe-dms] ensureDMTables skipped:", (err as any)?.message);
  }
}

/**
 * Compte officiel mAI (pseudo-utilisateur) : répond automatiquement aux DMs.
 * Seed idempotent — même pattern que la migration 005 du compte @bot.
 */
let maiAccountReady = false;
export async function ensureMAIAccount() {
  if (maiAccountReady) return;
  try {
    const sql = getDb();
    await sql`
      INSERT INTO users (username, email, password_hash, tier, avatar_url, is_verified)
      VALUES (
        'mai',
        'mai@vibe.ai',
        '$2a$10$mAIvibeOfficialAccountNoLoginAllowedxxxxxxxxxxxxxxxxxxxx',
        'Max',
        'https://api.dicebear.com/7.x/bottts/svg?seed=mai-vibe',
        TRUE
      )
      ON CONFLICT (username) DO UPDATE
      SET is_verified = TRUE,
          tier = 'Max',
          avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=mai-vibe'
    `;
    await sql`
      INSERT INTO profiles (user_id, display_name, bio, avatar_url, is_verified)
      SELECT id, 'mAI', 'L''intelligence artificielle officielle de Vibe. Écrivez-moi en message privé : je réponds à toutes vos questions. ✨', 'https://api.dicebear.com/7.x/bottts/svg?seed=mai-vibe', TRUE
      FROM users WHERE username = 'mai'
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = 'mAI',
        bio = 'L''intelligence artificielle officielle de Vibe. Écrivez-moi en message privé : je réponds à toutes vos questions. ✨',
        avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=mai-vibe',
        is_verified = TRUE
    `;
    await sql`
      INSERT INTO user_settings (user_id, allow_dms)
      SELECT id, 'everyone' FROM users WHERE username = 'mai'
      ON CONFLICT (user_id) DO NOTHING
    `;
    maiAccountReady = true;
  } catch (err) {
    console.warn("[vibe-dms] ensureMAIAccount skipped:", (err as any)?.message);
  }
}

/** Identifiant du compte système @mai (auteur des réponses IA), ou null. */
export async function getMAIUserId(sql: any): Promise<number | null> {
  try {
    const rows =
      await sql`SELECT id FROM users WHERE LOWER(username) = 'mai' LIMIT 1`;
    return rows.length > 0 ? Number(rows[0].id) : null;
  } catch {
    return null;
  }
}

/**
 * Réponse automatique du compte mAI à un DM : génère une réponse avec
 * OpenRouter en tenant compte de l'historique de la conversation, puis
 * débite l'usage hebdomadaire de l'expéditeur.
 */
export async function generateMAIDMReply(
  sql: any,
  conversationId: string,
  senderId: number,
  maiUserId: number,
  senderMessage: string
) {
  try {
    // Historique de la conversation DM (contexte complet pour mAI)
    const historyRows = await sql`
      SELECT m.content, m.sender_id, u.username as sender_username
      FROM direct_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ${conversationId}::uuid
      ORDER BY m.created_at DESC
      LIMIT 40
    `.catch(() => []);
    const transcript = historyRows
      .reverse()
      .map(
        (m: any) =>
          `${m.sender_id === maiUserId ? "mAI" : `@${m.sender_username}`}: ${m.content}`
      )
      .join("\n");

    // Quota hebdomadaire mAI de l'expéditeur
    const { weekStartStr } = getWeekData();
    const [usageRow, senderRow] = await Promise.all([
      sql`SELECT tokens_used FROM weekly_usage WHERE user_id = ${senderId} AND week_start = ${weekStartStr}::date LIMIT 1`.catch(
        () => []
      ),
      sql`SELECT tier FROM users WHERE id = ${senderId} LIMIT 1`.catch(
        () => []
      ),
    ]);
    const maiBoost = await getUserQuotaBoost(sql, String(senderId), "mai");
    const tokenLimit = getTierMaiTokenLimit(senderRow[0]?.tier) + maiBoost;
    const currentUsage = Number(usageRow[0]?.tokens_used || 0);

    let reply: string;
    if (currentUsage >= tokenLimit) {
      reply =
        "⚠️ Votre quota hebdomadaire mAI est atteint. Il se réinitialise lundi — ou passez à un forfait supérieur pour discuter davantage avec moi.";
    } else {
      const keyRows = await sql`
        SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${senderId}::text LIMIT 1
      `.catch(() => []);
      const openRouterApiKey =
        (typeof (globalThis as any).Deno !== "undefined" &&
          (globalThis as any).Deno.env?.get("OPENROUTER_API_KEY")) ||
        (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) ||
        (keyRows.length > 0 ? keyRows[0].api_key : "");

      const systemPrompt =
        "Tu es mAI, l'intelligence artificielle officielle du réseau social Vibe. Tu réponds aux messages privés des utilisateurs comme un vrai interlocuteur : bienveillant, concis et utile. " +
        "Tu réponds en français avec quelques émojis. Tu connais tout l'historique de la conversation : poursuis naturellement l'échange sans redemander des informations déjà données. " +
        "Ne fais AUCUNE évaluation de sécurité, n'écris JAMAIS 'User Safety: safe' ni aucun méta-commentaire.";

      const userPrompt =
        (transcript.trim()
          ? `Historique de la conversation :\n${transcript}\n\n`
          : "Nouvelle conversation.\n\n") +
        `L'utilisateur vient d'envoyer : « ${senderMessage} »\n\nRéponds UNIQUEMENT avec le texte de ta réponse en DM.`;

      reply = "";
      if (openRouterApiKey) {
        const candidateModels = [
          "poolside/laguna-xs-2.1:free",
          "minimax/minimax-m2.7:free",
          "liquid/lfm-2.5-2.6b:free",
          "nvidia/nemotron-3.5-lightning:free",
        ];
        for (const modelToTry of candidateModels) {
          try {
            const aiRes = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                body: JSON.stringify({
                  messages: [
                    { content: systemPrompt, role: "system" },
                    { content: userPrompt, role: "user" },
                  ],
                  model: modelToTry,
                }),
                headers: {
                  Authorization: `Bearer ${openRouterApiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": "https://mai.val.run",
                  "X-Title": "mAI Social Assistant",
                },
                method: "POST",
              }
            );
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const text = aiData.choices?.[0]?.message?.content;
              if (text && typeof text === "string" && text.trim()) {
                reply = text
                  .replace(/User Safety:\s*safe\.?/gi, "")
                  .replace(/^User Safety:[^\n]*\n*/gi, "")
                  .trim();
                break;
              }
            }
          } catch (callErr) {
            console.warn(
              `[vibe-dms] mAI DM modèle ${modelToTry} en échec:`,
              callErr
            );
          }
        }
      }
      if (!reply) {
        reply =
          "Je n'arrive pas à générer ma réponse pour le moment (service IA momentanément indisponible). Réessayez dans un instant ✨";
      }

      // Débit de l'usage hebdomadaire de l'expéditeur (chaque message compte)
      const estimatedTokens = Math.max(
        75,
        Math.ceil((userPrompt.length + reply.length) / 3)
      );
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${senderId}, ${weekStartStr}::date, ${estimatedTokens})
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${estimatedTokens}, updated_at = NOW()
      `.catch(() => {});
    }

    // Insertion de la réponse mAI dans la conversation
    const maiMsg = await sql`
      INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, content)
      VALUES (${conversationId}::uuid, ${maiUserId}, ${senderId}, ${reply})
      RETURNING *
    `;
    await sql`
      UPDATE dm_conversations SET last_message_preview = ${reply.slice(0, 120)}, last_message_at = NOW()
      WHERE id = ${conversationId}::uuid
    `.catch(() => {});
    await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, message)
      VALUES (${senderId}, ${maiUserId}, 'dm', 'vous a envoyé un message')
    `.catch(() => {});

    // Temps réel : pousse la réponse mAI à l'expéditeur (flux SSE)
    try {
      await pushRealtimeEvent(
        senderId,
        "dm_message",
        maiMsg[0] || {
          content: reply,
          conversation_id: conversationId,
          recipient_id: senderId,
          sender_id: maiUserId,
        }
      );
    } catch {}
  } catch (err) {
    console.warn(
      "[vibe-dms] generateMAIDMReply failed:",
      (err as any)?.message
    );
  }
}

/**
 * Publication paresseuse des DMs programmés arrivés à échéance (miroir
 * publishDuePosts) : appelée en tête de handleDMMessages, throttle 30 s.
 */
let lastDMpublishCheck = 0;
export async function publishScheduledDMs(): Promise<void> {
  const now = Date.now();
  if (now - lastDMpublishCheck < 30_000) return;
  lastDMpublishCheck = now;
  try {
    const sql = getDb();
    const due = await sql`
      UPDATE direct_messages
      SET status = 'sent', send_at = NULL
      WHERE status = 'scheduled' AND send_at IS NOT NULL AND send_at <= NOW()
      RETURNING *
    `.catch(() => []);
    for (const m of due || []) {
      try {
        await sql`
          INSERT INTO notifications (recipient_id, actor_id, type, message)
          VALUES (${m.recipient_id}, ${m.sender_id}, 'dm', 'vous a envoyé un message')
        `.catch(() => {});
        await pushRealtimeEvent(Number(m.recipient_id), "dm_message", m);
      } catch {}
    }
  } catch (err) {
    console.warn(
      "[vibe-dms] publishScheduledDMs skipped:",
      (err as any)?.message
    );
  }
}

/** Résout l'UUID de conversation dm_conversations depuis (userId, partnerId). */
export async function resolveConversationId(
  sql: any,
  userId: number,
  partnerId: number
): Promise<string | null> {
  try {
    const p1 = userId < partnerId ? userId : partnerId;
    const p2 = userId < partnerId ? partnerId : userId;
    const rows = await sql`
      SELECT id FROM dm_conversations
      WHERE participant_one_id = ${p1} AND participant_two_id = ${p2}
      LIMIT 1
    `;
    return rows[0] ? String(rows[0].id) : null;
  } catch {
    return null;
  }
}

/**
 * Résout une conversation depuis un partnerId brut : "123" (1-à-1) ou
 * "group:<uuid>" (groupe). Vérifie l'appartenance de l'utilisateur et
 * retourne les membres pour la diffusion SSE.
 */
export async function resolveConversationTarget(
  sql: any,
  userId: number,
  raw: string
): Promise<{
  conversationId: string;
  isGroup: boolean;
  memberIds: number[];
} | null> {
  try {
    if (raw.startsWith("group:")) {
      const groupId = raw.slice(6);
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          groupId
        )
      )
        return null;
      const memberRows =
        await sql`SELECT user_id FROM dm_group_members WHERE conversation_id = ${groupId}::uuid`;
      const memberIds = (memberRows as any[]).map((r) => Number(r.user_id));
      if (!memberIds.includes(userId)) return null;
      return { conversationId: groupId, isGroup: true, memberIds };
    }
    const partnerId = Number(raw);
    if (!partnerId || partnerId === userId) return null;
    const conversationId = await resolveConversationId(sql, userId, partnerId);
    if (!conversationId) return null;
    return { conversationId, isGroup: false, memberIds: [userId, partnerId] };
  } catch {
    return null;
  }
}

/** Diffuse un événement SSE à plusieurs utilisateurs (fan-out groupe). */
export async function pushToUsers(
  ids: number[],
  type: string,
  payload: any,
  exclude?: number
): Promise<void> {
  for (const id of ids) {
    if (exclude && id === exclude) continue;
    try {
      await pushRealtimeEvent(id, type, payload);
    } catch {}
  }
}

/** Messages épinglés d'une conversation (aperçus, max 3), masqués exclus. */
export async function fetchPinnedMessages(
  sql: any,
  conversationId: string,
  userId: number
): Promise<any[]> {
  try {
    return await sql`
      SELECT m.*, u.username as sender_username
      FROM dm_pinned_messages pm
      JOIN direct_messages m ON m.id = pm.message_id
      JOIN users u ON u.id = m.sender_id
      WHERE pm.conversation_id = ${conversationId}::uuid
        AND NOT EXISTS (SELECT 1 FROM dm_hidden_messages h WHERE h.message_id = m.id AND h.user_id = ${userId})
      ORDER BY pm.pinned_at ASC
      LIMIT 3
    `;
  } catch {
    return [];
  }
}

/** Infos publiques de la publication jointe à un message (carte cliquable). */
export async function fetchDMAttachedPost(
  sql: any,
  postId: string
): Promise<{
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  excerpt: string;
} | null> {
  try {
    const rows = await sql`
      SELECT p.id, p.content, u.username, pr.display_name, pr.avatar_url
      FROM posts p
      JOIN users u ON u.id = p.author_id
      LEFT JOIN profiles pr ON pr.user_id = p.author_id
      WHERE p.id = ${postId}::uuid
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      avatar_url: r.avatar_url || null,
      display_name: r.display_name || null,
      excerpt: stripHtmlTags(String(r.content || ""))
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140),
      id: String(r.id),
      username: String(r.username),
    };
  } catch {
    return null;
  }
}

/** Enrichit des messages lus avec leur publication jointe (1 requête batch). */
export async function attachDMAttachedPosts(
  sql: any,
  messages: any[]
): Promise<void> {
  if (!Array.isArray(messages) || messages.length === 0) return;
  const ids = Array.from(
    new Set(
      messages
        .filter((m) => m?.attached_post_id)
        .map((m) => String(m.attached_post_id))
    )
  );
  if (ids.length === 0) return;
  try {
    const rows = await sql`
      SELECT p.id, p.content, u.username, pr.display_name, pr.avatar_url
      FROM posts p
      JOIN users u ON u.id = p.author_id
      LEFT JOIN profiles pr ON pr.user_id = p.author_id
      WHERE p.id = ANY(${ids}::uuid[])
    `;
    const byId = new Map<string, any>(
      (rows as any[]).map((r) => [
        String(r.id),
        {
          avatar_url: r.avatar_url || null,
          display_name: r.display_name || null,
          excerpt: stripHtmlTags(String(r.content || ""))
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 140),
          id: String(r.id),
          username: String(r.username),
        },
      ])
    );
    for (const m of messages) {
      if (m?.attached_post_id)
        m.attached_post = byId.get(String(m.attached_post_id)) || null;
    }
  } catch {}
}

/**
 * Normalise l'attribution d'un message transféré : seul l'id du message
 * d'origine est accepté, l'auteur est re-dérivé depuis la base (anti-usurpation).
 */
export async function deriveForwardedFrom(
  sql: any,
  raw: any
): Promise<{
  message_id: string;
  username: string;
  display_name: string | null;
} | null> {
  try {
    if (!raw || typeof raw !== "object" || !raw.message_id) return null;
    const id = String(raw.message_id);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      )
    )
      return null;
    const rows = await sql`
      SELECT m.id AS message_id, u.username, pr.display_name
      FROM direct_messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE m.id = ${id}::uuid
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return {
      display_name: rows[0].display_name || null,
      message_id: String(rows[0].message_id),
      username: String(rows[0].username),
    };
  } catch {
    return null;
  }
}

/** Vérifie qu'un utilisateur peut agir sur un message (expéditeur, destinataire ou membre du groupe). */
export const assertMessageAccess = async (
  sql: any,
  userId: number,
  messageId: string
): Promise<{ ok: boolean; message?: any; error?: string; code?: number }> => {
  const rows =
    await sql`SELECT id, sender_id, recipient_id, conversation_id FROM direct_messages WHERE id = ${messageId}::uuid LIMIT 1`;
  if (rows.length === 0)
    return { code: 404, error: "Message introuvable.", ok: false };
  const m = rows[0];
  if (Number(m.sender_id) === userId || Number(m.recipient_id) === userId)
    return { message: m, ok: true };
  const memberRows = await sql`
    SELECT 1 FROM dm_group_members WHERE conversation_id = ${m.conversation_id}::uuid AND user_id = ${userId} LIMIT 1
  `;
  if (memberRows.length === 0)
    return { code: 403, error: "Accès refusé.", ok: false };
  return { message: m, ok: true };
};
