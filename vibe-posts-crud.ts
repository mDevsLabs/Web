/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POSTS CRUD & EXTENSIONS (vibe-posts-crud.ts)
 * Création / lecture / modification / suppression de posts, sondages (vote),
 * statistiques créateur, co-signature, posts programmés et brouillons serveur.
 * Enregistré par vibe-posts.ts (registerVibePostsRoutes) via
 * registerPostCrudRoutes — l'ordre des registerMulti est inchangé.
 * ============================================================================
 */

import {
  extractToken,
  getDb,
  isPaidTier,
  rateLimit,
  verifyToken,
} from "./config.ts";
import { pushRealtimeEvent } from "./realtime.ts";
import { ensureBooksTables } from "./vibe-books.ts";
import { ensureCircleTable } from "./vibe-circle.ts";
import { isBlockEitherWay, type RegisterMultiFn } from "./vibe-common.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";
import {
  attachBookRefs,
  attachPollsAndCollabs,
  attachQuotedPosts,
  ensurePostColumns,
  extractBookRefIds,
  fetchPostMedia,
  isUuid,
  publishDuePosts,
  stripHtmlTags,
  syncPostBookRefs,
  visibilityFilter,
} from "./vibe-posts-core.ts";

/** Longueur maximale d'une Vibe (publication), en texte brut, par forfait. */
const POST_CHARS_LIMIT_FREE = 1000;
/** Garde-fou technique pour les forfaits payants (« caractères illimités » en pratique). */
const POST_CHARS_LIMIT_PAID = 50_000;

const postCharsError = (isPaid: boolean, charLimit: number) => ({
  char_limit: charLimit,
  error: isPaid
    ? "La publication est trop longue."
    : `Une Vibe est limitée à ${POST_CHARS_LIMIT_FREE.toLocaleString("fr-FR")} caractères (texte) avec le forfait Free. Passez à Plus, Pro ou Max pour publier sans limite.`,
  plan_required: !isPaid,
});

export function registerPostCrudRoutes(registerMulti: RegisterMultiFn) {
  // 1. POSTS CRUD
  const handleCreatePost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      // Anti-spam : 10 posts / 5 min / utilisateur
      if (!rateLimit(`post:${userId}`, 10, 5 * 60_000)) {
        return c.json(
          { error: "Vous publiez trop vite. Patientez un instant." },
          429
        );
      }

      const body = await c.req.json();
      const {
        content,
        format = "micro_text",
        media_url,
        media_assets = [],
        quoted_post_id,
      } = body;
      // Audience : Public (défaut), Abonnés uniquement, Cercle Privé, privé (soi seul)
      const visibility = ["public", "followers", "circle", "private"].includes(
        body.visibility
      )
        ? body.visibility
        : "public";
      const sql = getDb();
      await ensurePostColumns();
      await ensureCircleTable().catch(() => {});

      if (!content?.trim()) {
        return c.json({ error: "Le contenu est obligatoire." }, 400);
      }

      // Limite de longueur par forfait (texte brut, balises de mise en forme exclues)
      const tierRows =
        await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
      const isPaid = isPaidTier(tierRows[0]?.tier);
      const charLimit = isPaid ? POST_CHARS_LIMIT_PAID : POST_CHARS_LIMIT_FREE;
      if (stripHtmlTags(String(content)).length > charLimit) {
        return c.json(postCharsError(isPaid, charLimit), 400);
      }

      // Scan de sécurité sur le texte brut (sans balises de mise en forme)
      const safety = MAIAgentFleet.assessContentSafety(stripHtmlTags(content));

      // Planification de publication : réservée aux abonnés Plus / Pro / Max
      let scheduledAt: string | null = null;
      let postStatus = "published";
      if (body.scheduled_at) {
        const ts = Date.parse(String(body.scheduled_at));
        if (Number.isNaN(ts) || ts <= Date.now()) {
          return c.json(
            { error: "Date de planification invalide ou passée." },
            400
          );
        }
        if (!isPaid) {
          return c.json(
            {
              error:
                "La planification des vibes est réservée aux abonnés Plus, Pro et Max.",
              plan_required: true,
            },
            403
          );
        }
        scheduledAt = new Date(ts).toISOString();
        postStatus = "scheduled";
      }

      if (!safety.isSafe) {
        return c.json(
          { error: `Publication refusée : ${safety.flagReason}` },
          403
        );
      }

      // Badge « Créé avec l'IA » : valeur fournie par le client, sinon
      // réglage utilisateur posts_ai_generated_by_default
      let aiGeneratedFlag = body.ai_generated;
      if (aiGeneratedFlag === undefined || aiGeneratedFlag === null) {
        try {
          const settingsRows =
            await sql`SELECT posts_ai_generated_by_default FROM user_settings WHERE user_id = ${userId} LIMIT 1`;
          aiGeneratedFlag = Boolean(
            settingsRows[0]?.posts_ai_generated_by_default
          );
        } catch {
          aiGeneratedFlag = false;
        }
      }
      aiGeneratedFlag = Boolean(aiGeneratedFlag);

      // Post cité (quote-post) : validation existence + visibilité
      let quotedId: string | null = null;
      if (
        quoted_post_id &&
        typeof quoted_post_id === "string" &&
        isUuid(quoted_post_id)
      ) {
        const quotedRows =
          await sql`SELECT id, author_id, visibility FROM posts WHERE id = ${quoted_post_id}::uuid LIMIT 1`;
        if (quotedRows.length > 0) {
          const quoted = quotedRows[0];
          const quotedAuthor = Number(quoted.author_id);
          let canQuote =
            quoted.visibility === "public" || quotedAuthor === userId;
          if (!canQuote && quoted.visibility === "followers") {
            const followerRows =
              await sql`SELECT 1 FROM follows WHERE follower_id = ${userId} AND following_id = ${quotedAuthor} LIMIT 1`;
            canQuote = followerRows.length > 0;
          } else if (!canQuote && quoted.visibility === "circle") {
            const memberRows =
              await sql`SELECT 1 FROM circle_members WHERE user_id = ${quotedAuthor} AND member_user_id = ${userId} LIMIT 1`;
            canQuote = memberRows.length > 0;
          }
          if (canQuote) quotedId = String(quoted.id);
        }
      }

      const inserted = await sql`
        INSERT INTO posts (author_id, content, format, visibility, toxicity_score, created_via, ai_generated, quoted_post_id, status, scheduled_at)
        VALUES (${userId}, ${content.trim()}, ${format}, ${visibility}, ${safety.toxicityScore}, 'web', ${aiGeneratedFlag}, ${quotedId}, ${postStatus}, ${scheduledAt})
        RETURNING *
      `;

      const newPost = inserted[0];

      // Références de Livres (@livre / attachement) : extraites du HTML et persistées
      const bookRefIds = extractBookRefIds(String(content));
      if (bookRefIds.length > 0) {
        await ensureBooksTables(sql).catch(() => {});
        await syncPostBookRefs(sql, String(newPost.id), bookRefIds);
      }

      // Inférence du type MIME à partir de l'extension du fichier
      const inferMediaType = (url: string, fallback = "image/jpeg"): string => {
        try {
          const cleanUrl = url.split("?")[0].split("#")[0];
          const ext = cleanUrl.split(".").pop()?.toLowerCase();
          switch (ext) {
            case "png":
              return "image/png";
            case "webp":
              return "image/webp";
            case "gif":
              return "image/gif";
            case "svg":
              return "image/svg+xml";
            case "jpg":
            case "jpeg":
              return "image/jpeg";
            case "mp4":
              return "video/mp4";
            case "webm":
              return "video/webm";
            case "mov":
              return "video/quicktime";
            case "mp3":
              return "audio/mpeg";
            case "wav":
              return "audio/wav";
            case "ogg":
              return "audio/ogg";
            default:
              return fallback;
          }
        } catch {
          return fallback;
        }
      };

      // Normalisation des médias (support de media_url et de la liste media_assets)
      const normalizedMedia: Array<{
        url: string;
        media_type: string;
        file_size_bytes: number;
        alt_text: string;
      }> = [];

      if (Array.isArray(media_assets)) {
        for (const media of media_assets) {
          if (!media?.url) continue;
          const urlStr = String(media.url).trim();
          if (!urlStr) continue;
          normalizedMedia.push({
            alt_text: media.alt_text || media.alt || "",
            file_size_bytes: Math.max(
              0,
              Math.round(
                Number(
                  media.file_size_bytes ?? media.size ?? media.file_size ?? 0
                ) || 0
              )
            ),
            media_type:
              media.media_type || media.type || inferMediaType(urlStr),
            url: urlStr,
          });
        }
      }

      if (media_url && typeof media_url === "string" && media_url.trim()) {
        const trimmedUrl = media_url.trim();
        const alreadyPresent = normalizedMedia.some(
          (m) => m.url === trimmedUrl
        );
        if (!alreadyPresent) {
          normalizedMedia.unshift({
            alt_text: body.alt_text || "",
            file_size_bytes: Math.max(
              0,
              Math.round(
                Number(
                  body.file_size_bytes ?? body.size ?? body.file_size ?? 0
                ) || 0
              )
            ),
            media_type: body.media_type || inferMediaType(trimmedUrl),
            url: trimmedUrl,
          });
        }
      }

      const insertedMediaList: any[] = [];
      // Position explicite du client (drag & drop) sinon ordre d'affichage
      const mediaPositions = Array.isArray(body.media_positions)
        ? body.media_positions.map((v: any) => Number(v) || 0)
        : [];
      let posIdx = 0;
      for (const media of normalizedMedia) {
        const position = Number.isFinite(mediaPositions[posIdx])
          ? mediaPositions[posIdx]
          : posIdx;
        posIdx += 1;
        const res = await sql`
          INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text, position)
          VALUES (${userId}, ${newPost.id}::uuid, ${media.url}, ${media.media_type}, ${media.file_size_bytes}, ${media.alt_text}, ${position})
          RETURNING id, url, media_type, file_size_bytes, alt_text
        `.catch(
          async () =>
            await sql`
          INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text)
          VALUES (${userId}, ${newPost.id}::uuid, ${media.url}, ${media.media_type}, ${media.file_size_bytes}, ${media.alt_text})
          RETURNING id, url, media_type, file_size_bytes, alt_text
        `
        );
        if (res?.[0]) {
          insertedMediaList.push(res[0]);
        }
      }

      // Sondage intégré : { options: string[2..4], duration_hours: 1h..7j, question? }
      let createdPoll: any = null;
      try {
        const pollBody = (body as any)?.poll;
        if (pollBody && Array.isArray(pollBody.options)) {
          const labels = pollBody.options
            .map((o: any) => String(o ?? "").trim())
            .filter(Boolean)
            .slice(0, 4);
          const durationHours = Math.min(
            24 * 7,
            Math.max(1, Math.round(Number(pollBody.duration_hours) || 24))
          );
          if (labels.length >= 2) {
            const question =
              String(pollBody.question || "")
                .trim()
                .slice(0, 120) || "Votre avis ?";
            const endsAt = new Date(
              Date.now() + durationHours * 3_600_000
            ).toISOString();
            const pollRows = await sql`
              INSERT INTO post_polls (post_id, question, ends_at)
              VALUES (${newPost.id}::uuid, ${question}, ${endsAt}::timestamptz)
              RETURNING *
            `;
            if (pollRows[0]) {
              createdPoll = {
                ...pollRows[0],
                expired: false,
                my_vote: null,
                options: [],
              };
              for (let i = 0; i < labels.length; i++) {
                const optRows = await sql`
                  INSERT INTO post_poll_options (poll_id, label, position)
                  VALUES (${pollRows[0].id}::uuid, ${labels[i].slice(0, 80)}, ${i})
                  RETURNING *
                `;
                if (optRows[0]) createdPoll.options.push(optRows[0]);
              }
            }
          }
        }
      } catch (pollErr) {
        console.warn("[Vibe API] Erreur création sondage:", pollErr);
      }

      // Co-auteur : { collaborator_username }
      // - réglage invité collab_auto_accept = TRUE → co-signature directe (status
      //   'accepted', auto_accepted = TRUE, simple notification, AUCUNE invitation)
      // - sinon → invitation 'pending' à accepter/refuser (comportement historique)
      let createdCollaborators: any[] = [];
      try {
        const collabUsername = String(
          (body as any)?.collaborator_username || ""
        )
          .trim()
          .replace(/^@/, "")
          .toLowerCase();
        if (collabUsername) {
          const targetRows =
            await sql`SELECT id, username FROM users WHERE LOWER(username) = ${collabUsername} LIMIT 1`;
          const targetId = targetRows[0] ? Number(targetRows[0].id) : 0;
          if (
            targetId &&
            targetId !== userId &&
            !(await isBlockEitherWay(userId, targetId))
          ) {
            // Réglage d'auto-acceptation du co-auteur désigné
            let autoAccept = false;
            try {
              const s =
                await sql`SELECT collab_auto_accept FROM user_settings WHERE user_id = ${targetId} LIMIT 1`.catch(
                  () => []
                );
              autoAccept = Boolean(s[0]?.collab_auto_accept);
            } catch {}
            if (autoAccept) {
              await sql`
                INSERT INTO post_collaborators (post_id, user_id, status, auto_accepted, accepted_at)
                VALUES (${newPost.id}::uuid, ${targetId}, 'accepted', TRUE, NOW())
                ON CONFLICT (post_id, user_id) DO NOTHING
              `.catch(() => {});
              createdCollaborators = [
                { status: "accepted", username: targetRows[0].username },
              ];
              await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
                VALUES (${targetId}, ${userId}, 'mention', ${newPost.id}::uuid, 'vous a ajouté comme co-auteur d\'une publication')
              `.catch(() => {});
              try {
                await pushRealtimeEvent(targetId, "notification", {
                  actor_id: userId,
                  post_id: newPost.id,
                  type: "collab_accepted",
                });
              } catch {}
            } else {
              await sql`
                INSERT INTO post_collaborators (post_id, user_id, status)
                VALUES (${newPost.id}::uuid, ${targetId}, 'pending')
                ON CONFLICT (post_id, user_id) DO NOTHING
              `.catch(() => {});
              createdCollaborators = [
                { status: "pending", username: targetRows[0].username },
              ];
              await sql`
                INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
                VALUES (${targetId}, ${userId}, 'mention', ${newPost.id}::uuid, 'vous a invité à co-signer une publication')
              `.catch(() => {});
              try {
                await pushRealtimeEvent(targetId, "notification", {
                  actor_id: userId,
                  post_id: newPost.id,
                  type: "collab_invite",
                });
              } catch {}
            }
          }
        }
      } catch (collabErr) {
        console.warn("[Vibe API] Erreur invitation co-auteur:", collabErr);
      }

      const userRow =
        await sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
      const profileRow =
        await sql`SELECT display_name, avatar_url FROM profiles WHERE user_id = ${userId} LIMIT 1`;

      // Publication planifiée : le compteur de posts et les notifications
      // (mentions, citations) seront déclenchés à l'échéance (publishDuePosts).
      if (postStatus === "scheduled") {
        const createdPost: any = {
          ...newPost,
          avatar_url: profileRow[0]?.avatar_url,
          collaborators: createdCollaborators,
          display_name: profileRow[0]?.display_name || userRow[0]?.username,
          media_assets: insertedMediaList,
          poll: createdPoll,
          quoted_post: null,
          username: userRow[0]?.username,
        };
        await attachBookRefs([createdPost], userId).catch(() => {});
        return c.json({ post: createdPost, success: true }, 201);
      }

      await sql`UPDATE profiles SET posts_count = posts_count + 1 WHERE user_id = ${userId}`;

      // Détection et notification des mentions @username dans les publications
      // (les ancres de Livres @livre sont retirées du scan pour éviter de faux utilisateurs)
      try {
        const plainContent = stripHtmlTags(
          String(content).replace(/<a\b[^>]*data-book-id[\s\S]*?<\/a>/gi, " ")
        );
        const mentionMatches = Array.from(
          new Set(plainContent.match(/@([a-zA-Z0-9_]{1,30})/g) || [])
        ).map((m: string) => m.slice(1).toLowerCase());
        if (mentionMatches.length > 0) {
          const mentionedUsers = await sql`
            SELECT id, username FROM users
            WHERE LOWER(username) = ANY(${mentionMatches}) AND id <> ${userId}
          `;
          const snippet =
            plainContent.length > 45
              ? `${plainContent.slice(0, 45)}…`
              : plainContent;
          for (const u of mentionedUsers) {
            // Blocage croisé : aucune notification de mention ne traverse un blocage
            if (await isBlockEitherWay(userId, Number(u.id))) continue;
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
              VALUES (${u.id}, ${userId}, 'mention', ${newPost.id}::uuid, ${`vous a mentionné dans une publication : « ${snippet} »`})
            `.catch(() => {});
          }
        }
      } catch (mentionErr) {
        console.warn(
          "[Vibe API] Erreur notification mention post:",
          mentionErr
        );
      }

      // Notification de citation à l'auteur du post original
      if (quotedId) {
        try {
          const quotedRows =
            await sql`SELECT author_id, content FROM posts WHERE id = ${quotedId}::uuid LIMIT 1`;
          const recipientId = Number(quotedRows[0]?.author_id);
          if (
            recipientId &&
            recipientId !== userId &&
            !(await isBlockEitherWay(userId, recipientId))
          ) {
            const plainQuoted = stripHtmlTags(content);
            const qSnippet =
              plainQuoted.length > 45
                ? `${plainQuoted.slice(0, 45)}…`
                : plainQuoted;
            await sql`
              INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
              VALUES (${recipientId}, ${userId}, 'quote', ${newPost.id}::uuid, ${`a cité votre publication : « ${qSnippet} »`})
            `.catch(() => {});
          }
        } catch (quoteErr) {
          console.warn("[Vibe API] Erreur notification citation:", quoteErr);
        }
      }

      // Notification aux abonnés aux posts de ce compte (post_subscriptions)
      try {
        const subscribers = await sql`
          SELECT ps.subscriber_id FROM post_subscriptions ps
          WHERE ps.author_id = ${userId} AND ps.subscriber_id <> ${userId}
        `;
        const plainSub = stripHtmlTags(content);
        const subSnippet =
          plainSub.length > 45 ? `${plainSub.slice(0, 45)}…` : plainSub;
        for (const s of subscribers) {
          if (await isBlockEitherWay(userId, Number(s.subscriber_id))) continue;
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
            VALUES (${s.subscriber_id}, ${userId}, 'post', ${newPost.id}::uuid, ${`a publié une nouvelle Vibe : « ${subSnippet} »`})
          `.catch(() => {});
        }
      } catch (subErr) {
        console.warn("[Vibe API] Erreur notification abonnés posts:", subErr);
      }

      const createdPost: any = {
        ...newPost,
        avatar_url: profileRow[0]?.avatar_url,
        collaborators: createdCollaborators,
        display_name: profileRow[0]?.display_name || userRow[0]?.username,
        media_assets: insertedMediaList,
        poll: createdPoll,
        quoted_post: null,
        username: userRow[0]?.username,
      };
      await attachQuotedPosts([createdPost]);
      await attachBookRefs([createdPost], userId).catch(() => {});

      return c.json(
        {
          post: createdPost,
          success: true,
        },
        201
      );
    } catch (err: any) {
      console.error("[Vibe API] Error creating post:", err);
      return c.json({ error: "Erreur serveur lors de la publication." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/posts", "/vibe/posts", "/v1/posts", "/posts"],
    handleCreatePost
  );

  // 1b. POLL VOTE (vote unique modifiable)
  const handlePollVote = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const postId = c.req.param("id");
      if (!isUuid(postId))
        return c.json({ error: "Identifiant invalide." }, 400);
      const body = await c.req.json().catch(() => ({}));
      const optionId = String(body?.option_id || "");
      if (!isUuid(optionId)) return c.json({ error: "Option invalide." }, 400);
      const sql = getDb();
      await ensurePostColumns();
      const polls =
        await sql`SELECT * FROM post_polls WHERE post_id = ${postId}::uuid LIMIT 1`;
      if (polls.length === 0)
        return c.json({ error: "Aucun sondage sur ce post." }, 404);
      const poll = polls[0];
      if (new Date(poll.ends_at).getTime() <= Date.now()) {
        return c.json({ error: "Sondage expiré." }, 410);
      }
      const optRows =
        await sql`SELECT * FROM post_poll_options WHERE id = ${optionId}::uuid AND poll_id = ${poll.id}::uuid LIMIT 1`;
      if (optRows.length === 0)
        return c.json({ error: "Option introuvable pour ce sondage." }, 404);
      const existing =
        await sql`SELECT option_id FROM post_poll_votes WHERE poll_id = ${poll.id}::uuid AND user_id = ${userId} LIMIT 1`;
      if (existing.length > 0 && String(existing[0].option_id) === optionId) {
        // Idempotent : même option → résultats courants
      } else if (existing.length > 0) {
        const oldOptionId = String(existing[0].option_id);
        await sql`UPDATE post_poll_votes SET option_id = ${optionId}::uuid, voted_at = NOW() WHERE poll_id = ${poll.id}::uuid AND user_id = ${userId}`;
        await sql`UPDATE post_poll_options SET votes_count = GREATEST(0, votes_count - 1) WHERE id = ${oldOptionId}::uuid`;
        await sql`UPDATE post_poll_options SET votes_count = votes_count + 1 WHERE id = ${optionId}::uuid`;
      } else {
        await sql`INSERT INTO post_poll_votes (poll_id, user_id, option_id) VALUES (${poll.id}::uuid, ${userId}, ${optionId}::uuid)`;
        await sql`UPDATE post_poll_options SET votes_count = votes_count + 1 WHERE id = ${optionId}::uuid`;
        await sql`UPDATE post_polls SET total_votes = total_votes + 1 WHERE id = ${poll.id}::uuid`;
      }
      const freshPoll =
        (
          await sql`SELECT * FROM post_polls WHERE id = ${poll.id}::uuid LIMIT 1`
        )[0] || poll;
      const freshOptions =
        await sql`SELECT id, label, votes_count, position FROM post_poll_options WHERE poll_id = ${poll.id}::uuid ORDER BY position ASC`;
      return c.json({
        poll: {
          ...freshPoll,
          expired: false,
          my_vote: optionId,
          options: freshOptions,
        },
        success: true,
      });
    } catch (err: any) {
      console.error("[vibe-posts] Poll vote error:", err);
      return c.json({ error: "Erreur vote sondage." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/poll/vote",
      "/vibe/posts/:id/poll/vote",
      "/v1/posts/:id/poll/vote",
      "/posts/:id/poll/vote",
    ],
    handlePollVote
  );

  // 1c. POST STATS (auteur uniquement ; reach temporel via post_views)
  const handlePostStats = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const postId = c.req.param("id");
      if (!isUuid(postId))
        return c.json({ error: "Identifiant invalide." }, 400);
      const periodParam = String(c.req.query("period") || "7d").toLowerCase();
      const periodDays =
        periodParam === "30d" ? 30 : periodParam === "90d" ? 90 : 7;
      const sinceIso = new Date(
        Date.now() - periodDays * 86_400_000
      ).toISOString();
      const sql = getDb();
      const rows =
        await sql`SELECT author_id, views_count, likes_count, reposts_count, replies_count, bookmarks_count FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (rows.length === 0)
        return c.json({ error: "Publication introuvable." }, 404);
      if (Number(rows[0].author_id) !== userId)
        return c.json({ error: "Réservé à l'auteur." }, 403);
      const p = rows[0];
      const views = Number(p.views_count || 0);
      const likes = Number(p.likes_count || 0);
      const reposts = Number(p.reposts_count || 0);
      const replies = Number(p.replies_count || 0);
      const bookmarks = Number(p.bookmarks_count || 0);
      const engagement_rate =
        views > 0
          ? Math.round(
              ((likes + reposts + replies + bookmarks) / views) * 1000
            ) / 10
          : 0;
      // Série temporelle des vues (best-effort)
      const reach: Array<{ day: string; views: number }> = [];
      try {
        await ensurePostColumns().catch(() => {});
        const viewRows = await sql`
          SELECT created_at::date AS day, COUNT(*) AS views
          FROM post_views
          WHERE post_id = ${postId}::uuid AND created_at >= ${sinceIso}::timestamptz
          GROUP BY created_at::date
          ORDER BY day ASC
        `;
        const byDay = new Map<string, number>();
        for (const r of viewRows as any[]) {
          const d = String((r as any).day).slice(0, 10);
          byDay.set(d, Number((r as any).views || 0));
        }
        for (let i = periodDays - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86_400_000)
            .toISOString()
            .slice(0, 10);
          reach.push({ day: d, views: byDay.get(d) || 0 });
        }
      } catch {}
      return c.json({
        bookmarks,
        engagement_rate,
        likes,
        period: periodParam,
        reach,
        reach_7d: reach,
        replies,
        reposts,
        top_referrers: [],
        views,
      });
    } catch {
      return c.json({ error: "Erreur stats post." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/posts/:id/stats",
      "/vibe/posts/:id/stats",
      "/v1/posts/:id/stats",
      "/posts/:id/stats",
    ],
    handlePostStats
  );

  // 1d. CREATOR STATS (période ?period=7d|30d|90d|12m, défaut 30d)
  // Champs historiques conservés (total_*, top_post, daily) + nouveaux :
  // series[{day,views,likes,reposts,replies,profile_views}], sources, profile_views.
  const handleCreatorStats = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const periodParam = String(c.req.query("period") || "30d").toLowerCase();
      const periodDays =
        periodParam === "7d"
          ? 7
          : periodParam === "90d"
            ? 90
            : periodParam === "12m"
              ? 365
              : 30;
      const sinceIso = new Date(
        Date.now() - periodDays * 86_400_000
      ).toISOString();
      const sql = getDb();
      await publishDuePosts().catch(() => {});
      await ensurePostColumns().catch(() => {});
      const agg = await sql`
        SELECT COALESCE(SUM(views_count), 0) AS total_views,
               COALESCE(SUM(likes_count), 0) AS total_likes,
               COALESCE(SUM(reposts_count), 0) AS total_reposts,
               COALESCE(SUM(replies_count), 0) AS total_replies,
               COUNT(*) AS posts_count
        FROM posts
        WHERE author_id = ${userId} AND published_at >= ${sinceIso}::timestamptz
      `;
      const top = await sql`
        SELECT id, content, views_count, likes_count, reposts_count, replies_count, published_at,
               (COALESCE(likes_count,0) + COALESCE(reposts_count,0) * 2 + COALESCE(replies_count,0) * 2) AS engagement
        FROM posts
        WHERE author_id = ${userId} AND published_at >= ${sinceIso}::timestamptz
        ORDER BY engagement DESC, published_at DESC
        LIMIT 1
      `;
      const daily = await sql`
        SELECT published_at::date AS day, COALESCE(SUM(views_count), 0) AS views, COUNT(*) AS posts
        FROM posts
        WHERE author_id = ${userId} AND published_at >= ${sinceIso}::timestamptz
        GROUP BY published_at::date
        ORDER BY day ASC
      `;
      const a = agg[0] || {};
      // Séries temporelles par date d'ÉVÉNEMENT (best-effort, tables absentes => zéros)
      const days: string[] = [];
      for (let i = periodDays - 1; i >= 0; i--) {
        days.push(
          new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
        );
      }
      const bucket = (rows: any[], key = "day", val = "n") => {
        const m = new Map<string, number>();
        for (const r of rows as any[])
          m.set(String(r[key]).slice(0, 10), Number(r[val] || 0));
        return m;
      };
      let viewsByDay = new Map<string, number>();
      let likesByDay = new Map<string, number>();
      let repostsByDay = new Map<string, number>();
      let repliesByDay = new Map<string, number>();
      let profileByDay = new Map<string, number>();
      let sources: Array<{ source: string; views: number }> = [];
      let profileViewsTotal = 0;
      try {
        const [v, l, rp] = await Promise.all([
          sql`SELECT pv.created_at::date AS day, COUNT(*) AS n FROM post_views pv JOIN posts p ON p.id = pv.post_id WHERE p.author_id = ${userId} AND pv.created_at >= ${sinceIso}::timestamptz GROUP BY pv.created_at::date`,
          sql`SELECT pi.created_at::date AS day, COUNT(*) AS n FROM post_interactions pi JOIN posts p ON p.id = pi.post_id WHERE p.author_id = ${userId} AND pi.interaction_type = 'like' AND pi.created_at >= ${sinceIso}::timestamptz GROUP BY pi.created_at::date`,
          sql`SELECT pi.created_at::date AS day, COUNT(*) AS n FROM post_interactions pi JOIN posts p ON p.id = pi.post_id WHERE p.author_id = ${userId} AND pi.interaction_type = 'repost' AND pi.created_at >= ${sinceIso}::timestamptz GROUP BY pi.created_at::date`,
        ]);
        viewsByDay = bucket(v as any[]);
        likesByDay = bucket(l as any[]);
        repostsByDay = bucket(rp as any[]);
      } catch {}
      try {
        const cm =
          await sql`SELECT c.created_at::date AS day, COUNT(*) AS n FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.author_id = ${userId} AND c.created_at >= ${sinceIso}::timestamptz GROUP BY c.created_at::date`;
        repliesByDay = bucket(cm as any[]);
      } catch {}
      try {
        const pv =
          await sql`SELECT created_at::date AS day, COUNT(*) AS n FROM profile_views WHERE profile_user_id = ${userId} AND created_at >= ${sinceIso}::timestamptz GROUP BY created_at::date`;
        profileByDay = bucket(pv as any[]);
        for (const n of profileByDay.values()) profileViewsTotal += n;
      } catch {}
      try {
        const s =
          await sql`SELECT COALESCE(pv.source, 'feed') AS source, COUNT(*) AS views FROM post_views pv JOIN posts p ON p.id = pv.post_id WHERE p.author_id = ${userId} AND pv.created_at >= ${sinceIso}::timestamptz GROUP BY COALESCE(pv.source, 'feed') ORDER BY views DESC`;
        sources = (s as any[]).map((r: any) => ({
          source: String(r.source),
          views: Number(r.views || 0),
        }));
      } catch {}
      // ── Nouvelles analyses (migration 019) ──
      // 1. Comparaison avec la période précédente (croissance)
      let previous_period: any = null;
      try {
        const prevSince = new Date(
          Date.now() - 2 * periodDays * 86_400_000
        ).toISOString();
        const prevUntil = new Date(
          Date.now() - periodDays * 86_400_000
        ).toISOString();
        const prev = await sql`
          SELECT COALESCE(SUM(views_count), 0) AS views, COALESCE(SUM(likes_count), 0) AS likes,
                 COALESCE(SUM(reposts_count), 0) AS reposts, COALESCE(SUM(replies_count), 0) AS replies,
                 COUNT(*) AS posts
          FROM posts
          WHERE author_id = ${userId} AND published_at >= ${prevSince}::timestamptz AND published_at < ${prevUntil}::timestamptz
        `;
        previous_period = {
          posts_count: Number(prev[0]?.posts || 0),
          total_likes: Number(prev[0]?.likes || 0),
          total_replies: Number(prev[0]?.replies || 0),
          total_reposts: Number(prev[0]?.reposts || 0),
          total_views: Number(prev[0]?.views || 0),
        };
      } catch {}
      // 2. Meilleur jour (vues) + meilleur jour de publication
      let best_day: any = null;
      let best_publish_day: any = null;
      try {
        const bd = await sql`
          SELECT created_at::date AS day, COUNT(*) AS views
          FROM post_views pv JOIN posts p ON p.id = pv.post_id
          WHERE p.author_id = ${userId} AND pv.created_at >= ${sinceIso}::timestamptz
          GROUP BY 1 ORDER BY views DESC LIMIT 1
        `;
        if (bd[0])
          best_day = {
            day: String(bd[0].day).slice(0, 10),
            views: Number(bd[0].views || 0),
          };
      } catch {}
      try {
        const bpd = await sql`
          SELECT published_at::date AS day, COALESCE(SUM(views_count), 0) AS views, COUNT(*) AS posts
          FROM posts WHERE author_id = ${userId} AND published_at >= ${sinceIso}::timestamptz
          GROUP BY 1 ORDER BY views DESC LIMIT 1
        `;
        if (bpd[0])
          best_publish_day = {
            day: String(bpd[0].day).slice(0, 10),
            posts: Number(bpd[0].posts || 0),
            views: Number(bpd[0].views || 0),
          };
      } catch {}
      // 3. Répartition horaire des vues (0-23) pour trouver les heures optimales
      let hourly: Array<{ hour: number; views: number }> = [];
      try {
        const h = await sql`
          SELECT EXTRACT(HOUR FROM pv.created_at)::int AS hour, COUNT(*) AS views
          FROM post_views pv JOIN posts p ON p.id = pv.post_id
          WHERE p.author_id = ${userId} AND pv.created_at >= ${sinceIso}::timestamptz
          GROUP BY 1 ORDER BY 1
        `;
        const byHour = new Map<number, number>(
          (h as any[]).map((r: any) => [Number(r.hour), Number(r.views || 0)])
        );
        hourly = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          views: byHour.get(i) || 0,
        }));
      } catch {}
      // 4. Posts les plus engageants de la période (top 5)
      let top_posts: any[] = [];
      try {
        const tp = await sql`
          SELECT id, content, views_count, likes_count, reposts_count, replies_count, published_at,
                 (COALESCE(likes_count,0) + COALESCE(reposts_count,0)*2 + COALESCE(replies_count,0)*2) AS engagement
          FROM posts WHERE author_id = ${userId} AND published_at >= ${sinceIso}::timestamptz
          ORDER BY engagement DESC, published_at DESC LIMIT 5
        `;
        top_posts = (tp as any[]).map((p: any) => ({
          ...p,
          engagement: Number(p.engagement || 0),
        }));
      } catch {}
      // 5. Taux d'engagement moyen par post et fréquence de publication
      const views_total = Number(a.total_views || 0);
      const engagementRate =
        views_total > 0
          ? Math.round(
              ((Number(a.total_likes || 0) +
                Number(a.total_reposts || 0) * 2 +
                Number(a.total_replies || 0) * 2) /
                views_total) *
                1000
            ) / 10
          : 0;
      const postsPerWeek =
        periodDays >= 7
          ? Math.round((Number(a.posts_count || 0) / (periodDays / 7)) * 10) /
            10
          : Number(a.posts_count || 0);
      const series = days.map((day) => ({
        day,
        likes: likesByDay.get(day) || 0,
        profile_views: profileByDay.get(day) || 0,
        replies: repliesByDay.get(day) || 0,
        reposts: repostsByDay.get(day) || 0,
        views: viewsByDay.get(day) || 0,
      }));
      return c.json({
        best_day,
        best_publish_day,
        daily,
        engagement_rate: engagementRate,
        hourly,
        period: periodParam,
        posts_count: Number(a.posts_count || 0),
        posts_per_week: postsPerWeek,
        // Nouvelles analyses (migration 019)
        previous_period,
        profile_views: profileViewsTotal,
        series,
        sources,
        top_post: top[0] || null,
        top_posts,
        total_likes: Number(a.total_likes || 0),
        total_replies: Number(a.total_replies || 0),
        total_reposts: Number(a.total_reposts || 0),
        total_views: views_total,
      });
    } catch {
      return c.json({ error: "Erreur stats créateur." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/users/me/creator-stats",
      "/vibe/users/me/creator-stats",
      "/v1/users/me/creator-stats",
      "/users/me/creator-stats",
    ],
    handleCreatorStats
  );

  // 1e. COLLABORATION accept / decline (co-auteur invité uniquement)
  const handleCollabRespond = async (c: any, accept: boolean) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const postId = c.req.param("id");
      if (!isUuid(postId))
        return c.json({ error: "Identifiant invalide." }, 400);
      const sql = getDb();
      await ensurePostColumns();
      const rows =
        await sql`SELECT status FROM post_collaborators WHERE post_id = ${postId}::uuid AND user_id = ${userId} LIMIT 1`;
      if (rows.length === 0)
        return c.json({ error: "Aucune invitation." }, 404);
      await sql`
        UPDATE post_collaborators
        SET status = ${accept ? "accepted" : "declined"}, accepted_at = ${accept ? new Date().toISOString() : null}::timestamptz
        WHERE post_id = ${postId}::uuid AND user_id = ${userId}
      `;
      try {
        const postRows =
          await sql`SELECT author_id FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
        const authorId = Number(postRows[0]?.author_id);
        if (authorId) {
          await sql`
            INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
            VALUES (${authorId}, ${userId}, 'mention', ${postId}::uuid, ${accept ? "a accepté votre invitation de co-signature" : "a décliné votre invitation de co-signature"})
          `.catch(() => {});
          await pushRealtimeEvent(authorId, "notification", {
            actor_id: userId,
            post_id: postId,
            type: accept ? "collab_accepted" : "collab_declined",
          }).catch(() => {});
        }
      } catch {}
      return c.json({
        status: accept ? "accepted" : "declined",
        success: true,
      });
    } catch {
      return c.json({ error: "Erreur réponse collaboration." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/collaborate/accept",
      "/vibe/posts/:id/collaborate/accept",
      "/v1/posts/:id/collaborate/accept",
      "/posts/:id/collaborate/accept",
    ],
    (c: any) => handleCollabRespond(c, true)
  );
  registerMulti(
    "post",
    [
      "/api/vibe/posts/:id/collaborate/decline",
      "/vibe/posts/:id/collaborate/decline",
      "/v1/posts/:id/collaborate/decline",
      "/posts/:id/collaborate/decline",
    ],
    (c: any) => handleCollabRespond(c, false)
  );

  // 1f. SCHEDULED LIST + RESCHEDULE (gate Plus/Pro/Max, null = publier aussitôt)
  const handleScheduledList = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();
      await ensurePostColumns();
      const posts = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE p.author_id = ${userId} AND p.status = 'scheduled'
        ORDER BY p.scheduled_at ASC
      `;
      await fetchPostMedia(posts);
      await attachPollsAndCollabs(posts, userId);
      return c.json({ posts });
    } catch {
      return c.json({ error: "Erreur posts programmés." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/posts/scheduled",
      "/vibe/posts/scheduled",
      "/v1/posts/scheduled",
      "/posts/scheduled",
    ],
    handleScheduledList
  );

  const handleReschedule = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const postId = c.req.param("id");
      if (!isUuid(postId))
        return c.json({ error: "Identifiant invalide." }, 400);
      const body = await c.req.json().catch(() => ({}));
      const sql = getDb();
      const existing =
        await sql`SELECT id, author_id FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (existing.length === 0)
        return c.json({ error: "Publication introuvable." }, 404);
      if (Number(existing[0].author_id) !== userId)
        return c.json({ error: "Réservé à l'auteur." }, 403);
      const tierRows =
        await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
      if (!isPaidTier(tierRows[0]?.tier)) {
        return c.json(
          {
            error:
              "La planification des vibes est réservée aux abonnés Plus, Pro et Max.",
            plan_required: true,
          },
          403
        );
      }
      const raw = body?.scheduled_at;
      if (raw === null || raw === "") {
        await sql`UPDATE posts SET status = 'published', scheduled_at = NULL, published_at = NOW(), updated_at = NOW() WHERE id = ${postId}::uuid`;
        return c.json({ status: "published", success: true });
      }
      const ts = Date.parse(String(raw || ""));
      if (Number.isNaN(ts) || ts <= Date.now()) {
        return c.json(
          { error: "Date de planification invalide ou passée." },
          400
        );
      }
      const scheduledAt = new Date(ts).toISOString();
      await sql`UPDATE posts SET status = 'scheduled', scheduled_at = ${scheduledAt}::timestamptz, updated_at = NOW() WHERE id = ${postId}::uuid`;
      return c.json({
        scheduled_at: scheduledAt,
        status: "scheduled",
        success: true,
      });
    } catch {
      return c.json({ error: "Erreur replanification." }, 500);
    }
  };

  registerMulti(
    "patch",
    [
      "/api/vibe/posts/:id/reschedule",
      "/vibe/posts/:id/reschedule",
      "/v1/posts/:id/reschedule",
      "/posts/:id/reschedule",
    ],
    handleReschedule
  );

  // 1g. DRAFTS CRUD (multi-brouillons, tri updated_at DESC)
  const handleDraftsList = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const sql = getDb();
      await ensurePostColumns();
      const drafts =
        await sql`SELECT * FROM post_drafts WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 20`;
      return c.json({ drafts });
    } catch {
      return c.json({ error: "Erreur brouillons." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/drafts", "/vibe/drafts", "/v1/drafts", "/drafts"],
    handleDraftsList
  );

  const handleDraftUpsert = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const body = await c.req.json().catch(() => ({}));
      const draftId = c.req.param("id") || (body as any)?.id;
      const html = String(body?.html || "");
      const text = String(body?.text || "");
      if (!html && !text) return c.json({ error: "Brouillon vide." }, 400);
      const visibility = ["public", "followers", "circle", "private"].includes(
        body?.visibility
      )
        ? body.visibility
        : "public";
      const scheduledAt = body?.scheduled_at
        ? new Date(Date.parse(String(body.scheduled_at))).toISOString()
        : null;
      const aiGenerated = Boolean(body?.ai_generated);
      const mediaAssets = Array.isArray(body?.media_assets)
        ? body.media_assets.slice(0, 10)
        : [];
      const sql = getDb();
      await ensurePostColumns();
      if (draftId && isUuid(String(draftId))) {
        const owned =
          await sql`SELECT id FROM post_drafts WHERE id = ${String(draftId)}::uuid AND user_id = ${userId} LIMIT 1`;
        if (owned.length === 0)
          return c.json({ error: "Brouillon introuvable." }, 404);
        await sql`
          UPDATE post_drafts
          SET html = ${html}, text = ${text}, visibility = ${visibility}, scheduled_at = ${scheduledAt}::timestamptz,
              ai_generated = ${aiGenerated}, media_assets = ${JSON.stringify(mediaAssets)}::jsonb, updated_at = NOW()
          WHERE id = ${String(draftId)}::uuid
        `;
        return c.json({ id: String(draftId), success: true });
      }
      const inserted = await sql`
        INSERT INTO post_drafts (user_id, html, text, visibility, scheduled_at, ai_generated, media_assets)
        VALUES (${userId}, ${html}, ${text}, ${visibility}, ${scheduledAt}::timestamptz, ${aiGenerated}, ${JSON.stringify(mediaAssets)}::jsonb)
        RETURNING id
      `;
      return c.json({ id: String(inserted[0]?.id), success: true }, 201);
    } catch {
      return c.json({ error: "Erreur sauvegarde brouillon." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/drafts", "/vibe/drafts", "/v1/drafts", "/drafts"],
    handleDraftUpsert
  );
  registerMulti(
    "put",
    [
      "/api/vibe/drafts/:id",
      "/vibe/drafts/:id",
      "/v1/drafts/:id",
      "/drafts/:id",
    ],
    handleDraftUpsert
  );

  const handleDraftDelete = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const draftId = c.req.param("id");
      if (!isUuid(String(draftId)))
        return c.json({ error: "Identifiant invalide." }, 400);
      const sql = getDb();
      await sql`DELETE FROM post_drafts WHERE id = ${String(draftId)}::uuid AND user_id = ${userId}`;
      return c.json({ success: true });
    } catch {
      return c.json({ error: "Erreur suppression brouillon." }, 500);
    }
  };

  registerMulti(
    "delete",
    [
      "/api/vibe/drafts/:id",
      "/vibe/drafts/:id",
      "/v1/drafts/:id",
      "/drafts/:id",
    ],
    handleDraftDelete
  );

  const handleGetPost = async (c: any) => {
    try {
      const postId = c.req.param("id");
      const token = extractToken(c.req.raw);
      let currentUserId: number | null = null;
      if (token) {
        try {
          const payload = await verifyToken(token);
          currentUserId = Number(payload.sub || (payload as any).id);
        } catch {}
      }

      const sql = getDb();
      await ensureCircleTable().catch(() => {});
      const rows = await sql`
        SELECT p.*, pr.display_name, pr.avatar_url, u.username,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'like') > 0` : sql`FALSE`} as has_liked,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ${currentUserId} AND interaction_type = 'repost') > 0` : sql`FALSE`} as has_reposted,
               ${currentUserId ? sql`(SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUserId}) > 0` : sql`FALSE`} as has_bookmarked,
               ${currentUserId ? sql`(SELECT pi.interaction_type FROM post_interactions pi WHERE pi.post_id = p.id AND pi.user_id = ${currentUserId} AND pi.interaction_type IN ('interest_more', 'interest_less') LIMIT 1)` : sql`NULL`} as my_feedback
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.user_id = u.id
        WHERE p.id = ${postId}::uuid ${visibilityFilter(currentUserId)}
        LIMIT 1
      `;

      if (rows.length === 0)
        return c.json({ error: "Publication introuvable." }, 404);

      // Une vibe planifiée n'est visible que par son auteur
      if (
        (rows[0] as any).status === "scheduled" &&
        Number((rows[0] as any).author_id) !== currentUserId
      ) {
        return c.json({ error: "Publication introuvable." }, 404);
      }

      const media =
        await sql`SELECT * FROM media_assets WHERE post_id = ${postId}::uuid ORDER BY position ASC, created_at ASC`.catch(
          async () =>
            await sql`SELECT * FROM media_assets WHERE post_id = ${postId}::uuid`
        );
      const postResult = { ...rows[0], media_assets: media };
      await attachQuotedPosts([postResult]);
      await attachPollsAndCollabs([postResult], currentUserId);
      await attachBookRefs([postResult], currentUserId).catch(() => {});
      return c.json({ post: postResult });
    } catch {
      return c.json({ error: "Erreur lors de la récupération." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/posts/:id", "/vibe/posts/:id", "/v1/posts/:id", "/posts/:id"],
    handleGetPost
  );

  const handleDeletePost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      const sql = getDb();

      const deleted = await sql`
        DELETE FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId} RETURNING id
      `;

      if (deleted.length === 0) {
        return c.json(
          { error: "Publication introuvable ou non autorisée." },
          403
        );
      }

      await sql`UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE user_id = ${userId}`;
      return c.json({ message: "Publication supprimée.", success: true });
    } catch {
      return c.json({ error: "Erreur suppression." }, 500);
    }
  };

  registerMulti(
    "delete",
    ["/api/vibe/posts/:id", "/vibe/posts/:id", "/v1/posts/:id", "/posts/:id"],
    handleDeletePost
  );

  // 1bis. ÉDITION D'UNE PUBLICATION (auteur uniquement)
  const handleUpdatePost = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const postId = c.req.param("id");
      if (!isUuid(postId)) {
        return c.json({ error: "Identifiant de post invalide." }, 400);
      }

      const body = await c.req.json();
      const { content, media_assets = [] } = body;

      const sql = getDb();
      await ensurePostColumns();

      const existing =
        await sql`SELECT id, author_id, status, scheduled_at FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
      if (existing.length === 0) {
        return c.json({ error: "Publication introuvable." }, 404);
      }
      if (Number(existing[0].author_id) !== userId) {
        return c.json(
          { error: "Seul l'auteur peut modifier cette publication." },
          403
        );
      }

      if (!content || !String(content).trim()) {
        return c.json({ error: "Le contenu est obligatoire." }, 400);
      }

      // Limite de longueur par forfait (texte brut, balises de mise en forme exclues)
      const tierRows =
        await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
      const isPaid = isPaidTier(tierRows[0]?.tier);
      const charLimit = isPaid ? POST_CHARS_LIMIT_PAID : POST_CHARS_LIMIT_FREE;
      if (stripHtmlTags(String(content)).length > charLimit) {
        return c.json(postCharsError(isPaid, charLimit), 400);
      }

      const safety = MAIAgentFleet.assessContentSafety(stripHtmlTags(content));
      if (!safety.isSafe) {
        return c.json(
          { error: `Publication refusée : ${safety.flagReason}` },
          403
        );
      }

      // Re-planification éventuelle (réservée Plus/Pro/Max)
      let scheduledAt: string | null = null;
      if (body.scheduled_at !== undefined) {
        if (body.scheduled_at === null || body.scheduled_at === "") {
          scheduledAt = null;
        } else {
          const ts = Date.parse(String(body.scheduled_at));
          if (Number.isNaN(ts) || ts <= Date.now()) {
            return c.json(
              { error: "Date de planification invalide ou passée." },
              400
            );
          }
          if (!isPaid) {
            return c.json(
              {
                error:
                  "La planification des vibes est réservée aux abonnés Plus, Pro et Max.",
                plan_required: true,
              },
              403
            );
          }
          scheduledAt = new Date(ts).toISOString();
        }
      }

      // Audience mise à jour si fournie (Public / Abonnés / Cercle Privé / privé)
      const visibilityUpdate = [
        "public",
        "followers",
        "circle",
        "private",
      ].includes(body.visibility)
        ? body.visibility
        : null;

      const updated = await sql`
        UPDATE posts
        SET content = ${String(content).trim()},
            toxicity_score = ${safety.toxicityScore},
            visibility = COALESCE(${visibilityUpdate}, visibility),
            updated_at = NOW(),
            published_at = CASE WHEN ${scheduledAt}::timestamptz IS NULL AND status = 'scheduled' THEN NOW() ELSE published_at END,
            status = CASE
              WHEN ${scheduledAt}::timestamptz IS NOT NULL THEN 'scheduled'
              ELSE 'published'
            END,
            scheduled_at = ${scheduledAt}::timestamptz
        WHERE id = ${postId}::uuid AND author_id = ${userId}
        RETURNING *
      `;
      if (updated.length === 0) {
        return c.json({ error: "Publication introuvable." }, 404);
      }

      // Références de Livres : resynchronisées avec le nouveau contenu
      const updatedBookRefIds = extractBookRefIds(String(content));
      if (updatedBookRefIds.length > 0)
        await ensureBooksTables(sql).catch(() => {});
      await syncPostBookRefs(sql, postId, updatedBookRefIds);

      // Remplacement des médias (légendes incluses) si la liste est fournie
      const insertedMediaList: any[] = [];
      if (Array.isArray(media_assets)) {
        await sql`DELETE FROM media_assets WHERE post_id = ${postId}::uuid AND comment_id IS NULL`;
        const inferMediaType = (
          url: string,
          fallback = "image/jpeg"
        ): string => {
          try {
            const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
            switch (ext) {
              case "png":
                return "image/png";
              case "webp":
                return "image/webp";
              case "gif":
                return "image/gif";
              case "jpg":
              case "jpeg":
                return "image/jpeg";
              case "mp4":
                return "video/mp4";
              case "webm":
                return "video/webm";
              case "mov":
                return "video/quicktime";
              default:
                return fallback;
            }
          } catch {
            return fallback;
          }
        };
        const mediaPositions = Array.isArray(body.media_positions)
          ? body.media_positions
          : [];
        for (let mi = 0; mi < media_assets.length; mi++) {
          const media = media_assets[mi];
          if (!media?.url) continue;
          const urlStr = String(media.url).trim();
          if (!urlStr) continue;
          const position = Number.isFinite(Number(mediaPositions[mi]))
            ? Number(mediaPositions[mi])
            : mi;
          let res: any[] = [];
          try {
            res = await sql`
              INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text, position)
              VALUES (${userId}, ${postId}::uuid, ${urlStr}, ${media.media_type || media.type || inferMediaType(urlStr)},
                      ${Math.max(0, Math.round(Number(media.file_size_bytes ?? media.size ?? 0) || 0))},
                      ${media.alt_text || media.alt || ""}, ${position})
              RETURNING id, url, media_type, file_size_bytes, alt_text, position
            `;
          } catch {
            // Colonne position absente (base ancienne) : insertion sans ordre
            res = await sql`
              INSERT INTO media_assets (owner_id, post_id, url, media_type, file_size_bytes, alt_text)
              VALUES (${userId}, ${postId}::uuid, ${urlStr}, ${media.media_type || media.type || inferMediaType(urlStr)},
                      ${Math.max(0, Math.round(Number(media.file_size_bytes ?? media.size ?? 0) || 0))},
                      ${media.alt_text || media.alt || ""})
              RETURNING id, url, media_type, file_size_bytes, alt_text
            `;
          }
          if (res?.[0]) insertedMediaList.push(res[0]);
        }
      }

      const userRow =
        await sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
      const profileRow =
        await sql`SELECT display_name, avatar_url FROM profiles WHERE user_id = ${userId} LIMIT 1`;
      const updatedPost: any = {
        ...updated[0],
        avatar_url: profileRow[0]?.avatar_url,
        display_name: profileRow[0]?.display_name || userRow[0]?.username,
        media_assets: insertedMediaList,
        quoted_post: null,
        username: userRow[0]?.username,
      };
      await attachQuotedPosts([updatedPost]);
      await attachBookRefs([updatedPost], userId).catch(() => {});

      return c.json({ post: updatedPost, success: true });
    } catch (err: any) {
      console.error("[Vibe API] Error updating post:", err);
      return c.json(
        { error: "Erreur lors de la modification de la publication." },
        500
      );
    }
  };

  registerMulti(
    "patch",
    ["/api/vibe/posts/:id", "/vibe/posts/:id", "/v1/posts/:id", "/posts/:id"],
    handleUpdatePost
  );
}
