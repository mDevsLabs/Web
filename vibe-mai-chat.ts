import { fetchOpenRouter } from "./openrouter-fetch.ts";
/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI: CHAT (vibe-mai-chat.ts)
 * Réponse mAI en commentaire (/mai) et endpoint de conversation mAI avec
 * détection d'outils, contexte de post joint (vision), contexte personnel
 * opt-in et flux d'approbation. Scindé de vibe-mai.ts (limite de taille
 * Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import {
  extractToken,
  getDb,
  getTierMaiTokenLimit,
  getUserQuotaBoost,
  getWeekData,
  isPaidTier,
  rateLimitShared,
  verifyToken,
} from "./config.ts";
import {
  isFreeModelId,
  ModelAccessError,
  requireChatModel,
} from "./openrouter-models.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import {
  buildPostContext,
  detectTool,
  ensureMAIConversations,
  formatToolReply,
  getOpenRouterKey,
  getOrCreateConversation,
  getUserAutoApprove,
  makeToolCallRecord,
  maybeAutoTitleConversation,
  resolveOwnedConversation,
  saveMAIMessage,
  VISION_CAPABLE_MODELS,
} from "./vibe-mai-core.ts";
import { MAIAgentFleet, SENSITIVE_TOOLS } from "./vibe-mai-fleet.ts";
import { extractMaiReasoning } from "./vibe-mai-reasoning.ts";
import { isToolEnabledForUser, TOOL_EXECUTORS } from "./vibe-tools.ts";

/**
 * Réserve atomiquement une estimation de tokens AVANT l'appel fournisseur.
 * Deux conversations simultanées ne peuvent plus lire le même solde et
 * dépasser ensemble le quota hebdomadaire du compte.
 */
async function reserveWeeklyTokens(
  sql: any,
  userId: number,
  weekStartStr: string,
  amount: number,
  limit: number
): Promise<{ ok: boolean; used: number }> {
  const current =
    await sql`SELECT tokens_used FROM weekly_usage WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`;
  const used = Number(current[0]?.tokens_used || 0);
  if (amount > limit) {
    return { ok: false, used };
  }
  const rows = await sql`
    INSERT INTO weekly_usage (user_id, week_start, tokens_used)
    VALUES (${userId}::integer, ${weekStartStr}::date, ${amount}::integer)
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${amount}::integer
    WHERE weekly_usage.tokens_used + ${amount}::integer <= ${limit}::integer
    RETURNING tokens_used
  `;
  if (rows.length > 0) {
    return { ok: true, used: Number(rows[0].tokens_used) };
  }
  const after =
    await sql`SELECT tokens_used FROM weekly_usage WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`;
  return { ok: false, used: Number(after[0]?.tokens_used || used) };
}

/** Ajuste la réservation à la consommation RÉELLE (une seule fois par requête). */
async function settleWeeklyTokens(
  sql: any,
  userId: number,
  weekStartStr: string,
  delta: number
): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) return;
  if (delta > 0) {
    await sql`
      INSERT INTO weekly_usage (user_id, week_start, tokens_used)
      VALUES (${userId}::integer, ${weekStartStr}::date, ${Math.floor(delta)}::integer)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${Math.floor(delta)}::integer
    `;
    return;
  }
  await sql`
    UPDATE weekly_usage
    SET tokens_used = GREATEST(0, tokens_used - ${Math.floor(-delta)}::integer)
    WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date
  `;
}

/**
 * Réponse mAI à la commande /mai en commentaire: génération à partir du
 * contenu de la publication uniquement (sans historique de conversation),
 * modèle léger laguna, quota hebdomadaire débité de 250 tokens.
 *
 * Ce commentaire est public : il ne reçoit ni la mémoire du compte ni les
 * instructions personnalisées, qui resteraient lisibles par les autres.
 */
export async function generateMAICommentAnswer(
  sql: any,
  opts: { postId: string; question: string; requesterId: number }
): Promise<string | null> {
  try {
    const context = await buildPostContext(sql, opts.postId, opts.requesterId);
    if (!context) return null;

    const openRouterApiKey = await getOpenRouterKey(sql, opts.requesterId);
    if (!openRouterApiKey) return null;

    const systemContent =
      "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. " +
      "Réponds en français, en un commentaire concis et utile (500 caractères maximum), " +
      "uniquement à partir du contenu de la publication fournie (texte, statistiques, commentaires). " +
      "Si l'information demandée ne s'y trouve pas, dis-le clairement. Pas de mise en forme lourde, un ou deux émojis maximum.";

    const userText = `${opts.question}\n\n${context.text}`;

    let answer: string | null = null;
    let commentUsage: any = null;
    for (const candidate of [
      "poolside/laguna-xs-2.1:free",
      "nvidia/nemotron-3.5-lightning:free",
    ]) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        try {
          const aiRes = await fetchOpenRouter(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              body: JSON.stringify({
                messages: [
                  { content: systemContent, role: "system" },
                  { content: userText, role: "user" },
                ],
                model: candidate,
              }),
              headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mai.val.run",
                "X-Title": "mAI Social Assistant",
              },
              method: "POST",
              signal: controller.signal,
            }
          );
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const textOutput = aiData.choices?.[0]?.message?.content;
            if (textOutput?.trim()) {
              answer = textOutput.trim();
              commentUsage = aiData.usage || null;
              break;
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (e) {
        console.warn(
          `[mAI /mai] Erreur sur ${candidate}, essai du suivant...`,
          e
        );
      }
    }
    if (!answer) return null;

    // Débit quota réel (parité avec le chat mAI)
    const tokensUsed = Number(
      commentUsage?.total_tokens ||
        Math.max(100, Math.ceil(((userText || "").length + answer.length) / 4))
    );
    try {
      const { weekStartStr } = getWeekData();
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${opts.requesterId}, ${weekStartStr}::date, ${tokensUsed})
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${tokensUsed}
      `;
    } catch {}

    return answer.slice(0, 800);
  } catch (err) {
    console.warn("[mAI /mai] generateMAICommentAnswer:", (err as any)?.message);
    return null;
  }
}

const PLAFOND_MEMOIRE = 6000;

/**
 * Personnalisation du compte mAI pour le chat privé.
 *
 * Vibe ne peut pas importer le builder Next : la lecture est du SQL sur les
 * mêmes tables, et un échec (schéma absent, search_path) laisse le chat
 * partir sans ce bloc plutôt que de refuser le message.
 */
async function blocPersonnalisationCompte(
  sql: any,
  userId: number,
  username: string
): Promise<string> {
  try {
    const identite =
      await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`.catch(
        () => []
      );
    const email = String(identite[0]?.email || "")
      .trim()
      .toLowerCase();
    const rows = await sql`
      SELECT content FROM "UserMemory"
      WHERE "isEnabled" = true
        AND "agentId" IS NULL
        AND "projectId" IS NULL
        AND (
          "userId" = ${String(userId)}
          OR ("userId" = ${email} AND ${email} <> '')
          OR ("userId" = ${username} AND ${username} <> '')
        )
      ORDER BY "isImportant" DESC, "createdAt" DESC
      LIMIT 50
    `;
    const prefs = await sql`
      SELECT "customInstructions" AS instructions,
             "customInstructionsEnabled" AS enabled
      FROM "user_preferences"
      WHERE "userId" = ${String(userId)}
         OR ("userId" = ${email} AND ${email} <> '')
         OR ("userId" = ${username} AND ${username} <> '')
      LIMIT 1
    `;
    const lignes: string[] = [];
    let taille = 0;
    for (const row of rows as any[]) {
      const ligne = String(row?.content || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!ligne) continue;
      const cout = (lignes.length > 0 ? 1 : 0) + ligne.length;
      if (taille + cout > PLAFOND_MEMOIRE) break;
      lignes.push(ligne);
      taille += cout;
    }
    const blocs: string[] = [];
    const instructions = String(prefs[0]?.instructions || "").trim();
    if (prefs[0]?.enabled && instructions) {
      blocs.push(`INSTRUCTIONS DE L'UTILISATEUR\n${instructions}`);
    }
    if (lignes.length > 0) {
      const liste = lignes
        .map((ligne, index) => `${index + 1}. ${ligne}`)
        .join("\n");
      blocs.push(
        `MÉMOIRE — Informations retenues sur l'utilisateur :\n${liste}\nUtilise ces informations pour personnaliser tes réponses sans les répéter verbatim. Ce sont des faits privés : ne les recopie pas dans un contenu public.`
      );
    }
    if (blocs.length === 0) return "";
    return `\n\n${blocs.join("\n\n")}`;
  } catch (err) {
    console.warn("[vibe-mai] personnalisation compte indisponible:", err);
    return "";
  }
}

export function registerVibeMAIChatRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 1. mAI CHAT & TOOL EXECUTION
  const handleMAIChat = async (c: any) => {
    // Réservation de quota à restituer si le fournisseur ne répond pas.
    const maiReservation = {
      estimated: 0,
      settled: false,
      userId: 0,
      weekStartStr: "",
    };
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const {
        message,
        execute_tool,
        model,
        context,
        conversation_id,
        reasoning_effort,
      } = await c.req.json();
      if (!message?.trim()) return c.json({ error: "Message requis." }, 400);

      // Modèle demandé par le client (sélecteur mAI), sinon réglage utilisateur
      const effectiveModel =
        model || (await MAIAgentFleet.getUserDefaultModel(userId));

      // Anti-abus partagé entre isolates.
      if (!(await rateLimitShared(`mai-chat:${userId}`, 30, 60_000))) {
        return c.json(
          { error: "Trop de messages mAI. Patientez un instant." },
          429
        );
      }

      const sql = getDb();
      const userRows =
        await sql`SELECT username, tier FROM users WHERE id = ${userId} LIMIT 1`;
      const usernameBrut = String(userRows[0]?.username || "").trim();
      const username = usernameBrut || "Ami";
      const personnalisationPromise = blocPersonnalisationCompte(
        sql,
        userId,
        usernameBrut
      );
      // Le forfait de la BASE est l'autorité (pas le JWT, pas la présence
      // d'une clé OpenRouter côté plateforme).
      const tier = String(userRows[0]?.tier || "Free");
      const paid = isPaidTier(tier);

      const { weekStartStr } = getWeekData();
      maiReservation.userId = userId;
      maiReservation.weekStartStr = weekStartStr;
      const [quotaRow, maiBoost] = await Promise.all([
        sql`SELECT tokens_used FROM weekly_usage WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`.catch(
          () => [] as any[]
        ),
        getUserQuotaBoost(sql, userId, "mai"),
      ]);
      const weeklyLimit = getTierMaiTokenLimit(tier) + maiBoost;
      const weeklyUsed = Number(quotaRow[0]?.tokens_used || 0);
      if (weeklyUsed >= weeklyLimit) {
        return c.json(
          {
            code: "mai_quota_exceeded",
            error: "Votre quota mAI hebdomadaire est épuisé.",
            limit: weeklyLimit,
            used: weeklyUsed,
          },
          429
        );
      }

      // ── Conversation persistée: contexte complet pour chaque message ──
      await ensureMAIConversations();
      const requestedConv = await resolveOwnedConversation(
        sql,
        userId,
        conversation_id
      );
      if (requestedConv.invalid) {
        return c.json({ error: "Conversation introuvable." }, 404);
      }
      const conversationId =
        requestedConv.id || (await getOrCreateConversation(sql, userId));
      let savedUser: any = null;
      if (conversationId) {
        savedUser = await saveMAIMessage(
          sql,
          conversationId,
          "user",
          String(message).trim()
        );
        // Titre automatique de la conversation au premier message utilisateur
        try {
          const cnt = await sql`
            SELECT COUNT(*) AS n FROM mai_messages
            WHERE conversation_id = ${conversationId}::uuid AND sender_role = 'user'
          `;
          if (Number(cnt[0]?.n || 0) === 1) {
            await maybeAutoTitleConversation(
              sql,
              conversationId,
              String(message)
            );
          }
        } catch {}
      }
      // Historique récent (20 derniers échanges, sans le message courant)
      let historyMessages: Array<{
        role: "user" | "assistant";
        content: string;
      }> = [];
      if (conversationId) {
        try {
          const historyRows = await sql`
            SELECT sender_role, content FROM mai_messages
            WHERE conversation_id = ${conversationId}::uuid
            ORDER BY created_at DESC
            LIMIT 21
          `;
          historyMessages = historyRows
            .filter((r: any) => r.content && String(r.content).trim())
            .slice(1) // le message courant vient d'être inséré
            .reverse()
            .map((r: any) => ({
              content: String(r.content).slice(0, 4000),
              role: r.sender_role === "assistant" ? "assistant" : "user",
            }));
        } catch (historyErr) {
          console.warn("[vibe-mai] Historique non chargé:", historyErr);
        }
      }

      // Post mentionné: contenu + stats + premiers commentaires + médias (fichiers)
      let postContextBlock = "";
      let postImageParts: any[] = [];
      if (context?.post_id) {
        const postCtx = await buildPostContext(
          sql,
          String(context.post_id),
          userId
        );
        if (postCtx) {
          postContextBlock = `\n\n---\n${postCtx.text}`;
          postImageParts = postCtx.imageParts;
        }
      }

      // Personnalisation du contexte (opt-in granulaire via user_settings)
      let personalContextBlock = "";
      try {
        const ctxRows =
          await sql`SELECT mai_context_posts, mai_context_dms, mai_context_books FROM user_settings WHERE user_id = ${userId} LIMIT 1`.catch(
            () => []
          );
        const flags = ctxRows[0] || {};
        const trunc = (s: any, n: number) =>
          String(s || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, n);
        if (flags.mai_context_posts) {
          const recentPosts = await sql`
            SELECT content, published_at FROM posts
            WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published'
            ORDER BY published_at DESC LIMIT 20
          `.catch(() => []);
          if (recentPosts.length > 0) {
            const list = recentPosts
              .map(
                (p: any, i: number) => `${i + 1}. « ${trunc(p.content, 500)}»`
              )
              .join("\n");
            personalContextBlock += `\n\nContexte: voici les publications récentes de l'utilisateur:\n${list}`;
          }
        }
        if (flags.mai_context_dms) {
          console.warn(
            `[vibe-mai] Contexte DM inclus pour user ${userId} (opt-in mai_context_dms=TRUE) — données confidentielles.`
          );
          const recentDMs = await sql`
            SELECT content, created_at FROM direct_messages
            WHERE (sender_id = ${userId} OR recipient_id = ${userId})
              AND (status IS NULL OR status = 'sent')
            ORDER BY created_at DESC LIMIT 10
          `.catch(() => []);
          if (recentDMs.length > 0) {
            const excerpt = recentDMs
              .map((m: any) => `— « ${trunc(m.content, 200)}»`)
              .join("\n")
              .slice(0, 2000);
            personalContextBlock += `\n\nContexte: extraits récents des messages privés de l'utilisateur (confidentiel, ne pas citer verbatim):\n${excerpt}`;
          }
        }
        if (flags.mai_context_books) {
          const books =
            await sql`SELECT id, title FROM vibe_books WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 10`.catch(
              () => []
            );
          if (books.length > 0) {
            const titles = books
              .map((b: any) => `— ${trunc(b.title, 80)}`)
              .join("\n");
            personalContextBlock += `\n\nContexte: Vibe Books de l'utilisateur:\n${titles}`;
            try {
              const bookIds = books.map((b: any) => b.id);
              const items = await sql`
                SELECT bi.book_id, p.content FROM vibe_book_items bi
                JOIN posts p ON p.id = bi.post_id
                WHERE bi.book_id = ANY(${bookIds}::uuid[])
                LIMIT 20
              `.catch(() => []);
              if (items.length > 0) {
                const itemList = items
                  .map((it: any) => `— « ${trunc(it.content, 200)}»`)
                  .join("\n")
                  .slice(0, 2000);
                personalContextBlock += `\nPublications épinglées dans ces livres:\n${itemList}`;
              }
            } catch {}
          }
        }
      } catch (ctxErr) {
        console.warn(
          "[vibe-mai] Contexte personnalisé ignoré:",
          (ctxErr as any)?.message
        );
      }

      let toolToRun: string | null = execute_tool?.name || null;
      let toolArgs: any = execute_tool?.args || {};

      if (!toolToRun) {
        const detected = detectTool(message.trim());
        if (detected) {
          toolToRun = detected.toolToRun;
          toolArgs = detected.toolArgs;
        }
      }

      // ── Filtre des outils activés par l'utilisateur (Paramètres → Outils mAI) ──
      // Un outil désactivé n'est ni détecté ni exécutable pour cet utilisateur.
      if (toolToRun && !(await isToolEnabledForUser(userId, toolToRun))) {
        const reply = ` L'outil « ${toolToRun}» est désactivé dans vos Paramètres → Outils mAI. Activez-le pour l'utiliser.`;
        const record = makeToolCallRecord({
          args: toolArgs,
          model: effectiveModel,
          name: toolToRun,
          status: "disabled",
        });
        let savedAssistant: any = null;
        if (conversationId) {
          savedAssistant = await saveMAIMessage(
            sql,
            conversationId,
            "assistant",
            reply,
            { toolCalls: [record] }
          );
        }
        return c.json({
          assistant_message_id: savedAssistant?.id || null,
          conversation_id: conversationId || null,
          modelUsed: effectiveModel,
          reply,
          toolCalls: [record],
          toolExecuted: null,
          user_message_id: savedUser?.id || null,
        });
      }

      // ── Flux d'approbation utilisateur ──────────────────────────────
      // Un outil sensible n'est exécuté que si l'utilisateur l'approuve,
      // sauf si `mai_auto_approve_tools` est activé dans ses paramètres.
      if (toolToRun && SENSITIVE_TOOLS.includes(toolToRun)) {
        const autoApprove = await getUserAutoApprove(sql, userId);
        if (!autoApprove) {
          const reply = ` **Approbation requise**: mAI souhaite exécuter l'outil « ${toolToRun}» sur votre compte. Confirmez ou refusez dans le panneau ci-dessus.`;
          const record = makeToolCallRecord({
            args: toolArgs,
            model: effectiveModel,
            name: toolToRun,
            status: "pending_approval",
          });
          let savedAssistant: any = null;
          if (conversationId) {
            savedAssistant = await saveMAIMessage(
              sql,
              conversationId,
              "assistant",
              reply,
              { toolCalls: [record] }
            );
          }
          return c.json({
            assistant_message_id: savedAssistant?.id || null,
            conversation_id: conversationId || null,
            modelUsed: effectiveModel,
            pendingTool: { args: toolArgs, name: toolToRun },
            reply,
            requiresApproval: true,
            toolCalls: [record],
            toolExecuted: null,
            user_message_id: savedUser?.id || null,
          });
        }
      }

      let reply = `Bonjour @${username}! Je suis mAI. Comment puis-je vous aider?`;
      let providerResponded = false;

      let toolResult: any = null;
      if (toolToRun) {
        // Registre vibe-tools d'abord (couvre les outils sans case dans la flotte,
        // ex. analyze_creator_stats), flotte en repli.
        const executor = TOOL_EXECUTORS[toolToRun];
        toolResult = executor
          ? await executor(userId, toolArgs)
          : await MAIAgentFleet.executeTool(toolToRun, toolArgs, userId);
      }

      if (!toolToRun) {
        const openRouterApiKey = await getOpenRouterKey(sql, userId);

        // Alias historiques → identifiants du catalogue. Tout autre identifiant
        // est validé par le catalogue ET le forfait : un modèle inconnu ou
        // hors forfait est refusé AVANT l'appel fournisseur.
        const MIA_MODEL_ALIASES: Record<string, string> = {
          default: "poolside/laguna-xs-2.1:free",
          "mai-1.5-apex": "openai/gpt-4o",
          "mai-1.5-light": "poolside/laguna-xs-2.1:free",
          "openrouter/free": "poolside/laguna-xs-2.1:free",
        };
        const requestedModel =
          MIA_MODEL_ALIASES[String(effectiveModel)] ||
          String(effectiveModel || "");

        let primaryStored: Awaited<ReturnType<typeof requireChatModel>>;
        try {
          primaryStored = await requireChatModel(sql, requestedModel, paid);
        } catch (modelError) {
          if (modelError instanceof ModelAccessError) {
            return c.json(
              {
                error: {
                  code: modelError.code,
                  message: modelError.message,
                },
              },
              modelError.status
            );
          }
          throw modelError;
        }

        const hasImages = postImageParts.length > 0;
        let primaryModel = primaryStored.id;
        // Images jointes → modèle vision autorisé pour le forfait. Un compte
        // Free ne reçoit PAS un modèle payant par la seule présence de la clé
        // OPENROUTER_API_KEY de la plateforme.
        if (hasImages && !VISION_CAPABLE_MODELS.has(primaryModel)) {
          const visionModelId = paid
            ? "openai/gpt-4o"
            : "google/gemini-2.5-flash:free";
          try {
            const visionStored = await requireChatModel(
              sql,
              visionModelId,
              paid
            );
            primaryModel = visionStored.id;
          } catch {
            return c.json(
              {
                error: {
                  code: "vision_requires_paid",
                  message:
                    "L'analyse d'images jointes nécessite un modèle vision autorisé par votre forfait.",
                },
              },
              403
            );
          }
        }
        const modelsToTry = [primaryModel];
        const fallbackModels = hasImages
          ? ["google/gemini-2.5-flash:free", "google/gemini-2.5-flash"]
          : [
              "poolside/laguna-xs-2.1:free",
              "nvidia/nemotron-3.5-lightning:free",
            ];
        for (const fallback of fallbackModels) {
          if (!paid && !isFreeModelId(fallback)) continue;
          if (!modelsToTry.includes(fallback)) modelsToTry.push(fallback);
        }

        // Réserve AVANT l'appel fournisseur (concurrence comprise), puis
        // ajustement sur l'usage réel. Un échec fournisseur rend la place.
        const estimated = Math.max(
          64,
          Math.ceil((String(message).length + postContextBlock.length) / 4) +
            256
        );
        const estimatedReservation = Math.min(estimated, weeklyLimit);
        const reservation = await reserveWeeklyTokens(
          sql,
          userId,
          weekStartStr,
          estimatedReservation,
          weeklyLimit
        );
        if (!reservation.ok) {
          return c.json(
            {
              code: "mai_quota_exceeded",
              error: "Votre quota mAI hebdomadaire est épuisé.",
              limit: weeklyLimit,
              used: reservation.used,
            },
            429
          );
        }
        maiReservation.estimated = estimatedReservation;

        const personnalisation = await personnalisationPromise;
        const userText = `${message.trim()}${postContextBlock}${personalContextBlock}`;
        const userContent: any = hasImages
          ? [{ text: userText, type: "text" }, ...postImageParts]
          : userText;
        const systemContent =
          "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. Tu es concis, créatif, pertinent et tu réponds en français avec des émojis." +
          " Tu connais l'historique de la conversation en cours: apporte ta réponse en continuité naturelle avec les échanges précédents, sans redemander des informations déjà données." +
          (hasImages
            ? " Des images sont jointes à la publication mentionnée: analyse-les directement."
            : "") +
          (postContextBlock
            ? " Une publication Vibe est jointe à la fin du message: base ta réponse sur son contenu, ses statistiques et ses commentaires."
            : "") +
          personnalisation;

        let capturedUsage: any = null;
        let capturedReasoning = "";
        if (openRouterApiKey) {
          for (const candidate of modelsToTry) {
            try {
              const aiRes = await fetchOpenRouter(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  body: JSON.stringify({
                    messages: [
                      {
                        content: systemContent,
                        role: "system",
                      },
                      ...historyMessages,
                      { content: userContent, role: "user" },
                    ],
                    model: candidate,
                    ...(reasoning_effort
                      ? { reasoning: { effort: reasoning_effort } }
                      : {}),
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
                const message = aiData.choices?.[0]?.message;
                const textOutput = message?.content;
                if (textOutput?.trim()) {
                  reply = textOutput.trim();
                  providerResponded = true;
                  capturedUsage = aiData.usage || null;
                  capturedReasoning = extractMaiReasoning(message);
                  break;
                }
              }
            } catch (e) {
              console.warn(
                `[mAI Chat] Erreur sur ${candidate}, essai du suivant...`,
                e
              );
            }
          }
        }
      } else if (toolResult?.success) {
        reply = formatToolReply(toolToRun, toolResult.result, username);
      } else if (toolResult && !toolResult.success) {
        reply = ` L'action n'a pas pu être exécutée: ${toolResult.error}`;
      }

      // Persistance de la réponse mAI (avec les outils utilisés — chips du chat)
      const toolCallRecords = toolToRun
        ? [
            makeToolCallRecord({
              args: toolArgs,
              error:
                toolResult && !toolResult.success
                  ? toolResult.error || "Erreur d'exécution"
                  : null,
              model: effectiveModel,
              name: toolToRun,
              result: toolResult,
              status: toolResult?.success ? "executed" : "error",
            }),
          ]
        : [];
      let savedAssistant: any = null;
      if (conversationId) {
        savedAssistant = await saveMAIMessage(
          sql,
          conversationId,
          "assistant",
          reply,
          { reasoning: capturedReasoning, toolCalls: toolCallRecords }
        );
      }

      // Décompte précis des tokens
      const inputTokens = Number(
        capturedUsage?.prompt_tokens || Math.ceil((message || "").length / 4)
      );
      const outputTokens = Number(
        capturedUsage?.completion_tokens || Math.ceil((reply || "").length / 4)
      );
      const totalTokens = Number(
        capturedUsage?.total_tokens || inputTokens + outputTokens
      );
      // Aucun appel fournisseur réussi → aucune consommation facturable : la
      // réservation est intégralement rendue.
      const billedTokens = providerResponded ? totalTokens : 0;

      if (maiReservation.estimated > 0 && !maiReservation.settled) {
        maiReservation.settled = true;
        try {
          await settleWeeklyTokens(
            sql,
            userId,
            weekStartStr,
            billedTokens - maiReservation.estimated
          );
        } catch (settleError) {
          console.error(
            "[mAI Chat] Règlement du quota impossible:",
            settleError
          );
        }
      }

      return c.json({
        assistant_message_id: savedAssistant?.id || null,
        conversation_id: conversationId || null,
        inputTokens: providerResponded ? inputTokens : 0,
        modelUsed: effectiveModel,
        outputTokens: providerResponded ? outputTokens : 0,
        reasoning: capturedReasoning,
        reply,
        tokensUsed: billedTokens,
        toolCalls: toolCallRecords,
        toolExecuted: toolToRun
          ? { name: toolToRun, result: toolResult }
          : null,
        usage: {
          completion_tokens: providerResponded ? outputTokens : 0,
          prompt_tokens: providerResponded ? inputTokens : 0,
          total_tokens: billedTokens,
        },
        user_message_id: savedUser?.id || null,
      });
    } catch (err: any) {
      // Une erreur après réservation (persistance, réseau) ne doit pas laisser
      // une place débitée : restitution idempotente.
      if (maiReservation.estimated > 0 && !maiReservation.settled) {
        maiReservation.settled = true;
        try {
          await settleWeeklyTokens(
            getDb(),
            maiReservation.userId,
            maiReservation.weekStartStr,
            -maiReservation.estimated
          );
        } catch {}
      }
      console.error("[Vibe API] mAI Chat Error:", err);
      return c.json({ error: "Erreur lors de la conversation avec mAI." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/mai/chat", "/vibe/mai/chat", "/v1/mai/chat"],
    handleMAIChat
  );
}
