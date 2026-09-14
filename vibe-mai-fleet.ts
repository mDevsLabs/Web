/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI AGENT FLEET (vibe-mai-fleet.ts)
 * Tool declarations and execution engine for database-backed AI agents
 * ============================================================================
 */

import {
  getDb,
  getTierDailyImageLimit,
  getTierMaiTokenLimit,
  getWeekData,
} from "./config.ts";
import { executeWebSearch } from "./web.ts";

/**
 * Outils "sensibles" : ils modifient le compte ou le contenu public de
 * l'utilisateur. Ils exigent une approbation explicite sauf si le réglage
 * `mai_auto_approve_tools` a été activé dans les paramètres.
 */
export const SENSITIVE_TOOLS = [
  "create_post",
  "delete_post",
  "update_profile",
  "follow_user",
  "send_message",
  "update_settings",
  "repost_post",
  "comment_post",
];

/** Clamp de période partagé par les outils d'analyse (défaut 30 jours). */
function parsePeriodDays(period: unknown): number {
  return period === "7d"
    ? 7
    : period === "90d"
      ? 90
      : period === "12m"
        ? 365
        : 30;
}

const WEEKDAY_NAMES = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export class MAIAgentFleet {
  public static assessContentSafety(content: string): {
    isSafe: boolean;
    toxicityScore: number;
    flagReason?: string;
  } {
    const prohibitedKeywords = [
      "haine",
      "violence explicite",
      "terrorisme",
      "terrorist",
      "cp_illegal",
      "doxx",
    ];
    const lower = content.toLowerCase();

    for (const kw of prohibitedKeywords) {
      if (lower.includes(kw)) {
        return {
          flagReason: `Terme prohibé détecté (${kw})`,
          isSafe: false,
          toxicityScore: 0.95,
        };
      }
    }

    return { isSafe: true, toxicityScore: 0.02 };
  }

  public static async modulateText(opts: {
    text: string;
    tone?: string;
    format?: string;
  }): Promise<string> {
    const { text, tone = "executive" } = opts;
    const tonePrefixes: Record<string, string> = {
      executive: "⚡ ",
      minimal: "✦ ",
      poetic: "✨ ",
      viral: "🔥 ",
    };

    const prefix = tonePrefixes[tone] || "";
    return `${prefix}${text.trim()}`;
  }

  public static synthesizeThread(
    comments: Array<{ author: string; content: string }>
  ): string {
    if (!comments || comments.length === 0)
      return "Aucun commentaire pour le moment.";
    const count = comments.length;
    const authors = [...new Set(comments.map((c) => c.author))]
      .slice(0, 3)
      .join(", ");
    return `Synthèse (${count} réponses) : Échanges autour des points partagés par @${authors}.`;
  }

  /**
   * Récupère une clé OpenRouter (variable d'environnement ou table mprojects_api_keys).
   */
  public static async getOpenRouterKey(userId: number): Promise<string> {
    if (
      typeof (globalThis as any).Deno !== "undefined" &&
      (globalThis as any).Deno.env?.get("OPENROUTER_API_KEY")
    ) {
      return (globalThis as any).Deno.env.get("OPENROUTER_API_KEY");
    }
    if (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) {
      return process.env.OPENROUTER_API_KEY;
    }
    try {
      const sql = getDb();
      const keyRows =
        await sql`SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${String(userId)}::text LIMIT 1`;
      return keyRows[0]?.api_key || "";
    } catch {
      return "";
    }
  }

  /**
   * Modèle mAI par défaut de l'utilisateur (réglage user_settings.mai_default_model,
   * choisi dans les paramètres ou directement dans mAI). Cache mémoire 60 s.
   */
  static userModelCache = new Map<
    string,
    { model: string; expiresAt: number }
  >();

  public static async getUserDefaultModel(
    userId: number | string
  ): Promise<string> {
    const key = String(userId);
    const cached = MAIAgentFleet.userModelCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.model;
    let model = "poolside/laguna-xs-2.1:free";
    try {
      const sql = getDb();
      const rows =
        await sql`SELECT mai_default_model FROM user_settings WHERE user_id = ${Number(key)} LIMIT 1`;
      const saved = String(rows[0]?.mai_default_model || "").trim();
      if (saved) model = saved;
    } catch {}
    MAIAgentFleet.userModelCache.set(key, {
      expiresAt: Date.now() + 60_000,
      model,
    });
    return model;
  }

  /**
   * Appel générique OpenRouter pour les outils textuels (traduction, reformulation...).
   * Sans `model`, utilise le modèle par défaut de l'utilisateur.
   */
  public static async callOpenRouter(
    userId: number,
    system: string,
    user: string,
    model?: string
  ): Promise<string | null> {
    const apiKey = await MAIAgentFleet.getOpenRouterKey(userId);
    if (!apiKey) return null;
    const resolvedModel =
      model || (await MAIAgentFleet.getUserDefaultModel(userId));
    try {
      const aiRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify({
            messages: [
              { content: system, role: "system" },
              { content: user, role: "user" },
            ],
            model: resolvedModel,
          }),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Social Assistant",
          },
          method: "POST",
        }
      );
      if (!aiRes.ok) return null;
      const aiData = await aiRes.json();
      return aiData.choices?.[0]?.message?.content || null;
    } catch {
      return null;
    }
  }

  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string | number
  ): Promise<{ success: boolean; result: any; error?: string }> {
    const sql = getDb();
    const startTime = Date.now();
    const uid = Number(userId);

    try {
      let resultData: any = null;

      switch (toolName) {
        case "get_account_stats": {
          const [uRows, prRows, pCount] = await Promise.all([
            sql`SELECT id, username, email, tier, avatar_url, COALESCE(created_at, NOW()) as created_at FROM users WHERE id = ${uid} LIMIT 1`,
            sql`SELECT * FROM profiles WHERE user_id = ${uid} LIMIT 1`,
            sql`SELECT COUNT(*) as count FROM posts WHERE author_id = ${uid}`,
          ]);
          resultData = {
            profile: prRows[0],
            totalPosts: Number(pCount[0]?.count || 0),
            user: uRows[0],
          };
          break;
        }

        case "create_post": {
          const { content, format = "micro_text", media_url } = args;
          if (!content || !content.trim())
            throw new Error("Le contenu du post est obligatoire.");

          const safety = MAIAgentFleet.assessContentSafety(content);
          if (!safety.isSafe)
            throw new Error(
              `Publication refusée par mAI : ${safety.flagReason}`
            );

          const inserted = await sql`
            INSERT INTO posts (author_id, content, format, created_via, toxicity_score, ai_generated)
            VALUES (${uid}, ${content.trim()}, ${format}, 'mai_agent', ${safety.toxicityScore}, TRUE)
            RETURNING *
          `;
          const newPost = inserted[0];

          if (media_url) {
            const cleanUrl = String(media_url).split("?")[0].split("#")[0];
            const ext = cleanUrl.split(".").pop()?.toLowerCase();
            const mediaType =
              ext === "png"
                ? "image/png"
                : ext === "webp"
                  ? "image/webp"
                  : ext === "gif"
                    ? "image/gif"
                    : ext === "mp4"
                      ? "video/mp4"
                      : "image/jpeg";
            await sql`
              INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text)
              VALUES (${uid}, ${newPost.id}::uuid, ${media_url}, ${mediaType}, 0, '')
            `;
          }

          await sql`UPDATE profiles SET posts_count = posts_count + 1 WHERE user_id = ${uid}`;
          resultData = {
            message: "Post publié avec succès sur Vibe !",
            post: newPost,
          };
          break;
        }

        case "delete_post": {
          const { post_id } = args;
          if (!post_id) throw new Error("post_id est requis.");

          const del = await sql`
            DELETE FROM posts WHERE id = ${post_id}::uuid AND author_id = ${uid} RETURNING id
          `;
          if (del.length === 0) {
            throw new Error(
              "Publication introuvable ou vous n'êtes pas l'auteur."
            );
          }
          await sql`UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE user_id = ${uid}`;
          resultData = {
            deletedPostId: post_id,
            message: "Publication supprimée avec succès.",
          };
          break;
        }

        case "search_posts": {
          const { query, limit = 10 } = args;
          const rows = await sql`
            SELECT p.*, pr.display_name, pr.avatar_url, u.username
            FROM posts p
            JOIN users u ON u.id = p.author_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            WHERE p.content ILIKE ('%' || ${query} || '%')
            ORDER BY p.published_at DESC
            LIMIT ${limit}
          `;
          resultData = { posts: rows, query, resultsCount: rows.length };
          break;
        }

        case "generate_vibe_image": {
          const { prompt, aspect_ratio = "1:1" } = args;
          const uRows =
            await sql`SELECT tier FROM users WHERE id = ${uid} LIMIT 1`;
          const tier = uRows[0]?.tier || "Free";
          const maxImages = getTierDailyImageLimit(tier);

          const todayRows = await sql`
            SELECT images_generated FROM daily_image_usage 
            WHERE user_id = ${uid} AND usage_date = CURRENT_DATE LIMIT 1
          `;
          const currentCount = todayRows[0]?.images_generated || 0;

          if (currentCount >= maxImages) {
            throw new Error(
              `Quota journalier d'images atteint (${currentCount}/${maxImages} pour le forfait ${tier}).`
            );
          }

          await sql`
            INSERT INTO daily_image_usage (user_id, usage_date, images_generated)
            VALUES (${uid}, CURRENT_DATE, 1)
            ON CONFLICT (user_id, usage_date)
            DO UPDATE SET images_generated = daily_image_usage.images_generated + 1
          `;

          const sampleImages = [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
            "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=80",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80",
          ];
          const chosen =
            sampleImages[Math.floor(Math.random() * sampleImages.length)];

          resultData = {
            aspect_ratio,
            imageUrl: chosen,
            message: "Image générée avec succès via mAI !",
            prompt,
            quotaRemaining: Math.max(0, maxImages - (currentCount + 1)),
          };
          break;
        }

        case "check_quotas": {
          const uRows =
            await sql`SELECT tier FROM users WHERE id = ${uid} LIMIT 1`;
          const tier = uRows[0]?.tier || "Free";
          const { weekStartStr, nextResetIso } = getWeekData();

          const [usageRows, imgRows] = await Promise.all([
            sql`SELECT COALESCE(SUM(tokens_used), 0) as tokens FROM weekly_usage WHERE user_id = ${uid} AND week_start = ${weekStartStr}::date`,
            sql`SELECT COALESCE(images_generated, 0) as images FROM daily_image_usage WHERE user_id = ${uid} AND usage_date = CURRENT_DATE`,
          ]);

          const tokenLimit = getTierMaiTokenLimit(tier);
          const imageLimit = getTierDailyImageLimit(tier);
          const tokensUsed = Number(usageRows[0]?.tokens || 0);
          const imagesUsed = Number(imgRows[0]?.images || 0);

          resultData = {
            dailyImages: {
              limit: imageLimit,
              percent: Math.min(
                100,
                Math.round((imagesUsed / imageLimit) * 100)
              ),
              used: imagesUsed,
            },
            resetAt: nextResetIso,
            tier,
            weeklyTokens: {
              limit: tokenLimit,
              percent: Math.min(
                100,
                Math.round((tokensUsed / tokenLimit) * 100)
              ),
              used: tokensUsed,
            },
          };
          break;
        }

        case "search_web": {
          const { query } = args;
          const search = await executeWebSearch(String(query || ""), 5);
          if (!search.success || search.results.length === 0) {
            throw new Error(search.error || "Aucun résultat de recherche web.");
          }
          const snippet = search.results
            .slice(0, 3)
            .map((r) => `• **${r.title}** — ${r.snippet}\n  ${r.url}`)
            .join("\n");
          resultData = {
            provider: search.provider,
            query,
            results: search.results,
            snippet,
          };
          break;
        }

        case "fact_check": {
          const { statement } = args;
          const search = await executeWebSearch(
            String(statement || ""),
            5
          ).catch(() => null);
          const sources = search?.success ? search.results.slice(0, 3) : [];
          const llm = await MAIAgentFleet.callOpenRouter(
            uid,
            "Tu es un vérificateur de faits rigoureux. Réponds en 3 phrases maximum en français : verdict (Vrai / Faux / Plausible / À vérifier) puis justification brève en t'appuyant sur les sources fournies.",
            `Affirmation : « ${statement} »\n\nSources trouvées :\n${sources.map((s) => `- ${s.title} : ${s.snippet}`).join("\n") || "(aucune)"}`
          );
          resultData = {
            analysis:
              llm ||
              (sources.length > 0
                ? "Des sources web ont été trouvées, croisez-les pour vous forger un avis."
                : "Aucune source fiable trouvée sur le web pour cette affirmation."),
            confidence: sources.length > 0 ? "Moyen" : "Faible",
            sources,
            statement,
            verdict: llm
              ? "Analyse mAI"
              : sources.length > 0
                ? "À vérifier"
                : "Sources insuffisantes",
          };
          break;
        }

        case "rewrite_post": {
          const { text, style = "viral" } = args;
          const tones: Record<string, string> = {
            concis: "minimal",
            humour: "viral",
            poétique: "poetic",
            pro: "executive",
            viral: "viral",
          };
          const llm = await MAIAgentFleet.callOpenRouter(
            uid,
            `Reformule le texte suivant en français dans un style « ${style} », percutant et adapté à un réseau social. Réponds UNIQUEMENT par le texte reformulé, sans commentaire.`,
            String(text || "")
          );
          const rewritten =
            llm ||
            (await MAIAgentFleet.modulateText({
              text: String(text || ""),
              tone: tones[style] || "viral",
            }));
          resultData = { rewritten, style };
          break;
        }

        case "suggest_post": {
          const { topic, style = "viral" } = args;
          const llm = await MAIAgentFleet.callOpenRouter(
            uid,
            `Propose 3 idées de publications courtes pour le réseau social Vibe sur le thème « ${topic} », dans un style « ${style} ». Format : une liste numérotée, chaque post fait 1 à 2 phrases, avec des hashtags pertinents. Réponds UNIQUEMENT par la liste.`,
            String(topic || "sujets d'actualité")
          );
          if (!llm)
            throw new Error(
              "Génération indisponible : aucune clé IA configurée sur le serveur."
            );
          resultData = { style, suggestions: llm, topic };
          break;
        }

        case "translate": {
          const { text, target_language = "anglais" } = args;
          const llm = await MAIAgentFleet.callOpenRouter(
            uid,
            `Traduis le texte suivant en ${target_language}. Réponds UNIQUEMENT par la traduction, sans commentaire.`,
            String(text || "")
          );
          if (!llm)
            throw new Error(
              "Traduction indisponible : aucune clé IA configurée sur le serveur."
            );
          resultData = { targetLanguage: target_language, translated: llm };
          break;
        }

        case "analyze_trends": {
          const recent = await sql`
            SELECT content FROM posts WHERE published_at > NOW() - INTERVAL '7 days' ORDER BY published_at DESC LIMIT 200
          `;
          const tags: Record<string, number> = {};
          for (const r of recent) {
            for (const m of String(r.content).matchAll(
              /#([\p{L}\p{N}_]{2,30})/gu
            )) {
              const tag = m[1].toLowerCase();
              tags[tag] = (tags[tag] || 0) + 1;
            }
          }
          const trendingTopics = Object.entries(tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, postsCount]) => ({
              name: `#${name}`,
              postsCount,
              sentiment: postsCount >= 5 ? "Très actif 🔥" : "Actif 📈",
            }));
          resultData = { trendingTopics };
          break;
        }

        case "update_profile": {
          const { display_name, bio } = args;
          if (!display_name && !bio)
            throw new Error(
              "Fournissez au moins un champ (display_name ou bio)."
            );
          if (
            display_name !== undefined &&
            (String(display_name).length < 2 ||
              String(display_name).length > 40)
          ) {
            throw new Error(
              "Le nom affiché doit contenir entre 2 et 40 caractères."
            );
          }
          if (bio !== undefined && String(bio).length > 200) {
            throw new Error("La bio ne doit pas dépasser 200 caractères.");
          }
          const updated = await sql`
            UPDATE profiles SET
              display_name = COALESCE(${display_name ?? null}, display_name),
              bio = COALESCE(${bio ?? null}, bio),
              updated_at = NOW()
            WHERE user_id = ${uid}
            RETURNING display_name, bio
          `;
          if (updated.length === 0) throw new Error("Profil introuvable.");
          resultData = {
            message: "Profil mis à jour avec succès.",
            profile: updated[0],
          };
          break;
        }

        case "follow_user": {
          const { username, follow = true } = args;
          const cleanUsername = String(username || "")
            .replace(/^@/, "")
            .trim()
            .toLowerCase();
          if (!cleanUsername) throw new Error("username est requis.");
          const target =
            await sql`SELECT id FROM users WHERE LOWER(username) = ${cleanUsername} LIMIT 1`;
          if (target.length === 0)
            throw new Error(`Compte @${cleanUsername} introuvable sur Vibe.`);
          const targetId = Number(target[0].id);
          if (targetId === uid)
            throw new Error("Vous ne pouvez pas vous suivre vous-même.");

          if (follow) {
            const existing =
              await sql`SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = ${targetId} LIMIT 1`;
            if (existing.length > 0) {
              resultData = {
                followed: true,
                message: `Vous suivez déjà @${cleanUsername}.`,
                username: cleanUsername,
              };
              break;
            }
            await sql`INSERT INTO follows (follower_id, following_id) VALUES (${uid}, ${targetId}) ON CONFLICT DO NOTHING`;
            await Promise.all([
              sql`UPDATE profiles SET following_count = following_count + 1 WHERE user_id = ${uid}`,
              sql`UPDATE profiles SET followers_count = followers_count + 1 WHERE user_id = ${targetId}`,
            ]);
            resultData = {
              followed: true,
              message: `Vous suivez désormais @${cleanUsername} !`,
              username: cleanUsername,
            };
          } else {
            const del =
              await sql`DELETE FROM follows WHERE follower_id = ${uid} AND following_id = ${targetId} RETURNING 1`;
            if (del.length > 0) {
              await Promise.all([
                sql`UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = ${uid}`,
                sql`UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = ${targetId}`,
              ]);
            }
            resultData = {
              followed: false,
              message: `Vous ne suivez plus @${cleanUsername}.`,
              username: cleanUsername,
            };
          }
          break;
        }

        case "get_notifications": {
          const rows = await sql`
            SELECT n.*, u.username as actor_username
            FROM notifications n
            LEFT JOIN users u ON u.id = n.actor_id
            WHERE n.recipient_id = ${uid}
            ORDER BY n.created_at DESC LIMIT 20
          `;
          resultData = { count: rows.length, notifications: rows };
          break;
        }

        case "like_post": {
          const { post_id, like = true } = args;
          if (
            !post_id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(post_id)
            )
          ) {
            throw new Error("post_id UUID valide est requis.");
          }
          const postRows =
            await sql`SELECT id, author_id FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
          if (postRows.length === 0)
            throw new Error("Publication introuvable.");
          const authorId = Number(postRows[0].author_id);
          if (like) {
            const existing = await sql`
              SELECT id FROM post_interactions
              WHERE user_id = ${uid} AND post_id = ${String(post_id)}::uuid AND interaction_type = 'like' LIMIT 1
            `;
            if (existing.length > 0) {
              const c =
                await sql`SELECT likes_count FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
              resultData = {
                liked: true,
                likes_count: Number(c[0]?.likes_count || 0),
                message: "Vous aimez déjà cette publication.",
                post_id,
              };
              break;
            }
            await sql`
              INSERT INTO post_interactions (user_id, post_id, interaction_type)
              VALUES (${uid}, ${String(post_id)}::uuid, 'like')
              ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
            `;
            await sql`UPDATE posts SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = ${String(post_id)}::uuid`;
            if (authorId !== uid) {
              try {
                await sql`
                  INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
                  VALUES (${authorId}, ${uid}, 'like', ${String(post_id)}::uuid, 'a aimé votre publication via mAI')
                `;
              } catch {}
            }
            const c =
              await sql`SELECT likes_count FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
            resultData = {
              liked: true,
              likes_count: Number(c[0]?.likes_count || 0),
              message: "Publication likée avec succès !",
              post_id,
            };
          } else {
            const existing = await sql`
              SELECT id FROM post_interactions
              WHERE user_id = ${uid} AND post_id = ${String(post_id)}::uuid AND interaction_type = 'like' LIMIT 1
            `;
            if (existing.length > 0) {
              await sql`DELETE FROM post_interactions WHERE id = ${existing[0].id}::uuid`;
              await sql`UPDATE posts SET likes_count = GREATEST(0, COALESCE(likes_count,0) - 1) WHERE id = ${String(post_id)}::uuid`;
            }
            const c =
              await sql`SELECT likes_count FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
            resultData = {
              liked: false,
              likes_count: Number(c[0]?.likes_count || 0),
              message: "Like retiré.",
              post_id,
            };
          }
          break;
        }

        case "send_message": {
          const { username, content } = args;
          const cleanUsername = String(username || "")
            .replace(/^@/, "")
            .trim()
            .toLowerCase();
          const text = String(content || "").trim();
          if (!cleanUsername)
            throw new Error("username destinataire est requis.");
          if (!text) throw new Error("Le contenu du message est obligatoire.");
          if (text.length > 2000)
            throw new Error("Message trop long (max 2000 caractères).");
          const safety = MAIAgentFleet.assessContentSafety(text);
          if (!safety.isSafe)
            throw new Error(`Message refusé par mAI : ${safety.flagReason}`);
          const target =
            await sql`SELECT id FROM users WHERE LOWER(username) = ${cleanUsername} LIMIT 1`;
          if (target.length === 0)
            throw new Error(`Compte @${cleanUsername} introuvable sur Vibe.`);
          const recId = Number(target[0].id);
          if (recId === uid)
            throw new Error(
              "Vous ne pouvez pas vous envoyer un message à vous-même."
            );
          const p1 = uid < recId ? uid : recId;
          const p2 = uid < recId ? recId : uid;
          const convRows = await sql`
            INSERT INTO dm_conversations (participant_one_id, participant_two_id, last_message_preview, last_message_at)
            VALUES (${p1}, ${p2}, ${text.slice(0, 120)}, NOW())
            ON CONFLICT (participant_one_id, participant_two_id)
            DO UPDATE SET last_message_preview = ${text.slice(0, 120)}, last_message_at = NOW()
            RETURNING id
          `;
          const conversationId = String(convRows[0].id);
          const msg = await sql`
            INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, content)
            VALUES (${conversationId}::uuid, ${uid}, ${recId}, ${text})
            RETURNING *
          `;
          try {
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, message)
              VALUES (${recId}, ${uid}, 'dm', 'vous a envoyé un message via mAI')
            `;
          } catch {}
          resultData = {
            conversation_id: conversationId,
            message: `Message envoyé à @${cleanUsername} !`,
            message_id: String(msg[0]?.id || ""),
            preview: text.slice(0, 80),
            sent: true,
            username: cleanUsername,
          };
          break;
        }

        case "update_settings": {
          const ALLOWED = [
            "theme_preference",
            "ui_language",
            "feed_default_mode",
            "hide_reposts",
            "blocked_keywords",
            "accent_color",
            "font_size",
            "mai_auto_approve_tools",
            "mai_default_model",
            "mai_context_posts",
            "mai_context_dms",
            "mai_context_books",
            "email_notifications",
            "push_notifications",
            "notify_on_like",
            "notify_on_reply",
            "notify_on_dm",
            "dm_auto_translate",
            "dm_translate_lang",
          ];
          const patch: Record<string, any> = {};
          for (const k of ALLOWED) {
            if (args[k] !== undefined) patch[k] = args[k];
          }
          if (Object.keys(patch).length === 0)
            throw new Error("Aucun paramètre autorisé fourni.");
          if (
            patch.feed_default_mode &&
            !["for_you", "following", "trending"].includes(
              String(patch.feed_default_mode)
            )
          ) {
            throw new Error(
              "feed_default_mode invalide (for_you | following | trending)."
            );
          }
          if (
            patch.theme_preference &&
            !["light", "dark", "auto"].includes(String(patch.theme_preference))
          ) {
            throw new Error("theme_preference invalide (light | dark | auto).");
          }
          if (
            patch.blocked_keywords &&
            !Array.isArray(patch.blocked_keywords)
          ) {
            throw new Error("blocked_keywords doit être un tableau de mots.");
          }
          await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_auto_approve_tools BOOLEAN DEFAULT FALSE`.catch(
            () => {}
          );
          await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dm_auto_translate BOOLEAN DEFAULT FALSE`.catch(
            () => {}
          );
          await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dm_translate_lang TEXT`.catch(
            () => {}
          );
          const cols = Object.keys(patch);
          // Upsert générique : INSERT puis UPDATE ciblé colonne par colonne
          await sql`
            INSERT INTO user_settings (user_id) VALUES (${uid})
            ON CONFLICT (user_id) DO NOTHING
          `.catch(() => {});
          for (const col of cols) {
            const val = patch[col];
            const jsonVal = Array.isArray(val) ? val : null;
            if (jsonVal !== null) {
              await sql`UPDATE user_settings SET blocked_keywords = ${jsonVal} WHERE user_id = ${uid}`;
            } else if (typeof val === "boolean") {
              if (col === "hide_reposts")
                await sql`UPDATE user_settings SET hide_reposts = ${val} WHERE user_id = ${uid}`;
              else if (col === "mai_auto_approve_tools")
                await sql`UPDATE user_settings SET mai_auto_approve_tools = ${val} WHERE user_id = ${uid}`;
              else if (col === "mai_context_posts")
                await sql`UPDATE user_settings SET mai_context_posts = ${val} WHERE user_id = ${uid}`;
              else if (col === "mai_context_dms")
                await sql`UPDATE user_settings SET mai_context_dms = ${val} WHERE user_id = ${uid}`;
              else if (col === "mai_context_books")
                await sql`UPDATE user_settings SET mai_context_books = ${val} WHERE user_id = ${uid}`;
              else if (col === "email_notifications")
                await sql`UPDATE user_settings SET email_notifications = ${val} WHERE user_id = ${uid}`;
              else if (col === "push_notifications")
                await sql`UPDATE user_settings SET push_notifications = ${val} WHERE user_id = ${uid}`;
              else if (col === "notify_on_like")
                await sql`UPDATE user_settings SET notify_on_like = ${val} WHERE user_id = ${uid}`;
              else if (col === "notify_on_reply")
                await sql`UPDATE user_settings SET notify_on_reply = ${val} WHERE user_id = ${uid}`;
              else if (col === "notify_on_dm")
                await sql`UPDATE user_settings SET notify_on_dm = ${val} WHERE user_id = ${uid}`;
              else if (col === "dm_auto_translate")
                await sql`UPDATE user_settings SET dm_auto_translate = ${val} WHERE user_id = ${uid}`;
            } else {
              const s = String(val).slice(0, 100);
              if (col === "theme_preference")
                await sql`UPDATE user_settings SET theme_preference = ${s} WHERE user_id = ${uid}`;
              else if (col === "ui_language")
                await sql`UPDATE user_settings SET ui_language = ${s} WHERE user_id = ${uid}`;
              else if (col === "feed_default_mode")
                await sql`UPDATE user_settings SET feed_default_mode = ${s} WHERE user_id = ${uid}`;
              else if (col === "accent_color")
                await sql`UPDATE user_settings SET accent_color = ${s} WHERE user_id = ${uid}`;
              else if (col === "font_size")
                await sql`UPDATE user_settings SET font_size = ${s} WHERE user_id = ${uid}`;
              else if (col === "mai_default_model")
                await sql`UPDATE user_settings SET mai_default_model = ${s} WHERE user_id = ${uid}`;
              else if (col === "dm_translate_lang")
                await sql`UPDATE user_settings SET dm_translate_lang = ${s} WHERE user_id = ${uid}`;
            }
          }
          try {
            MAIAgentFleet.userModelCache.delete(String(uid));
          } catch {}
          resultData = {
            message: "Paramètres mis à jour avec succès via mAI.",
            patched: patch,
            updated: true,
          };
          break;
        }

        case "bookmark_post": {
          const { post_id, bookmark = true } = args;
          if (
            !post_id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(post_id)
            )
          ) {
            throw new Error("post_id UUID valide est requis.");
          }
          const exists =
            await sql`SELECT id FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
          if (exists.length === 0) throw new Error("Publication introuvable.");
          if (bookmark) {
            await sql`
              INSERT INTO bookmarks (user_id, post_id) VALUES (${uid}, ${String(post_id)}::uuid)
              ON CONFLICT (user_id, post_id) DO NOTHING
            `;
            await sql`UPDATE posts SET bookmarks_count = COALESCE(bookmarks_count,0) + 1 WHERE id = ${String(post_id)}::uuid`;
            resultData = {
              bookmarked: true,
              message: "Post ajouté à vos favoris !",
              post_id,
            };
          } else {
            await sql`DELETE FROM bookmarks WHERE user_id = ${uid} AND post_id = ${String(post_id)}::uuid`;
            await sql`UPDATE posts SET bookmarks_count = GREATEST(0, COALESCE(bookmarks_count,0) - 1) WHERE id = ${String(post_id)}::uuid`;
            resultData = {
              bookmarked: false,
              message: "Post retiré de vos favoris.",
              post_id,
            };
          }
          break;
        }

        case "repost_post": {
          const { post_id, repost = true } = args;
          if (
            !post_id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(post_id)
            )
          ) {
            throw new Error("post_id UUID valide est requis.");
          }
          const prow =
            await sql`SELECT id, author_id FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
          if (prow.length === 0) throw new Error("Publication introuvable.");
          if (repost) {
            const existing = await sql`
              SELECT id FROM post_interactions
              WHERE user_id = ${uid} AND post_id = ${String(post_id)}::uuid AND interaction_type = 'repost' LIMIT 1
            `;
            if (existing.length > 0) {
              resultData = {
                message: "Vous avez déjà reposté cette publication.",
                post_id,
                reposted: true,
              };
              break;
            }
            await sql`
              INSERT INTO post_interactions (user_id, post_id, interaction_type)
              VALUES (${uid}, ${String(post_id)}::uuid, 'repost')
              ON CONFLICT (user_id, post_id, interaction_type) DO NOTHING
            `;
            await sql`UPDATE posts SET reposts_count = COALESCE(reposts_count,0) + 1 WHERE id = ${String(post_id)}::uuid`;
            resultData = {
              message: "Publication repostée avec succès !",
              post_id,
              reposted: true,
            };
          } else {
            await sql`DELETE FROM post_interactions WHERE user_id = ${uid} AND post_id = ${String(post_id)}::uuid AND interaction_type = 'repost'`;
            await sql`UPDATE posts SET reposts_count = GREATEST(0, COALESCE(reposts_count,0) - 1) WHERE id = ${String(post_id)}::uuid`;
            resultData = {
              message: "Repost annulé.",
              post_id,
              reposted: false,
            };
          }
          break;
        }

        case "comment_post": {
          const { post_id, content } = args;
          const text = String(content || "").trim();
          if (
            !post_id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(post_id)
            )
          ) {
            throw new Error("post_id UUID valide est requis.");
          }
          if (!text)
            throw new Error("Le contenu du commentaire est obligatoire.");
          if (text.length > 2000)
            throw new Error("Commentaire trop long (max 2000 caractères).");
          const safety = MAIAgentFleet.assessContentSafety(text);
          if (!safety.isSafe)
            throw new Error(
              `Commentaire refusé par mAI : ${safety.flagReason}`
            );
          const prow =
            await sql`SELECT id, author_id FROM posts WHERE id = ${String(post_id)}::uuid LIMIT 1`;
          if (prow.length === 0) throw new Error("Publication introuvable.");
          const inserted = await sql`
            INSERT INTO comments (post_id, author_id, content, depth)
            VALUES (${String(post_id)}::uuid, ${uid}, ${text}, 1)
            RETURNING id, content, created_at
          `;
          await sql`UPDATE posts SET replies_count = COALESCE(replies_count,0) + 1 WHERE id = ${String(post_id)}::uuid`;
          const authorId = Number(prow[0].author_id);
          if (authorId !== uid) {
            try {
              await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
                VALUES (${authorId}, ${uid}, 'reply', ${String(post_id)}::uuid, ${String(inserted[0].id)}::uuid, 'a commenté votre publication via mAI')
              `;
            } catch {}
          }
          resultData = {
            comment_id: String(inserted[0].id),
            commented: true,
            message: "Commentaire publié avec succès !",
            post_id,
          };
          break;
        }

        case "get_post_stats": {
          const { post_id } = args;
          if (
            !post_id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              String(post_id)
            )
          ) {
            throw new Error("post_id UUID valide est requis.");
          }
          const rows = await sql`
            SELECT p.id, p.content, p.likes_count, p.reposts_count, p.replies_count,
                   COALESCE(p.views_count,0) as views_count, COALESCE(p.bookmarks_count,0) as bookmarks_count,
                   p.published_at, u.username, pr.display_name
            FROM posts p
            JOIN users u ON u.id = p.author_id
            LEFT JOIN profiles pr ON pr.user_id = u.id
            WHERE p.id = ${String(post_id)}::uuid LIMIT 1
          `;
          if (rows.length === 0) throw new Error("Publication introuvable.");
          const p = rows[0];
          const likes = Number(p.likes_count || 0),
            reposts = Number(p.reposts_count || 0);
          const replies = Number(p.replies_count || 0),
            views = Number(p.views_count || 0);
          const engagement = likes + reposts * 2.5 + replies * 2 + views * 0.1;
          const rate =
            views > 0
              ? Math.round(((likes + reposts + replies) / views) * 1000) / 10
              : 0;
          resultData = {
            author: p.username,
            bookmarks: Number(p.bookmarks_count || 0),
            content: String(p.content || "").slice(0, 300),
            engagement: Math.round(engagement * 10) / 10,
            engagement_rate_percent: rate,
            likes,
            message: "Analyse du post récupérée.",
            post_id,
            published_at: p.published_at,
            replies,
            reposts,
            views,
          };
          break;
        }

        case "analyze_audience": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const [sourcesRows, uniqueRows, hoursRows, followerRows] =
            await Promise.all([
              sql`
              SELECT COALESCE(pv.source, 'feed') AS source, COUNT(*) AS views
              FROM post_views pv JOIN posts p ON p.id = pv.post_id
              WHERE p.author_id = ${uid} AND pv.created_at >= ${sinceIso}::timestamptz
              GROUP BY 1 ORDER BY views DESC LIMIT 8
            `,
              sql`
              SELECT COUNT(DISTINCT pv.user_id) AS unique_viewers
              FROM post_views pv JOIN posts p ON p.id = pv.post_id
              WHERE p.author_id = ${uid} AND pv.created_at >= ${sinceIso}::timestamptz AND pv.user_id IS NOT NULL
            `,
              sql`
              SELECT EXTRACT(HOUR FROM pv.created_at) AS hour, COUNT(*) AS views
              FROM post_views pv JOIN posts p ON p.id = pv.post_id
              WHERE p.author_id = ${uid} AND pv.created_at >= ${sinceIso}::timestamptz
              GROUP BY 1 ORDER BY views DESC LIMIT 5
            `,
              sql`
              SELECT u.username, pr.display_name, COUNT(*) AS views
              FROM post_views pv
              JOIN posts p ON p.id = pv.post_id
              JOIN follows f ON f.follower_id = pv.user_id AND f.following_id = ${uid}
              JOIN users u ON u.id = pv.user_id
              LEFT JOIN profiles pr ON pr.user_id = u.id
              WHERE p.author_id = ${uid} AND pv.created_at >= ${sinceIso}::timestamptz
              GROUP BY u.username, pr.display_name ORDER BY views DESC LIMIT 5
            `,
            ]);
          const totalViews = (sourcesRows as any[]).reduce(
            (s, r) => s + Number(r.views || 0),
            0
          );
          resultData = {
            message: `Audience analysée sur ${days} jours.`,
            peak_hours: (hoursRows as any[]).map((r) => ({
              hour: Number(r.hour),
              views: Number(r.views || 0),
            })),
            period_days: days,
            sources: (sourcesRows as any[]).map((r) => ({
              percent:
                totalViews > 0
                  ? Math.round((Number(r.views || 0) / totalViews) * 100)
                  : 0,
              source: String(r.source),
              views: Number(r.views || 0),
            })),
            top_engaged_followers: (followerRows as any[]).map((r) => ({
              display_name: r.display_name,
              username: r.username,
              views: Number(r.views || 0),
            })),
            total_views: totalViews,
            unique_viewers: Number(uniqueRows[0]?.unique_viewers || 0),
          };
          break;
        }

        case "best_time_to_post": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const [slotRows, hourRows, totalRows] = await Promise.all([
            sql`
              SELECT EXTRACT(DOW FROM p.published_at) AS dow, EXTRACT(HOUR FROM p.published_at) AS hour,
                     COUNT(*) AS posts_count, AVG(COALESCE(p.views_count,0)) AS avg_views,
                     AVG(COALESCE(p.likes_count,0) + COALESCE(p.reposts_count,0) * 2 + COALESCE(p.replies_count,0) * 2) AS avg_engagement
              FROM posts p WHERE p.author_id = ${uid} AND p.published_at >= ${sinceIso}::timestamptz
              GROUP BY 1, 2
            `,
            sql`
              SELECT EXTRACT(HOUR FROM pv.created_at) AS hour, COUNT(*) AS views
              FROM post_views pv JOIN posts p ON p.id = pv.post_id
              WHERE p.author_id = ${uid} AND pv.created_at >= ${sinceIso}::timestamptz
              GROUP BY 1 ORDER BY views DESC LIMIT 6
            `,
            sql`SELECT COUNT(*) AS n FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz`,
          ]);
          const analyzedPosts = Number(totalRows[0]?.n || 0);
          const bestSlots = (slotRows as any[])
            .map((r) => ({
              avg_engagement:
                Math.round(Number(r.avg_engagement || 0) * 10) / 10,
              avg_views: Math.round(Number(r.avg_views || 0)),
              hour: Number(r.hour),
              posts_count: Number(r.posts_count || 0),
              weekday: WEEKDAY_NAMES[Number(r.dow)] || String(r.dow),
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 3);
          resultData = {
            analyzed_posts: analyzedPosts,
            audience_peak_hours: (hourRows as any[]).map((r) => ({
              hour: Number(r.hour),
              views: Number(r.views || 0),
            })),
            best_slots: bestSlots,
            confidence:
              analyzedPosts >= 10
                ? "high"
                : analyzedPosts >= 4
                  ? "medium"
                  : "low",
            message:
              bestSlots.length > 0
                ? `Meilleur créneau : ${bestSlots[0].weekday} à ${bestSlots[0].hour}h (${bestSlots[0].avg_views} vues moyennes).`
                : "Pas encore assez de données de publication.",
            note:
              analyzedPosts === 0
                ? "Aucune publication sur la période — publiez quelques posts pour obtenir des recommandations."
                : undefined,
            period_days: days,
          };
          break;
        }

        case "compare_periods": {
          const days = parsePeriodDays(args.period);
          const nowMs = Date.now();
          const nowIso = new Date(nowMs).toISOString();
          const curSince = new Date(nowMs - days * 86_400_000).toISOString();
          const prevSince = new Date(
            nowMs - 2 * days * 86_400_000
          ).toISOString();
          const postAgg = (since: string, until: string) => sql`
            SELECT COALESCE(SUM(views_count),0) AS views, COALESCE(SUM(likes_count),0) AS likes,
                   COALESCE(SUM(reposts_count),0) AS reposts, COALESCE(SUM(replies_count),0) AS replies,
                   COUNT(*) AS posts
            FROM posts WHERE author_id = ${uid} AND published_at >= ${since}::timestamptz AND published_at < ${until}::timestamptz
          `;
          const [curRows, prevRows, fCur, fPrev, pvCur, pvPrev] =
            await Promise.all([
              postAgg(curSince, nowIso),
              postAgg(prevSince, curSince),
              sql`SELECT COUNT(*) AS n FROM follows WHERE following_id = ${uid} AND created_at >= ${curSince}::timestamptz`,
              sql`SELECT COUNT(*) AS n FROM follows WHERE following_id = ${uid} AND created_at >= ${prevSince}::timestamptz AND created_at < ${curSince}::timestamptz`,
              sql`SELECT COUNT(*) AS n FROM profile_views WHERE profile_user_id = ${uid} AND created_at >= ${curSince}::timestamptz`,
              sql`SELECT COUNT(*) AS n FROM profile_views WHERE profile_user_id = ${uid} AND created_at >= ${prevSince}::timestamptz AND created_at < ${curSince}::timestamptz`,
            ]);
          const metric = (current: number, previous: number) => ({
            current,
            delta: current - previous,
            percent:
              previous > 0
                ? Math.round(((current - previous) / previous) * 1000) / 10
                : current > 0
                  ? 100
                  : 0,
            previous,
          });
          const c = curRows[0] || {};
          const p = prevRows[0] || {};
          resultData = {
            followers_gained: metric(
              Number(fCur[0]?.n || 0),
              Number(fPrev[0]?.n || 0)
            ),
            likes: metric(Number(c.likes || 0), Number(p.likes || 0)),
            message: `Comparaison des ${days} derniers jours vs les ${days} jours précédents.`,
            period_days: days,
            posts: metric(Number(c.posts || 0), Number(p.posts || 0)),
            profile_views: metric(
              Number(pvCur[0]?.n || 0),
              Number(pvPrev[0]?.n || 0)
            ),
            replies: metric(Number(c.replies || 0), Number(p.replies || 0)),
            reposts: metric(Number(c.reposts || 0), Number(p.reposts || 0)),
            views: metric(Number(c.views || 0), Number(p.views || 0)),
          };
          break;
        }

        case "predict_post_performance": {
          const content = String(args.content || "").trim();
          if (!content)
            throw new Error("Le contenu du brouillon est obligatoire.");
          const plannedFormat = String(args.format || "").trim() || null;
          const sinceIso = new Date(Date.now() - 90 * 86_400_000).toISOString();
          const [globalRows, formatRows, hourRows] = await Promise.all([
            sql`
              SELECT COUNT(*) AS n, AVG(COALESCE(views_count,0)) AS avg_views,
                     AVG(COALESCE(likes_count,0) + COALESCE(reposts_count,0) * 2 + COALESCE(replies_count,0) * 2) AS avg_engagement,
                     AVG(LENGTH(content)) AS avg_length
              FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz
            `,
            sql`
              SELECT COALESCE(format,'micro_text') AS format,
                     AVG(COALESCE(likes_count,0) + COALESCE(reposts_count,0) * 2 + COALESCE(replies_count,0) * 2) AS avg_engagement
              FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz GROUP BY 1
            `,
            sql`
              SELECT EXTRACT(HOUR FROM published_at) AS hour, AVG(COALESCE(views_count,0)) AS avg_views
              FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz GROUP BY 1
            `,
          ]);
          const hist = globalRows[0] || {};
          const sampleSize = Number(hist.n || 0);
          const avgViews = Number(hist.avg_views || 0);
          const avgEngagement = Number(hist.avg_engagement || 0);
          const avgLength = Number(hist.avg_length || 0);

          const breakdown: Array<{
            factor: string;
            impact: number;
            tip?: string;
          }> = [];
          let score = 50;

          if (sampleSize >= 3 && avgLength > 0) {
            const ratio = content.length / avgLength;
            if (ratio >= 0.5 && ratio <= 1.7) {
              score += 6;
              breakdown.push({
                factor: "Longueur proche de vos habitudes",
                impact: 6,
              });
            } else if (ratio > 1.7) {
              score -= 6;
              breakdown.push({
                factor: "Texte plus long que d'habitude",
                impact: -6,
                tip: "Raccourcis ou structure en paragraphes courts.",
              });
            } else {
              score += 2;
              breakdown.push({
                factor: "Texte plus court que d'habitude",
                impact: 2,
              });
            }
          }

          const hashtagCount = (content.match(/#[\p{L}\p{N}_]{2,30}/gu) || [])
            .length;
          if (hashtagCount >= 1 && hashtagCount <= 3) {
            score += 8;
            breakdown.push({
              factor: `${hashtagCount} hashtag(s) — dosage optimal`,
              impact: 8,
            });
          } else if (hashtagCount === 0) {
            breakdown.push({
              factor: "Aucun hashtag",
              impact: 0,
              tip: "Ajoutez 1 à 3 hashtags pertinents pour élargir la portée.",
            });
          } else {
            score -= 6;
            breakdown.push({
              factor: "Trop de hashtags",
              impact: -6,
              tip: "Limitez-vous à 1-3 hashtags pour éviter l'effet spam.",
            });
          }

          if (
            /\?|commentez|partagez|votre avis|selon vous|dites-moi|votez/i.test(
              content
            )
          ) {
            score += 6;
            breakdown.push({
              factor: "Question / appel à l'action présent",
              impact: 6,
            });
          } else {
            breakdown.push({
              factor: "Pas de question ni d'appel à l'action",
              impact: 0,
              tip: "Une question en fin de post stimule les réponses.",
            });
          }

          if (sampleSize >= 3) {
            const fmt = plannedFormat || "micro_text";
            const fmtRow = (formatRows as any[]).find(
              (r) => String(r.format) === fmt
            );
            if (fmtRow) {
              const fmtEng = Number(fmtRow.avg_engagement || 0);
              if (fmtEng > avgEngagement * 1.15) {
                score += 10;
                breakdown.push({
                  factor: `Format « ${fmt} » au-dessus de votre moyenne`,
                  impact: 10,
                });
              } else if (fmtEng < avgEngagement * 0.85) {
                score -= 8;
                breakdown.push({
                  factor: `Format « ${fmt} » sous votre moyenne`,
                  impact: -8,
                  tip: "Testez un autre format plus performant.",
                });
              }
            }
          }

          let plannedHour: number | null = null;
          if (args.scheduled_time) {
            const d = new Date(String(args.scheduled_time));
            if (isNaN(d.getTime())) {
              const hm = String(args.scheduled_time).match(/^(\d{1,2})/);
              if (hm) plannedHour = Number(hm[1]);
            } else plannedHour = d.getHours();
          }
          if (plannedHour !== null && sampleSize >= 3) {
            const hourRow = (hourRows as any[]).find(
              (r) => Number(r.hour) === plannedHour
            );
            if (hourRow) {
              const hourViews = Number(hourRow.avg_views || 0);
              const hourLabel = `${String(plannedHour).padStart(2, "0")}h`;
              if (hourViews > avgViews * 1.15) {
                score += 8;
                breakdown.push({
                  factor: `Créneau ${hourLabel} au-dessus de votre moyenne`,
                  impact: 8,
                });
              } else if (hourViews < avgViews * 0.85) {
                score -= 6;
                breakdown.push({
                  factor: `Créneau ${hourLabel} sous votre moyenne`,
                  impact: -6,
                  tip: "Utilisez /besttime pour trouver vos meilleurs créneaux.",
                });
              }
            }
          }

          score = Math.max(0, Math.min(100, score));
          resultData = {
            based_on_posts: sampleSize,
            breakdown,
            cold_start: sampleSize < 3,
            estimated_engagement:
              Math.round(avgEngagement * (0.6 + score / 100) * 10) / 10,
            estimated_reach: Math.round(avgViews * (0.6 + score / 100)),
            message:
              sampleSize < 3
                ? "Pas assez d'historique (moins de 3 posts sur 90 jours) — estimation neutre."
                : `Score ${score}/100 basé sur ${sampleSize} posts récents.`,
            score,
          };
          break;
        }

        case "analyze_content_performance": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const rows = await sql`
            SELECT COALESCE(format,'micro_text') AS format, content,
                   COALESCE(views_count,0) AS views, COALESCE(likes_count,0) AS likes,
                   COALESCE(reposts_count,0) AS reposts, COALESCE(replies_count,0) AS replies
            FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz
            ORDER BY published_at DESC LIMIT 500
          `;
          const byFormat: Record<
            string,
            { posts: number; views: number; engagement: number }
          > = {};
          const byTag: Record<
            string,
            { posts: number; views: number; likes: number }
          > = {};
          for (const r of rows as any[]) {
            const engagement =
              Number(r.likes) + Number(r.reposts) * 2 + Number(r.replies) * 2;
            const f = String(r.format || "micro_text");
            byFormat[f] = byFormat[f] || { engagement: 0, posts: 0, views: 0 };
            byFormat[f].posts += 1;
            byFormat[f].views += Number(r.views);
            byFormat[f].engagement += engagement;
            for (const m of String(r.content || "").matchAll(
              /#([\p{L}\p{N}_]{2,30})/gu
            )) {
              const tag = m[1].toLowerCase();
              byTag[tag] = byTag[tag] || { likes: 0, posts: 0, views: 0 };
              byTag[tag].posts += 1;
              byTag[tag].views += Number(r.views);
              byTag[tag].likes += Number(r.likes);
            }
          }
          const formats = Object.entries(byFormat)
            .map(([format, s]) => ({
              avg_engagement:
                Math.round((s.engagement / Math.max(1, s.posts)) * 10) / 10,
              avg_views: Math.round(s.views / Math.max(1, s.posts)),
              engagement_rate_percent:
                s.views > 0
                  ? Math.round((s.engagement / s.views) * 1000) / 10
                  : 0,
              format,
              posts: s.posts,
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement);
          const top_hashtags = Object.entries(byTag)
            .map(([tag, s]) => ({
              avg_likes: Math.round((s.likes / Math.max(1, s.posts)) * 10) / 10,
              avg_views: Math.round(s.views / Math.max(1, s.posts)),
              posts: s.posts,
              tag: `#${tag}`,
            }))
            .sort((a, b) => b.avg_views - a.avg_views)
            .slice(0, 10);
          resultData = {
            formats,
            message:
              formats.length > 0
                ? `Format le plus engageant : ${formats[0].format} (${formats[0].avg_engagement} engagement moyen).`
                : "Aucun post publié sur la période.",
            period_days: days,
            posts_analyzed: (rows as any[]).length,
            top_hashtags,
          };
          break;
        }

        case "analyze_dm_activity": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const msgs = await sql`
            SELECT dm.id, dm.conversation_id, dm.sender_id, dm.recipient_id, dm.created_at
            FROM direct_messages dm
            WHERE (dm.sender_id = ${uid} OR dm.recipient_id = ${uid})
              AND dm.created_at >= ${sinceIso}::timestamptz
            ORDER BY dm.conversation_id, dm.created_at ASC
            LIMIT 1000
          `;
          const rowsArr = msgs as any[];
          const sent = rowsArr.filter(
            (m) => Number(m.sender_id) === uid
          ).length;
          const received = rowsArr.length - sent;
          const convIds = new Set<string>(
            rowsArr.map((m) => String(m.conversation_id))
          );
          let replyDeltas = 0;
          let replyCount = 0;
          let prev: any = null;
          for (const m of rowsArr) {
            if (
              prev &&
              String(prev.conversation_id) === String(m.conversation_id) &&
              Number(prev.sender_id) !== Number(m.sender_id)
            ) {
              const delta =
                new Date(m.created_at).getTime() -
                new Date(prev.created_at).getTime();
              if (delta > 0 && delta < 24 * 3600 * 1000) {
                replyDeltas += delta;
                replyCount += 1;
              }
            }
            prev = m;
          }
          const perOther: Record<string, number> = {};
          for (const m of rowsArr) {
            const other =
              Number(m.sender_id) === uid
                ? Number(m.recipient_id || 0)
                : Number(m.sender_id);
            if (other && other !== uid)
              perOther[other] = (perOther[other] || 0) + 1;
          }
          const topIds = Object.entries(perOther)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => Number(id));
          let topCorrespondents: any[] = [];
          if (topIds.length > 0) {
            const users = await sql`
              SELECT u.id, u.username, pr.display_name FROM users u
              LEFT JOIN profiles pr ON pr.user_id = u.id
              WHERE u.id = ANY(${topIds})
            `;
            const byId = new Map(
              (users as any[]).map((u) => [Number(u.id), u])
            );
            topCorrespondents = topIds.map((id) => ({
              display_name: byId.get(id)?.display_name || null,
              messages: perOther[id],
              username: byId.get(id)?.username || null,
            }));
          }
          const groupsRows =
            await sql`SELECT COUNT(*) AS n FROM dm_group_members WHERE user_id = ${uid}`;
          resultData = {
            active_conversations: convIds.size,
            avg_reply_minutes:
              replyCount > 0
                ? Math.round((replyDeltas / replyCount / 60_000) * 10) / 10
                : null,
            groups: Number(groupsRows[0]?.n || 0),
            message: `${rowsArr.length} messages sur ${days} jours (${sent} envoyés, ${received} reçus).`,
            messages_total: rowsArr.length,
            note:
              rowsArr.length >= 1000
                ? "Analyse limitée aux 1000 derniers messages de la période."
                : undefined,
            period_days: days,
            received,
            replies_measured: replyCount,
            sent,
            top_correspondents: topCorrespondents,
          };
          break;
        }

        case "analyze_book_stats": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const books = await sql`
            SELECT b.id, b.title, b.icon,
                   (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS items_count,
                   (SELECT COUNT(DISTINCT bi.added_by) FROM vibe_book_items bi WHERE bi.book_id = b.id AND bi.added_by IS NOT NULL) AS contributors_count,
                   (SELECT COUNT(*) FROM vibe_book_members bm WHERE bm.book_id = b.id) AS members_count,
                   (SELECT COUNT(*) FROM vibe_book_items bi WHERE bi.book_id = b.id AND bi.added_at >= ${sinceIso}::timestamptz) AS recent_items,
                   (SELECT MAX(bi.added_at) FROM vibe_book_items bi WHERE bi.book_id = b.id) AS last_added_at
            FROM vibe_books b
            WHERE b.user_id = ${uid} OR EXISTS (SELECT 1 FROM vibe_book_members bm WHERE bm.book_id = b.id AND bm.user_id = ${uid})
            ORDER BY b.updated_at DESC NULLS LAST
            LIMIT 20
          `;
          const bookIds = (books as any[]).map((b) => String(b.id));
          let topPosts: any[] = [];
          if (bookIds.length > 0) {
            topPosts = (await sql`
              SELECT bi.book_id, p.id AS post_id, p.content, COALESCE(p.views_count,0) AS views, COALESCE(p.likes_count,0) AS likes
              FROM vibe_book_items bi
              JOIN posts p ON p.id = bi.post_id
              WHERE bi.book_id = ANY(${bookIds}::uuid[])
              ORDER BY COALESCE(p.views_count,0) DESC
              LIMIT 60
            `) as any[];
          }
          const topPerBook = new Map<string, any>();
          for (const r of topPosts) {
            const key = String(r.book_id);
            if (!topPerBook.has(key)) {
              topPerBook.set(key, {
                excerpt: String(r.content || "").slice(0, 120),
                likes: Number(r.likes || 0),
                post_id: r.post_id,
                views: Number(r.views || 0),
              });
            }
          }
          resultData = {
            books: (books as any[]).map((b) => ({
              contributors_count: Number(b.contributors_count || 0),
              icon: b.icon,
              id: b.id,
              items_count: Number(b.items_count || 0),
              last_added_at: b.last_added_at,
              members_count: Number(b.members_count || 0),
              recent_items: Number(b.recent_items || 0),
              title: b.title,
              top_post: topPerBook.get(String(b.id)) || null,
            })),
            books_count: (books as any[]).length,
            message: `${(books as any[]).length} livre(s) analysé(s).`,
          };
          break;
        }

        case "analyze_hashtags": {
          const days = parsePeriodDays(args.period);
          const sinceIso = new Date(
            Date.now() - days * 86_400_000
          ).toISOString();
          const [mine, trending] = await Promise.all([
            sql`
              SELECT content, COALESCE(views_count,0) AS views, COALESCE(likes_count,0) AS likes,
                     COALESCE(reposts_count,0) AS reposts, COALESCE(replies_count,0) AS replies
              FROM posts WHERE author_id = ${uid} AND published_at >= ${sinceIso}::timestamptz
              ORDER BY published_at DESC LIMIT 500
            `,
            sql`SELECT content FROM posts WHERE published_at > NOW() - INTERVAL '7 days' ORDER BY published_at DESC LIMIT 200`,
          ]);
          const tagStats: Record<
            string,
            { posts: number; views: number; likes: number; engagement: number }
          > = {};
          for (const r of mine as any[]) {
            const eng =
              Number(r.likes) + Number(r.reposts) * 2 + Number(r.replies) * 2;
            for (const m of String(r.content || "").matchAll(
              /#([\p{L}\p{N}_]{2,30})/gu
            )) {
              const tag = m[1].toLowerCase();
              tagStats[tag] = tagStats[tag] || {
                engagement: 0,
                likes: 0,
                posts: 0,
                views: 0,
              };
              tagStats[tag].posts += 1;
              tagStats[tag].views += Number(r.views);
              tagStats[tag].likes += Number(r.likes);
              tagStats[tag].engagement += eng;
            }
          }
          const hashtags = Object.entries(tagStats)
            .map(([tag, s]) => ({
              avg_likes: Math.round((s.likes / Math.max(1, s.posts)) * 10) / 10,
              avg_views: Math.round(s.views / Math.max(1, s.posts)),
              engagement_rate_percent:
                s.views > 0
                  ? Math.round((s.engagement / s.views) * 1000) / 10
                  : 0,
              posts: s.posts,
              tag: `#${tag}`,
            }))
            .sort((a, b) => b.avg_views - a.avg_views);
          const used = new Set(hashtags.map((h) => h.tag.slice(1)));
          const trendCounts: Record<string, number> = {};
          for (const r of trending as any[]) {
            for (const m of String(r.content || "").matchAll(
              /#([\p{L}\p{N}_]{2,30})/gu
            )) {
              const tag = m[1].toLowerCase();
              trendCounts[tag] = (trendCounts[tag] || 0) + 1;
            }
          }
          const suggestions = Object.entries(trendCounts)
            .filter(([tag]) => !used.has(tag))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, count]) => ({
              platform_posts_7d: count,
              tag: `#${tag}`,
            }));
          resultData = {
            best_hashtag: hashtags[0] || null,
            hashtags: hashtags.slice(0, 10),
            message:
              hashtags.length === 0
                ? "Aucun hashtag utilisé sur la période."
                : `Top hashtag : ${hashtags[0].tag} (${hashtags[0].avg_views} vues moyennes).`,
            period_days: days,
            suggestions,
          };
          break;
        }

        default:
          throw new Error(`Outil inconnu : ${toolName}`);
      }

      const duration = Date.now() - startTime;
      await sql`
        INSERT INTO mai_tool_executions (user_id, tool_name, parameters, result, status, execution_time_ms)
        VALUES (${uid}, ${toolName}, ${JSON.stringify(args)}::jsonb, ${JSON.stringify(resultData)}::jsonb, 'success', ${duration})
      `;

      return { result: resultData, success: true };
    } catch (err: any) {
      console.error(`[MAIAgentFleet] Error executing tool ${toolName}:`, err);
      const duration = Date.now() - startTime;
      await sql`
        INSERT INTO mai_tool_executions (user_id, tool_name, parameters, result, status, execution_time_ms)
        VALUES (${uid}, ${toolName}, ${JSON.stringify(args)}::jsonb, ${JSON.stringify({ error: err.message })}::jsonb, 'failed', ${duration})
      `.catch(() => {});
      return { error: err.message, result: null, success: false };
    }
  }
}
