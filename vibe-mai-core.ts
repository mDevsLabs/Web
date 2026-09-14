/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : SOCLE PARTAGÉ (vibe-mai-core.ts)
 * Modèles OpenRouter, formatage des réponses d'outils, contexte de post
 * joint (vision), clé API, persistance des conversations/messages mAI,
 * détection des commandes / et @, et auto-approbation.
 * Scindé de vibe-mai.ts (limite de taille Val Town).
 * ============================================================================
 */

import { getDb } from "./config.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";

/** Regex UUID partagée (conversations mAI, publications jointes). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Modèles "mAI" marketing → modèles OpenRouter réels.
 * Les ids contenant déjà "/" (ex: anthropic/claude-3.7-sonnet) passent tels quels.
 */
const MODEL_MAP: Record<string, string> = {
  "mai-1.5-apex": "poolside/laguna-xs-2.1:free",
  "mai-1.5-light": "poolside/laguna-xs-2.1:free",
  "poolside/laguna-xs-2.1:free": "poolside/laguna-xs-2.1:free",
};

export function _resolveOpenRouterModel(model: string): string {
  if (MODEL_MAP[model]) return MODEL_MAP[model];
  return model.includes("/") ? model : "poolside/laguna-xs-2.1:free";
}

/** Période optionnelle en fin de commande ("/audience 90d", "/hashtags 7j", "... 12m"). */
export function parsePeriodArg(raw: string): "7d" | "30d" | "90d" | "12m" {
  const m = String(raw)
    .toLowerCase()
    .match(/(?:^|\s)(7d|30d|90d|12m|7j|30j|90j|1an|an)\s*$/);
  if (!m) return "30d";
  const v = m[1];
  if (v === "7d" || v === "7j") return "7d";
  if (v === "90d" || v === "90j") return "90d";
  if (v === "12m" || v === "1an" || v === "an") return "12m";
  return "30d";
}

/** Formatte la réponse conversationnelle après exécution d'un outil. */
export function formatToolReply(
  toolName: string,
  result: any,
  _username: string
): string {
  if (toolName === "generate_vibe_image") {
    return `🎨 Voici l'image générée avec mAI :\n\n![Image générée](${result.imageUrl})\n\n*Prompt : « ${result.prompt} »*`;
  }
  if (toolName === "search_web") {
    return `🌐 **Recherche Web mAI** :\n\n${result.snippet}`;
  }
  if (toolName === "fact_check") {
    return `🛡️ **Vérification Factuelle mAI** :\n• Affirmation : « ${result.statement} »\n• Résultat : **${result.verdict}** (Indice de confiance : ${result.confidence})\n\n${result.analysis}`;
  }
  if (toolName === "rewrite_post") {
    return `✨ **Texte reformulé (${result.style})** :\n\n${result.rewritten}`;
  }
  if (toolName === "translate") {
    return `🌐 **Traduction (${result.targetLanguage})** :\n\n${result.translated}`;
  }
  if (toolName === "create_post") {
    return `🚀 Votre publication a été publiée avec succès sur Vibe :\n\n« ${result.post.content} »`;
  }
  if (toolName === "delete_post") {
    return `🗑️ ${result.message}`;
  }
  if (toolName === "analyze_trends") {
    const trendsList = result.trendingTopics
      .map(
        (t: any) =>
          `• **${t.name}** (${t.postsCount} publications) — ${t.sentiment}`
      )
      .join("\n");
    return trendsList
      ? `🔥 **Tendances actuelles sur Vibe** :\n\n${trendsList}`
      : "🔍 Pas encore de tendances détectées cette semaine. Publiez avec des hashtags pour lancer la vague !";
  }
  if (toolName === "suggest_post") {
    return `💡 **Idées de publications Vibe** (thème : ${result.topic}) :\n\n${result.suggestions}\n\n*Utilisez /publish suivi du texte choisi pour publier.*`;
  }
  if (toolName === "get_account_stats") {
    return `📈 **Statistiques du compte @${result.user.username}** :\n• Publications : **${result.totalPosts}**\n• Score de réputation : **${result.profile?.reputation_score || 100} pts**\n• Forfait : **${result.user.tier || "Free"}**`;
  }
  if (toolName === "check_quotas") {
    const q = result;
    return `📊 **Vos quotas réels (${q.tier})** :\n• Tokens mAI : **${q.weeklyTokens.used.toLocaleString()}** / ${q.weeklyTokens.limit.toLocaleString()} (${q.weeklyTokens.percent}%)\n• Images quotidiennes : **${q.dailyImages.used}** / ${q.dailyImages.limit} (${q.dailyImages.percent}%)\n• Réinitialisation : ${new Date(q.resetAt).toLocaleDateString("fr-FR")}`;
  }
  if (toolName === "update_profile") {
    return `✅ ${result.message}\n\n• Nom affiché : **${result.profile.display_name}**\n• Bio : ${result.profile.bio || "_(vide)_"}`;
  }
  if (toolName === "follow_user") {
    return `👥 ${result.message}`;
  }
  if (toolName === "get_notifications") {
    if (result.count === 0) return "🔔 Aucune notification récente.";
    const list = result.notifications
      .slice(0, 10)
      .map(
        (n: any) =>
          `• **${n.type}** — ${n.message || (n.actor_username ? `@${n.actor_username}` : "")}`
      )
      .join("\n");
    return `🔔 **Vos ${result.count} dernières notifications** :\n\n${list}`;
  }
  if (toolName === "like_post") {
    return result.liked
      ? `❤️ ${result.message}\n\n• Post : \`${result.post_id}\`\n• Total likes : **${result.likes_count}**`
      : `🤍 ${result.message}`;
  }
  if (toolName === "send_message") {
    return `💬 ${result.message}\n\n• Destinataire : **@${result.username}**\n• Aperçu : « ${result.preview} »`;
  }
  if (toolName === "update_settings") {
    const keys = Object.keys(result.patched || {}).join(", ");
    return `⚙️ ${result.message}\n\n• Modifiés : \`${keys}\``;
  }
  if (toolName === "bookmark_post") {
    return result.bookmarked ? `🔖 ${result.message}` : `📑 ${result.message}`;
  }
  if (toolName === "repost_post") {
    return result.reposted ? `🔁 ${result.message}` : `↩️ ${result.message}`;
  }
  if (toolName === "comment_post") {
    return `💭 ${result.message}\n\n• Commentaire : \`${result.comment_id}\``;
  }
  if (toolName === "get_post_stats") {
    return `📊 **Analyse du post @${result.author}** :\n• ❤️ ${result.likes} · 🔁 ${result.reposts} · 💬 ${result.replies} · 👁️ ${result.views} · 🔖 ${result.bookmarks}\n• Engagement : **${result.engagement}** (taux ${result.engagement_rate_percent}%)\n\n« ${result.content} »`;
  }
  if (toolName === "search_posts") {
    if (!result.resultsCount)
      return `🔎 Aucune publication trouvée pour « ${result.query} ».`;
    const list = (result.posts || [])
      .slice(0, 5)
      .map(
        (p: any) =>
          `• @${p.username} — « ${String(p.content || "")
            .replace(/\s+/g, " ")
            .slice(0, 90)} »`
      )
      .join("\n");
    return `🔎 **${result.resultsCount} publication(s) pour « ${result.query} »** :\n\n${list}`;
  }
  if (toolName === "analyze_creator_stats") {
    const t = result.totals || {};
    const reco = (result.recommendations || [])
      .map((r: string) => `• ${r}`)
      .join("\n");
    return `📈 **Analyse créateur (${result.period_days} j)** :\n• 👁️ Vues : **${t.views ?? "—"}** · ❤️ ${t.likes ?? "—"} · 🔁 ${t.reposts ?? "—"} · 💬 ${t.replies ?? "—"}\n• Taux d'engagement : **${result.engagement_rate_percent ?? "—"}%**${reco ? `\n\n**Recommandations :**\n${reco}` : ""}`;
  }
  if (toolName === "analyze_audience") {
    const src = (result.sources || [])
      .map((s: any) => `• ${s.source} : **${s.views}** vues (${s.percent}%)`)
      .join("\n");
    const hours = (result.peak_hours || [])
      .slice(0, 3)
      .map((h: any) => `${String(h.hour).padStart(2, "0")}h`)
      .join(", ");
    const fans = (result.top_engaged_followers || [])
      .slice(0, 3)
      .map((f: any) => `@${f.username} (${f.views})`)
      .join(", ");
    return `👥 **Audience (${result.period_days} j)** :\n• Vues : **${result.total_views}** · Visiteurs uniques : **${result.unique_viewers}**\n${src}${hours ? `\n• Heures de pointe : ${hours}` : ""}${fans ? `\n• Top followers engagés : ${fans}` : ""}`;
  }
  if (toolName === "best_time_to_post") {
    const slots = (result.best_slots || [])
      .map(
        (s: any) =>
          `• **${s.weekday} ${String(s.hour).padStart(2, "0")}h** — ${s.avg_views} vues moy., ${s.avg_engagement} engagement`
      )
      .join("\n");
    return `🕐 **Meilleurs créneaux (${result.period_days} j, ${result.analyzed_posts} posts analysés)** :\n${slots || "• Pas assez de données."}\n\n*Confiance : ${result.confidence}*`;
  }
  if (toolName === "compare_periods") {
    const fmt = (label: string, m: any) =>
      `• ${label} : **${m.current}** vs ${m.previous} (${m.delta >= 0 ? "+" : ""}${m.delta}, ${m.percent >= 0 ? "+" : ""}${m.percent}%)`;
    return `📊 **Comparaison (${result.period_days} j vs les ${result.period_days} précédents)** :\n${fmt("Vues", result.views)}\n${fmt("Likes", result.likes)}\n${fmt("Reposts", result.reposts)}\n${fmt("Réponses", result.replies)}\n${fmt("Followers gagnés", result.followers_gained)}\n${fmt("Vues du profil", result.profile_views)}`;
  }
  if (toolName === "predict_post_performance") {
    const tips = (result.breakdown || [])
      .filter((b: any) => b.tip)
      .map((b: any) => `• ${b.tip}`)
      .join("\n");
    return `🎯 **Prévision du brouillon : ${result.score}/100**${result.cold_start ? " (historique insuffisant)" : ""}\n• Portée estimée : **${result.estimated_reach}** vues\n• Engagement estimé : **${result.estimated_engagement}**${tips ? `\n\n**Conseils :**\n${tips}` : ""}`;
  }
  if (toolName === "analyze_content_performance") {
    const formats = (result.formats || [])
      .map(
        (f: any) =>
          `• **${f.format}** : ${f.posts} posts · ${f.avg_views} vues moy. · ${f.avg_engagement} engagement`
      )
      .join("\n");
    const tags = (result.top_hashtags || [])
      .slice(0, 5)
      .map((t: any) => `${t.tag} (${t.avg_views} vues)`)
      .join(", ");
    return `🧩 **Performance par format (${result.period_days} j)** :\n${formats || "• Aucun post sur la période."}${tags ? `\n\n**Top hashtags :** ${tags}` : ""}`;
  }
  if (toolName === "analyze_dm_activity") {
    const top = (result.top_correspondents || [])
      .slice(0, 3)
      .map((c: any) => `@${c.username} (${c.messages})`)
      .join(", ");
    return `💬 **Activité messages (${result.period_days} j)** :\n• Total : **${result.messages_total}** (${result.sent} envoyés, ${result.received} reçus)\n• Conversations actives : **${result.active_conversations}** · Groupes : ${result.groups}${result.avg_reply_minutes === null ? "" : `\n• Temps de réponse moyen : **${result.avg_reply_minutes} min**`}${top ? `\n• Top correspondants : ${top}` : ""}`;
  }
  if (toolName === "analyze_book_stats") {
    const books = (result.books || [])
      .map(
        (b: any) =>
          `• **${b.title}** : ${b.items_count} Vibes · ${b.members_count} membres · ${b.contributors_count} contributeurs`
      )
      .join("\n");
    return `📚 **Vos Livres (${result.books_count})** :\n${books || "• Aucun Livre."}`;
  }
  if (toolName === "analyze_hashtags") {
    const tags = (result.hashtags || [])
      .slice(0, 5)
      .map(
        (t: any) =>
          `• **${t.tag}** — ${t.avg_views} vues moy., ${t.avg_likes} likes moy.`
      )
      .join("\n");
    const sugg = (result.suggestions || [])
      .slice(0, 4)
      .map((t: any) => `${t.tag} (${t.platform_posts_7d})`)
      .join(", ");
    return `#️⃣ **Hashtags (${result.period_days} j)** :\n${tags || "• Aucun hashtag utilisé sur la période."}${sugg ? `\n\n**Suggestions tendance :** ${sugg}` : ""}`;
  }
  return "✅ Action effectuée.";
}

// ── Contexte de post joint à une question mAI ────────────────────────────
// Le post est transmis avec ses statistiques, ses premiers commentaires et
// ses médias. Les images sont jointes comme FICHIERS (octets récupérés puis
// encodés en base64 data-URL), jamais comme simples URLs.
export const VISION_CAPABLE_MODELS = new Set([
  "openai/gpt-4o",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "anthropic/claude-3.7-sonnet",
  "mai-1.5-apex",
]);
const MAX_CONTEXT_IMAGES = 3;
const MAX_CONTEXT_IMAGE_BYTES = 3.5 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x80_00;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK)) as any
    );
  }
  return btoa(binary);
}

export async function buildPostContext(
  sql: any,
  postId: string
): Promise<{ text: string; imageParts: any[] } | null> {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        postId
      )
    )
      return null;

    const rows = await sql`
      SELECT p.id, p.content, p.likes_count, p.reposts_count, p.replies_count, p.views_count,
             p.published_at, p.created_via, p.ai_generated,
             u.username, pr.display_name
      FROM posts p
      JOIN users u ON u.id = p.author_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE p.id = ${postId}::uuid
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const post = rows[0];

    let commentsText = "";
    try {
      const comments = await sql`
        SELECT c.content, u.username
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ${postId}::uuid AND c.is_hidden = FALSE
        ORDER BY c.depth ASC, c.likes_count DESC, c.created_at ASC
        LIMIT 10
      `;
      if (comments.length > 0) {
        const lines = comments
          .map(
            (cm: any) =>
              `  • @${cm.username} : ${String(cm.content || "").slice(0, 200)}`
          )
          .join("\n");
        commentsText = `\n\nPremiers commentaires :\n${lines}`;
      }
    } catch {}

    let media: any[] = [];
    try {
      media =
        await sql`SELECT url, media_type FROM media_assets WHERE post_id = ${postId}::uuid`;
    } catch {}

    const text =
      `📌 Post mentionné de @${post.username} (${post.display_name || post.username})` +
      `${post.ai_generated ? " [marqué « créé avec l'IA » par son auteur]" : ""}\n` +
      `Publié le ${new Date(post.published_at).toLocaleString("fr-FR")}\n\n` +
      `« ${post.content} »\n\n` +
      `Statistiques : ${post.likes_count} J'aime · ${post.replies_count} réponses · ${post.reposts_count} republications · ${post.views_count || 0} vues` +
      commentsText;

    const imageParts: any[] = [];
    for (const m of media) {
      if (imageParts.length >= MAX_CONTEXT_IMAGES) break;
      const url = String(m.url || "");
      const isImage =
        String(m.media_type || "").startsWith("image") ||
        /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
      if (!url || !isImage) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0 || buf.byteLength > MAX_CONTEXT_IMAGE_BYTES)
          continue;
        const contentType = res.headers.get("content-type") || "image/jpeg";
        imageParts.push({
          image_url: {
            url: `data:${contentType};base64,${bytesToBase64(new Uint8Array(buf))}`,
          },
          type: "image_url",
        });
      } catch {}
    }

    return { imageParts, text };
  } catch (err) {
    console.warn("[mAI Chat] buildPostContext:", (err as any)?.message);
    return null;
  }
}

/** Clé OpenRouter : variable d'environnement, sinon clé personnelle de l'utilisateur. */
export async function getOpenRouterKey(
  sql: any,
  userId: number
): Promise<string> {
  const keyRows = await sql`
    SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
  `.catch(() => []);
  return (
    (typeof (globalThis as any).Deno !== "undefined" &&
      (globalThis as any).Deno.env?.get("OPENROUTER_API_KEY")) ||
    (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) ||
    (keyRows.length > 0 ? keyRows[0].api_key : "")
  );
}

// ── Persistance des conversations mAI (tables migration 002, créées
//    idempotemment au démarrage : le migrateur n'exécute pas les SQL) ──
let maiTablesReady = false;
export async function ensureMAIConversations() {
  if (maiTablesReady) return;
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS mai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Nouvelle discussion mAI',
        model_id VARCHAR(100) DEFAULT 'mai-1.5-apex',
        system_prompt TEXT,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mai_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES mai_conversations(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL,
        content TEXT,
        tool_calls JSONB,
        tool_call_id VARCHAR(100),
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // Multi-conversations + chips d'outils : colonnes défensives et index
    await sql`ALTER TABLE mai_messages ADD COLUMN IF NOT EXISTS tool_calls JSONB`.catch(
      () => {}
    );
    await sql`ALTER TABLE mai_messages ADD COLUMN IF NOT EXISTS tool_call_id VARCHAR(100)`.catch(
      () => {}
    );
    await sql`CREATE INDEX IF NOT EXISTS idx_mai_messages_conv ON mai_messages(conversation_id, created_at DESC)`.catch(
      () => {}
    );
    await sql`CREATE INDEX IF NOT EXISTS idx_mai_conversations_user ON mai_conversations(user_id, updated_at DESC)`.catch(
      () => {}
    );
    maiTablesReady = true;
  } catch (err) {
    console.warn(
      "[vibe-mai] ensureMAIConversations skipped:",
      (err as any)?.message
    );
  }
}

/** Conversation active de l'utilisateur : la plus récente, créée au besoin. */
export async function getOrCreateConversation(sql: any, userId: number) {
  const existing = await sql`
    SELECT id FROM mai_conversations WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 1
  `.catch(() => []);
  if (existing.length > 0) return existing[0].id as string;
  const created = await sql`
    INSERT INTO mai_conversations (user_id, title) VALUES (${userId}, 'Discussion mAI') RETURNING id
  `.catch(() => []);
  return created[0]?.id as string | undefined;
}

/** Conversation demandée par le client : validée propriétaire, ou signalée invalide. */
export async function resolveOwnedConversation(
  sql: any,
  userId: number,
  raw: unknown
): Promise<{ id: string | null; invalid: boolean }> {
  const rawId = typeof raw === "string" ? raw.trim() : "";
  if (!rawId) return { id: null, invalid: false };
  if (!UUID_RE.test(rawId)) return { id: null, invalid: true };
  const rows = await sql`
    SELECT id FROM mai_conversations WHERE id = ${rawId}::uuid AND user_id = ${userId} LIMIT 1
  `.catch(() => []);
  return rows.length > 0
    ? { id: String(rows[0].id), invalid: false }
    : { id: null, invalid: true };
}

/** Titre automatique depuis le premier message utilisateur (titre par défaut seulement). */
export async function maybeAutoTitleConversation(
  sql: any,
  conversationId: string,
  firstMessage: string
) {
  try {
    const rows =
      await sql`SELECT title FROM mai_conversations WHERE id = ${conversationId}::uuid LIMIT 1`;
    const current = String(rows[0]?.title || "").trim();
    if (
      current &&
      current !== "Discussion mAI" &&
      current !== "Nouvelle discussion mAI"
    )
      return;
    const plain = stripHtmlTags(String(firstMessage))
      .replace(/\s+/g, " ")
      .trim();
    if (!plain) return;
    const title = plain.length > 60 ? `${plain.slice(0, 57)}…` : plain;
    await sql`UPDATE mai_conversations SET title = ${title} WHERE id = ${conversationId}::uuid`;
  } catch {}
}

/** Insère un message mAI et met à jour l'horodatage de la conversation. */
export async function saveMAIMessage(
  sql: any,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  extra?: { toolCalls?: any[] | null; toolCallId?: string | null }
) {
  try {
    const toolCallsJson =
      extra?.toolCalls && extra.toolCalls.length > 0
        ? JSON.stringify(extra.toolCalls)
        : null;
    const rows = await sql`
      INSERT INTO mai_messages (conversation_id, sender_role, content, tool_calls, tool_call_id)
      VALUES (${conversationId}::uuid, ${role}, ${content}, ${toolCallsJson}::jsonb, ${extra?.toolCallId || null})
      RETURNING id, created_at
    `;
    await sql`UPDATE mai_conversations SET updated_at = NOW() WHERE id = ${conversationId}::uuid`;
    return rows[0] || null;
  } catch (err) {
    console.warn("[vibe-mai] saveMAIMessage:", (err as any)?.message);
    return null;
  }
}

/** Enregistre d'un appel d'outil (persisté dans mai_messages.tool_calls). */
export function makeToolCallRecord(opts: {
  name: string;
  args?: any;
  status:
    | "executed"
    | "error"
    | "pending_approval"
    | "rejected"
    | "disabled"
    | "blocked";
  result?: any;
  error?: string | null;
  model?: string | null;
}) {
  return {
    args: opts.args || {},
    at: new Date().toISOString(),
    error: opts.error ?? null,
    id:
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    model: opts.model ?? null,
    name: opts.name,
    result: opts.result ?? null,
    status: opts.status,
  };
}

/**
 * Finalise le dernier message assistant portant un record `pending_approval`
 * pour cet outil (exécution ou refus) : met à jour contenu + tool_calls sans
 * insérer de doublon. Retourne l'id du message mis à jour, ou null.
 */
export async function finalizePendingToolMessage(
  sql: any,
  conversationId: string,
  toolName: string,
  patch: {
    status: string;
    result?: any;
    error?: string | null;
    reply: string;
    model?: string | null;
  }
): Promise<{ id: string | null }> {
  try {
    const rows = await sql`
      SELECT id, tool_calls FROM mai_messages
      WHERE conversation_id = ${conversationId}::uuid AND sender_role = 'assistant' AND tool_calls IS NOT NULL
      ORDER BY created_at DESC LIMIT 12
    `;
    for (const row of rows as any[]) {
      const calls = Array.isArray(row.tool_calls) ? row.tool_calls : [];
      const idx = calls.findIndex(
        (cc: any) =>
          cc && cc.name === toolName && cc.status === "pending_approval"
      );
      if (idx >= 0) {
        calls[idx] = {
          ...calls[idx],
          at: new Date().toISOString(),
          error: patch.error ?? null,
          model: patch.model ?? calls[idx].model ?? null,
          result: patch.result ?? null,
          status: patch.status,
        };
        await sql`
          UPDATE mai_messages SET content = ${patch.reply}, tool_calls = ${JSON.stringify(calls)}::jsonb
          WHERE id = ${row.id}::uuid
        `;
        return { id: String(row.id) };
      }
    }
  } catch (err) {
    console.warn(
      "[vibe-mai] finalizePendingToolMessage:",
      (err as any)?.message
    );
  }
  return { id: null };
}

// Détection d'outils par commandes / ou mentions @
export function detectTool(
  cleanMsg: string
): { toolToRun: string; toolArgs: any } | null {
  const lower = cleanMsg.toLowerCase();
  if (
    lower.startsWith("/image") ||
    lower.startsWith("@image") ||
    lower.startsWith("/draw") ||
    lower.startsWith("@draw") ||
    lower.startsWith("@generate_image") ||
    lower.startsWith("génère une image")
  ) {
    const prompt = cleanMsg
      .replace(
        /^([/@](image|draw|generate_image)|(génère|crée)\s*(une image|l'image)?)\s*:?\s*/i,
        ""
      )
      .trim();
    return {
      toolArgs: {
        prompt: prompt || "Création artistique numérique minimaliste",
      },
      toolToRun: "generate_vibe_image",
    };
  }
  if (
    lower.startsWith("/search") ||
    lower.startsWith("@search") ||
    lower.startsWith("/recherche") ||
    lower.startsWith("@recherche") ||
    lower.startsWith("@web")
  ) {
    const q = cleanMsg
      .replace(/^[/@](search|recherche|web)\s*:?\s*/i, "")
      .trim();
    return {
      toolArgs: { query: q || "Intelligence artificielle 2026" },
      toolToRun: "search_web",
    };
  }
  if (
    lower.startsWith("/fact_check") ||
    lower.startsWith("@fact_check") ||
    lower.startsWith("/verifier") ||
    lower.startsWith("@verifier")
  ) {
    const s = cleanMsg
      .replace(/^[/@](fact_check|verifier)\s*:?\s*/i, "")
      .trim();
    return { toolArgs: { statement: s || cleanMsg }, toolToRun: "fact_check" };
  }
  if (
    lower.startsWith("/rewrite") ||
    lower.startsWith("@rewrite") ||
    lower.startsWith("/reformuler") ||
    lower.startsWith("@reformuler") ||
    lower.startsWith("@style")
  ) {
    const words = cleanMsg
      .replace(/^[/@](rewrite|reformuler|style)\s*:?\s*/i, "")
      .trim()
      .split(/\s+/);
    const style = ["viral", "pro", "humour", "concis", "poétique"].includes(
      words[0]?.toLowerCase()
    )
      ? words.shift()
      : "viral";
    return {
      toolArgs: { style, text: words.join(" ") || cleanMsg },
      toolToRun: "rewrite_post",
    };
  }
  if (
    lower.startsWith("/translate") ||
    lower.startsWith("@translate") ||
    lower.startsWith("/traduire") ||
    lower.startsWith("@traduire")
  ) {
    const words = cleanMsg
      .replace(/^[/@](translate|traduire)\s*:?\s*/i, "")
      .trim()
      .split(/\s+/);
    const lang = words[0] || "anglais";
    words.shift();
    return {
      toolArgs: { target_language: lang, text: words.join(" ") || cleanMsg },
      toolToRun: "translate",
    };
  }
  if (
    lower.startsWith("/publish") ||
    lower.startsWith("@publish") ||
    lower.startsWith("/publier") ||
    lower.startsWith("@publier") ||
    lower.startsWith("@post") ||
    lower.startsWith("publie ")
  ) {
    const textMatch = cleanMsg
      .replace(/^([/@](publish|publier|post)|(publie|poste))\s*:?\s*/i, "")
      .trim();
    return {
      toolArgs: { content: textMatch || cleanMsg },
      toolToRun: "create_post",
    };
  }
  if (
    lower.startsWith("/delete_post") ||
    lower.startsWith("@delete_post") ||
    lower.startsWith("/supprimer")
  ) {
    const raw = cleanMsg
      .replace(/^[/@](delete_post|supprimer)\s*:?\s*/i, "")
      .trim();
    const m = raw.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (m) return { toolArgs: { post_id: m[0] }, toolToRun: "delete_post" };
    return null;
  }
  if (
    lower.startsWith("/find") ||
    lower.startsWith("@find") ||
    lower.includes("cherche des posts") ||
    lower.includes("recherche des posts")
  ) {
    const q = cleanMsg.replace(/^[/@]find\s*:?\s*/i, "").trim();
    return { toolArgs: { query: q || cleanMsg }, toolToRun: "search_posts" };
  }
  if (
    lower.startsWith("/profile") ||
    lower.startsWith("@profile") ||
    lower.includes("modifie mon profil") ||
    lower.includes("change ma bio")
  ) {
    const raw = cleanMsg.replace(/^[/@]profile\s*:?\s*/i, "").trim();
    // Format : /profile display_name: X bio: Y (approbation requise côté chat)
    const dn = raw.match(/display_name\s*:\s*([^,;]+)/i);
    const bio = raw.match(/bio\s*:\s*([\s\S]+)/i);
    const args: Record<string, string> = {};
    if (dn) args.display_name = dn[1].trim();
    if (bio) args.bio = bio[1].trim();
    if (args.display_name || args.bio)
      return { toolArgs: args, toolToRun: "update_profile" };
    return null;
  }
  if (
    lower.startsWith("/follow") ||
    lower.startsWith("@follow") ||
    lower.startsWith("/suivre") ||
    lower.startsWith("@suivre")
  ) {
    const target = cleanMsg
      .replace(/^[/@](follow|suivre)\s*:?\s*/i, "")
      .trim()
      .replace(/^@/, "");
    if (target)
      return { toolArgs: { username: target }, toolToRun: "follow_user" };
  }
  if (
    lower.startsWith("/trends") ||
    lower.startsWith("@trends") ||
    lower.startsWith("/tendances") ||
    lower.startsWith("@tendances")
  ) {
    return { toolArgs: {}, toolToRun: "analyze_trends" };
  }
  // ── Outils d'analyse avancée ─────────────────────────────────────────────
  // Blocs placés AVANT /dm et /analyze : leurs préfixes (/dmstats, /analyze_stats)
  // commencent par /dm et /analyze et seraient capturés par les blocs plus bas.
  if (
    lower.startsWith("/analyze_stats") ||
    lower.startsWith("@analyze_stats") ||
    lower.includes("analyse mes stats") ||
    lower.includes("mes statistiques créateur")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_creator_stats",
    };
  }
  if (
    lower.startsWith("/audience") ||
    lower.startsWith("@audience") ||
    lower.includes("mon audience") ||
    lower.includes("qui me regarde")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_audience",
    };
  }
  if (
    lower.startsWith("/besttime") ||
    lower.startsWith("@besttime") ||
    lower.includes("meilleur moment") ||
    lower.includes("quand publier")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "best_time_to_post",
    };
  }
  if (
    lower.startsWith("/compare") ||
    lower.startsWith("@compare") ||
    lower.includes("compare mes") ||
    lower.includes("vs la période")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "compare_periods",
    };
  }
  if (
    lower.startsWith("/predict") ||
    lower.startsWith("@predict") ||
    lower.includes("prédis") ||
    lower.includes("prévision")
  ) {
    const content = cleanMsg.replace(/^[/@]predict\s*:?\s*/i, "").trim();
    return {
      toolArgs: { content: content || cleanMsg },
      toolToRun: "predict_post_performance",
    };
  }
  if (
    lower.startsWith("/formats") ||
    lower.startsWith("@formats") ||
    lower.includes("mes formats") ||
    lower.includes("performance par format")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_content_performance",
    };
  }
  if (
    lower.startsWith("/dmstats") ||
    lower.startsWith("@dmstats") ||
    lower.includes("activité de messagerie")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_dm_activity",
    };
  }
  if (
    lower.startsWith("/bookstats") ||
    lower.startsWith("@bookstats") ||
    lower.includes("stats de mes livres")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_book_stats",
    };
  }
  if (
    lower.startsWith("/hashtags") ||
    lower.startsWith("@hashtags") ||
    lower.includes("mes hashtags")
  ) {
    return {
      toolArgs: { period: parsePeriodArg(cleanMsg) },
      toolToRun: "analyze_hashtags",
    };
  }
  if (
    lower.startsWith("/inspire") ||
    lower.startsWith("@inspire") ||
    lower.startsWith("/idee") ||
    lower.startsWith("@idee") ||
    lower.startsWith("/idée")
  ) {
    const topic = cleanMsg
      .replace(
        /^[/@](inspire|idee|idée)(-?moi)?\s*(sur|à propos de|about)?\s*:?\s*/i,
        ""
      )
      .trim();
    return {
      toolArgs: { style: "viral", topic: topic || "sujets d'actualité" },
      toolToRun: "suggest_post",
    };
  }
  if (
    lower.startsWith("/stats") ||
    lower.startsWith("@stats") ||
    lower.startsWith("/compte") ||
    lower.startsWith("@compte") ||
    lower.includes("mes stats") ||
    lower.includes("mon compte")
  ) {
    return { toolArgs: {}, toolToRun: "get_account_stats" };
  }
  if (
    lower.startsWith("/quotas") ||
    lower.startsWith("@quotas") ||
    lower.startsWith("/limites") ||
    lower.includes("mes quotas") ||
    lower.includes("mes limites")
  ) {
    return { toolArgs: {}, toolToRun: "check_quotas" };
  }
  if (
    lower.startsWith("/notifications") ||
    lower.startsWith("@notifications") ||
    lower.startsWith("/notifs") ||
    lower.startsWith("@notifs")
  ) {
    return { toolArgs: {}, toolToRun: "get_notifications" };
  }
  if (
    lower.startsWith("/like") ||
    lower.startsWith("@like") ||
    lower.startsWith("/liker") ||
    lower.startsWith("@liker") ||
    lower.startsWith("/unlike") ||
    lower.startsWith("@unlike")
  ) {
    const isUnlike = lower.startsWith("/unlike") || lower.startsWith("@unlike");
    const raw = cleanMsg
      .replace(/^[/@](like|liker|unlike)\s*:?\s*/i, "")
      .trim();
    const m = raw.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (m)
      return {
        toolArgs: { like: !isUnlike, post_id: m[0] },
        toolToRun: "like_post",
      };
    if (raw)
      return {
        toolArgs: { like: !isUnlike, post_id: raw.split(/\s+/)[0] },
        toolToRun: "like_post",
      };
    return null;
  }
  if (
    lower.startsWith("/dm") ||
    lower.startsWith("@dm") ||
    lower.startsWith("/message") ||
    lower.startsWith("@message") ||
    lower.startsWith("/envoyer")
  ) {
    const raw = cleanMsg
      .replace(/^[/@](dm|message|envoyer)\s*:?\s*/i, "")
      .trim();
    const um = raw.match(/^@?([a-z0-9_]{1,30})\s+([\s\S]+)/i);
    if (um)
      return {
        toolArgs: { content: um[2].trim(), username: um[1] },
        toolToRun: "send_message",
      };
    return null;
  }
  if (
    lower.startsWith("/settings") ||
    lower.startsWith("@settings") ||
    lower.startsWith("/parametres") ||
    lower.startsWith("@parametres") ||
    lower.startsWith("/paramètres") ||
    lower.startsWith("/reglage")
  ) {
    const raw = cleanMsg
      .replace(
        /^[/@](settings|parametres|paramètres|reglage|reglages)\s*:?\s*/i,
        ""
      )
      .trim();
    // Format simple : /settings theme dark /settings langue fr /settings fil trending
    const parts = raw.split(/\s+/);
    const key = (parts[0] || "").toLowerCase();
    const valRaw = parts.slice(1).join(" ").trim();
    const map: Record<string, string> = {
      dark: "dark",
      fil: "feed_default_mode",
      lang: "ui_language",
      langue: "ui_language",
      light: "light",
      mode: "feed_default_mode",
      theme: "theme_preference",
    };
    if (map[key]) {
      const field = map[key];
      let v: any = valRaw;
      if (
        field === "theme_preference" &&
        ["dark", "light", "auto"].includes(valRaw.toLowerCase())
      )
        v = valRaw.toLowerCase();
      else if (
        field === "feed_default_mode" &&
        ["for_you", "following", "trending"].includes(valRaw.toLowerCase())
      )
        v = valRaw.toLowerCase();
      if (v) return { toolArgs: { [field]: v }, toolToRun: "update_settings" };
    }
    if (
      raw.toLowerCase().includes("auto_approve") ||
      raw.toLowerCase().includes("approbation")
    ) {
      const on = /on|oui|true|activer/i.test(raw);
      return {
        toolArgs: { mai_auto_approve_tools: on },
        toolToRun: "update_settings",
      };
    }
    return null;
  }
  if (
    lower.startsWith("/bookmark") ||
    lower.startsWith("@bookmark") ||
    lower.startsWith("/favori") ||
    lower.startsWith("@favori") ||
    lower.startsWith("/save")
  ) {
    const raw = cleanMsg
      .replace(/^[/@](bookmark|favori|favoris|save)\s*:?\s*/i, "")
      .trim();
    const m = raw.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (m) return { toolArgs: { post_id: m[0] }, toolToRun: "bookmark_post" };
    if (raw)
      return {
        toolArgs: { post_id: raw.split(/\s+/)[0] },
        toolToRun: "bookmark_post",
      };
    return null;
  }
  if (
    lower.startsWith("/repost") ||
    lower.startsWith("@repost") ||
    lower.startsWith("/republier")
  ) {
    const raw = cleanMsg.replace(/^[/@](repost|republier)\s*:?\s*/i, "").trim();
    const m = raw.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (m) return { toolArgs: { post_id: m[0] }, toolToRun: "repost_post" };
    if (raw)
      return {
        toolArgs: { post_id: raw.split(/\s+/)[0] },
        toolToRun: "repost_post",
      };
    return null;
  }
  if (
    lower.startsWith("/comment") ||
    lower.startsWith("@comment") ||
    lower.startsWith("/commenter") ||
    lower.startsWith("/reply")
  ) {
    const raw = cleanMsg
      .replace(/^[/@](comment|commenter|commentaire|reply)\s*:?\s*/i, "")
      .trim();
    const m = raw.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+([\s\S]+)/i
    );
    if (m)
      return {
        toolArgs: { content: m[2].trim(), post_id: m[1] },
        toolToRun: "comment_post",
      };
    return null;
  }
  if (
    lower.startsWith("/analyze") ||
    lower.startsWith("@analyze") ||
    lower.startsWith("/analyse") ||
    lower.startsWith("/poststats") ||
    lower.startsWith("/vues")
  ) {
    const m = cleanMsg.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (m) return { toolArgs: { post_id: m[0] }, toolToRun: "get_post_stats" };
    return null;
  }
  return null;
}

export async function getUserAutoApprove(
  sql: any,
  userId: number
): Promise<boolean> {
  try {
    const rows =
      await sql`SELECT mai_auto_approve_tools FROM user_settings WHERE user_id = ${userId} LIMIT 1`;
    return Boolean(rows[0]?.mai_auto_approve_tools);
  } catch {
    return false;
  }
}
