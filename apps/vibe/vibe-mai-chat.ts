/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : CHAT (vibe-mai-chat.ts)
 * Réponse mAI en commentaire (/mai) et endpoint de conversation mAI avec
 * détection d'outils, contexte de post joint (vision), contexte personnel
 * opt-in et flux d'approbation. Scindé de vibe-mai.ts (limite de taille
 * Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken, rateLimit } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { MAIAgentFleet, SENSITIVE_TOOLS } from "./vibe-mai-fleet.ts";
import { TOOL_EXECUTORS, isToolEnabledForUser } from "./vibe-tools.ts";
import {
  ensureMAIConversations,
  getOrCreateConversation,
  resolveOwnedConversation,
  maybeAutoTitleConversation,
  saveMAIMessage,
  makeToolCallRecord,
  detectTool,
  getUserAutoApprove,
  formatToolReply,
  buildPostContext,
  getOpenRouterKey,
  VISION_CAPABLE_MODELS,
  APPROVAL_NONCE_ARG,
  createApprovalNonce,
  sanitizeToolArgs,
  reserveMAIQuota,
  readJSONResponseLimited,
} from "./vibe-mai-core.ts";

function boundedToolResult(value: any, maxChars = 24_000): any {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return null;
    if (serialized.length <= maxChars) return value;
    return { truncated: true, preview: serialized.slice(0, maxChars) };
  } catch {
    return { unavailable: true };
  }
}

/**
 * Réponse mAI à la commande /mai en commentaire : génération à partir du
 * contenu de la publication uniquement (sans historique de conversation),
 * modèle léger laguna, quota hebdomadaire débité de 250 tokens.
 */
export async function generateMAICommentAnswer(
  sql: any,
  opts: { postId: string; question: string; requesterId: number }
): Promise<string | null> {
  try {
    const question = String(opts.question || "").trim().slice(0, 2_000);
    if (!question) return null;
    const context = await buildPostContext(sql, opts.postId, opts.requesterId);
    if (!context) return null;

    const openRouterApiKey = await getOpenRouterKey(sql, opts.requesterId);
    if (!openRouterApiKey) return null;
    // Réservation avant l'appel externe afin qu'un quota épuisé ne
    // déclenche pas de consommation OpenRouter.
    const quota = await reserveMAIQuota(sql, opts.requesterId);
    if (!quota.ok) return null;

    const systemContent =
      "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. " +
      "Réponds en français, en un commentaire concis et utile (500 caractères maximum), " +
      "uniquement à partir du contenu de la publication fournie (texte, statistiques, commentaires). " +
      "Si l'information demandée ne s'y trouve pas, dis-le clairement. Pas de mise en forme lourde, un ou deux émojis maximum.";

    const userText = `${question}\n\n${context.text}`;

    let answer: string | null = null;
    for (const candidate of ["poolside/laguna-xs-2.1:free", "nvidia/nemotron-3.5-lightning:free"]) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://mai.val.run",
              "X-Title": "mAI Social Assistant",
            },
            body: JSON.stringify({
              model: candidate,
              messages: [
                { role: "system", content: systemContent },
                { role: "user", content: userText },
              ],
            }),
            signal: controller.signal,
          });
          if (aiRes.ok) {
            const aiData = await readJSONResponseLimited(aiRes);
            const textOutput = typeof aiData?.choices?.[0]?.message?.content === "string"
              ? aiData.choices[0].message.content.trim()
              : "";
            if (textOutput) {
              answer = textOutput.slice(0, 800);
              break;
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (e) {
        console.warn(`[mAI /mai] Erreur sur ${candidate}, essai du suivant...`, e);
      }
    }
    if (!answer) return null;

    return answer.slice(0, 800);
  } catch (err) {
    console.warn("[mAI /mai] generateMAICommentAnswer:", (err as any)?.message);
    return null;
  }
}

export function registerVibeMAIChatRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 1. mAI CHAT & TOOL EXECUTION
  const handleMAIChat = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const body = await c.req.json().catch(() => ({} as any));
      const { execute_tool, context, conversation_id } = body || {};
      if (typeof body?.message !== "string") return c.json({ error: "Message requis." }, 400);
      const message = body.message.trim();
      if (!message) return c.json({ error: "Message requis." }, 400);
      if (message.length > 8_000) return c.json({ error: "Message trop long (8 000 caractères maximum)." }, 400);
      if (body.model !== undefined && (typeof body.model !== "string" || body.model.length > 120)) {
        return c.json({ error: "Modèle invalide." }, 400);
      }
      if (!rateLimit(`mai-chat:${userId}`, 20, 60_000)) {
        return c.json({ error: "Trop de requêtes mAI. Réessayez dans une minute." }, 429);
      }

      // Modèle demandé par le client (sélecteur mAI), sinon réglage utilisateur
      const effectiveModel = body.model || (await MAIAgentFleet.getUserDefaultModel(userId));

      const sql = getDb();
      const userRows = await sql`SELECT username, tier FROM users WHERE id = ${userId} LIMIT 1`;
      const username = userRows[0]?.username || "Ami";

      // ── Conversation persistée : contexte complet pour chaque message ──
      await ensureMAIConversations();
      const requestedConv = await resolveOwnedConversation(sql, userId, conversation_id);
      if (requestedConv.invalid) return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId = requestedConv.id || await getOrCreateConversation(sql, userId);
      let savedUser: any = null;
      if (conversationId) {
        savedUser = await saveMAIMessage(sql, conversationId, "user", String(message).trim());
        // Titre automatique de la conversation au premier message utilisateur
        try {
          const cnt = await sql`
            SELECT COUNT(*) AS n FROM mai_messages
            WHERE conversation_id = ${conversationId}::uuid AND sender_role = 'user'
          `;
          if (Number(cnt[0]?.n || 0) === 1) await maybeAutoTitleConversation(sql, conversationId, String(message));
        } catch {}
      }
      // Historique récent (20 derniers échanges, sans le message courant)
      let historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
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
              role: r.sender_role === "assistant" ? "assistant" : "user",
              content: String(r.content).slice(0, 4000),
            }));
        } catch (historyErr) {
          console.warn("[vibe-mai] Historique non chargé:", historyErr);
        }
      }

      // Post mentionné : contenu + stats + premiers commentaires + médias (fichiers).
      // buildPostContext applique l'auth du demandeur ; un identifiant fourni
      // mais inaccessible est une erreur, jamais un contexte silencieusement vide.
      let postContextBlock = "";
      let postImageParts: any[] = [];
      if (context?.post_id !== undefined && context?.post_id !== null && context?.post_id !== "") {
        if (typeof context.post_id !== "string" || context.post_id.length > 80) {
          return c.json({ error: "Identifiant de publication invalide." }, 400);
        }
        const postCtx = await buildPostContext(sql, context.post_id, userId);
        if (!postCtx) return c.json({ error: "Publication introuvable ou inaccessible." }, 404);
        postContextBlock = `\n\n---\n${postCtx.text}`;
        postImageParts = postCtx.imageParts;
      }

      // Personnalisation du contexte (opt-in granulaire via user_settings)
      let personalContextBlock = "";
      try {
        const ctxRows = await sql`SELECT mai_context_posts, mai_context_dms, mai_context_books FROM user_settings WHERE user_id = ${userId} LIMIT 1`.catch(() => []);
        const flags = ctxRows[0] || {};
        const trunc = (s: any, n: number) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
        if (flags.mai_context_posts) {
          const recentPosts = await sql`
            SELECT content, published_at FROM posts
            WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published'
            ORDER BY published_at DESC LIMIT 20
          `.catch(() => []);
          if (recentPosts.length > 0) {
            const list = recentPosts.map((p: any, i: number) => `${i + 1}. « ${trunc(p.content, 500)} »`).join("\n");
            personalContextBlock += `\n\nContexte : voici les publications récentes de l'utilisateur :\n${list}`;
          }
        }
        if (flags.mai_context_dms) {
          console.warn(`[vibe-mai] Contexte DM inclus pour user ${userId} (opt-in mai_context_dms=TRUE) — données confidentielles.`);
          const recentDMs = await sql`
            SELECT content, created_at FROM direct_messages
            WHERE (sender_id = ${userId} OR recipient_id = ${userId})
              AND (status IS NULL OR status = 'sent')
            ORDER BY created_at DESC LIMIT 10
          `.catch(() => []);
          if (recentDMs.length > 0) {
            const excerpt = recentDMs.map((m: any) => `— « ${trunc(m.content, 200)} »`).join("\n").slice(0, 2000);
            personalContextBlock += `\n\nContexte : extraits récents des messages privés de l'utilisateur (confidentiel, ne pas citer verbatim) :\n${excerpt}`;
          }
        }
        if (flags.mai_context_books) {
          const books = await sql`SELECT id, title FROM vibe_books WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 10`.catch(() => []);
          if (books.length > 0) {
            const titles = books.map((b: any) => `— ${trunc(b.title, 80)}`).join("\n");
            personalContextBlock += `\n\nContexte : Vibe Books de l'utilisateur :\n${titles}`;
            try {
              const bookIds = books.map((b: any) => b.id);
              const items = await sql`
                SELECT bi.book_id, p.content FROM vibe_book_items bi
                JOIN posts p ON p.id = bi.post_id
                WHERE bi.book_id = ANY(${bookIds}::uuid[])
                LIMIT 20
              `.catch(() => []);
              if (items.length > 0) {
                const itemList = items.map((it: any) => `— « ${trunc(it.content, 200)} »`).join("\n").slice(0, 2000);
                personalContextBlock += `\nPublications épinglées dans ces livres :\n${itemList}`;
              }
            } catch {}
          }
        }
      } catch (ctxErr) {
        console.warn("[vibe-mai] Contexte personnalisé ignoré:", (ctxErr as any)?.message);
      }

      let toolToRun: string | null = null;
      let toolArgs: Record<string, any> = {};
      if (execute_tool !== undefined && execute_tool !== null) {
        if (typeof execute_tool !== "object" || typeof execute_tool.name !== "string" || execute_tool.name.length > 100) {
          return c.json({ error: "Outil mAI invalide." }, 400);
        }
        toolToRun = execute_tool.name;
        try {
          toolArgs = sanitizeToolArgs(execute_tool.args);
          delete toolArgs[APPROVAL_NONCE_ARG];
        } catch (err: any) {
          return c.json({ error: err?.message || "Arguments d'outil invalides." }, 400);
        }
      }

      if (!toolToRun) {
        const detected = detectTool(message.trim());
        if (detected) {
          toolToRun = detected.toolToRun;
          try {
            toolArgs = sanitizeToolArgs(detected.toolArgs);
            delete toolArgs[APPROVAL_NONCE_ARG];
          } catch (err: any) {
            return c.json({ error: err?.message || "Arguments d'outil invalides." }, 400);
          }
        }
      }

      // ── Filtre des outils activés par l'utilisateur (Paramètres → Outils mAI) ──
      // Un outil désactivé n'est ni détecté ni exécutable pour cet utilisateur.
      if (toolToRun && !(await isToolEnabledForUser(userId, toolToRun))) {
        const reply = `🚫 L'outil « ${toolToRun} » est désactivé dans vos Paramètres → Outils mAI. Activez-le pour l'utiliser.`;
        const record = makeToolCallRecord({ name: toolToRun, args: toolArgs, status: "disabled", model: effectiveModel });
        let savedAssistant: any = null;
        if (conversationId) savedAssistant = await saveMAIMessage(sql, conversationId, "assistant", reply, { toolCalls: [record] });
        return c.json({
          reply,
          toolExecuted: null,
          toolCalls: [record],
          modelUsed: effectiveModel,
          conversation_id: conversationId || null,
          user_message_id: savedUser?.id || null,
          assistant_message_id: savedAssistant?.id || null,
        });
      }

      // ── Flux d'approbation utilisateur ──────────────────────────────
      // Un outil sensible n'est exécuté que si l'utilisateur l'approuve,
      // sauf si `mai_auto_approve_tools` est activé dans ses paramètres.
      if (toolToRun && SENSITIVE_TOOLS.includes(toolToRun)) {
        const autoApprove = await getUserAutoApprove(sql, userId);
        if (!autoApprove) {
          const reply = `🔐 **Approbation requise** : mAI souhaite exécuter l'outil « ${toolToRun} » sur votre compte. Confirmez ou refusez dans le panneau ci-dessus.`;
          const approvalNonce = createApprovalNonce();
          const record = makeToolCallRecord({
            name: toolToRun,
            args: toolArgs,
            status: "pending_approval",
            model: effectiveModel,
            approvalNonce,
          });
          let savedAssistant: any = null;
          if (conversationId) savedAssistant = await saveMAIMessage(sql, conversationId, "assistant", reply, { toolCalls: [record] });
          // Le nonce est aussi transporté dans une clé args réservée : les
          // clients existants le renvoient sans modification, tandis que le
          // serveur ne l'accepte jamais seul sans l'enregistrement pending.
          const clientArgs = { ...toolArgs, [APPROVAL_NONCE_ARG]: approvalNonce };
          return c.json({
            reply,
            requiresApproval: true,
            pendingTool: { name: toolToRun, args: clientArgs, nonce: approvalNonce, approvalNonce },
            toolExecuted: null,
            toolCalls: [record],
            modelUsed: effectiveModel,
            conversation_id: conversationId || null,
            user_message_id: savedUser?.id || null,
            assistant_message_id: savedAssistant?.id || null,
          });
        }
      }

      let toolResult: any = null;
      let reply = "";
      let aiSucceeded = false;
      let lastAiStatus = 0;

      if (toolToRun) {
        const quota = await reserveMAIQuota(sql, userId);
        if (!quota.ok) return c.json({ error: quota.reason || "Quota mAI hebdomadaire atteint." }, 429);
        try {
          // Registre vibe-tools d'abord (couvre les outils sans case dans la flotte,
          // ex. analyze_creator_stats), flotte en repli.
          const executor = TOOL_EXECUTORS[toolToRun];
          toolResult = boundedToolResult(executor
            ? await executor(userId, toolArgs)
            : await MAIAgentFleet.executeTool(toolToRun, toolArgs, userId));
        } catch (err: any) {
          toolResult = { success: false, result: null, error: err?.message || "Erreur d'exécution" };
        }
        reply = toolResult?.success
          ? formatToolReply(toolToRun, toolResult.result, username)
          : `⚠️ L'action n'a pas pu être exécutée : ${String(toolResult?.error || "erreur inconnue").slice(0, 500)}`;
      } else {
        const openRouterApiKey = await getOpenRouterKey(sql, userId);
        if (!openRouterApiKey) {
          return c.json({ error: "Aucune clé IA n'est configurée pour le moment." }, 503);
        }
        const quota = await reserveMAIQuota(sql, userId);
        if (!quota.ok) return c.json({ error: quota.reason || "Quota mAI hebdomadaire atteint." }, 429);

        const resolveModel = (m: string) => {
          if (!m || m === "default" || m === "mai-1.5-light" || m === "openrouter/free") return "poolside/laguna-xs-2.1:free";
          if (m === "mai-1.5-apex") return "openai/gpt-4o";
          return m;
        };

        const hasImages = postImageParts.length > 0;
        let primaryModel = resolveModel(effectiveModel);
        // Images jointes → forcer un modèle vision si le modèle choisi ne l'est pas
        if (hasImages && !VISION_CAPABLE_MODELS.has(primaryModel)) {
          primaryModel = "openai/gpt-4o";
        }
        const modelsToTry = [primaryModel];
        if (hasImages) {
          if (!modelsToTry.includes("google/gemini-2.5-flash")) modelsToTry.push("google/gemini-2.5-flash");
        } else {
          if (!modelsToTry.includes("poolside/laguna-xs-2.1:free")) modelsToTry.push("poolside/laguna-xs-2.1:free");
          if (!modelsToTry.includes("nvidia/nemotron-3.5-lightning:free")) modelsToTry.push("nvidia/nemotron-3.5-lightning:free");
        }

        const userText = `${message}${postContextBlock}${personalContextBlock}`.slice(0, 24_000);
        const userContent: any = hasImages
          ? [{ type: "text", text: userText }, ...postImageParts]
          : userText;
        const systemContent =
          "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. Tu es concis, créatif, pertinent et tu réponds en français avec des émojis." +
          " Tu connais l'historique de la conversation en cours : apporte ta réponse en continuité naturelle avec les échanges précédents, sans redemander des informations déjà données." +
          (hasImages ? " Des images sont jointes à la publication mentionnée : analyse-les directement." : "") +
          (postContextBlock ? " Une publication Vibe est jointe à la fin du message : base ta réponse sur son contenu, ses statistiques et ses commentaires." : "");

        for (const candidate of modelsToTry) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20_000);
          try {
            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mai.val.run",
                "X-Title": "mAI Social Assistant",
              },
              body: JSON.stringify({
                model: candidate,
                messages: [
                  { role: "system", content: systemContent },
                  ...historyMessages,
                  { role: "user", content: userContent },
                ],
              }),
              signal: controller.signal,
            });
            lastAiStatus = aiRes.status;
            if (aiRes.ok) {
              const aiData = await readJSONResponseLimited(aiRes);
              const textOutput = typeof aiData?.choices?.[0]?.message?.content === "string"
                ? aiData.choices[0].message.content.trim()
                : "";
              if (textOutput) {
                reply = textOutput.slice(0, 20_000);
                aiSucceeded = true;
                break;
              }
            }
          } catch (e) {
            console.warn(`[mAI Chat] Erreur sur ${candidate}, essai du suivant...`, e);
          } finally {
            clearTimeout(timeout);
          }
        }
        if (!aiSucceeded) {
          console.warn(`[mAI Chat] OpenRouter n'a pas produit de réponse (dernier statut ${lastAiStatus}).`);
          // Ne sauvegarde jamais un greeting de secours comme si c'était une
          // réponse IA : le message utilisateur reste, l'assistant non.
          return c.json({ error: "Impossible d'obtenir une réponse mAI pour le moment." }, 502);
        }
      }

      // Persistance de la réponse mAI (avec les outils utilisés — chips du chat)
      const toolCallRecords = toolToRun
        ? [makeToolCallRecord({
            name: toolToRun,
            args: toolArgs,
            status: toolResult?.success ? "executed" : "error",
            result: toolResult,
            error: toolResult && !toolResult.success ? String(toolResult.error || "Erreur d'exécution").slice(0, 500) : null,
            model: effectiveModel,
          })]
        : [];
      let savedAssistant: any = null;
      if (conversationId) {
        savedAssistant = await saveMAIMessage(sql, conversationId, "assistant", reply, { toolCalls: toolCallRecords });
      }

      return c.json({
        reply,
        toolExecuted: toolToRun ? { name: toolToRun, result: toolResult } : null,
        toolCalls: toolCallRecords,
        modelUsed: effectiveModel,
        conversation_id: conversationId || null,
        user_message_id: savedUser?.id || null,
        assistant_message_id: savedAssistant?.id || null,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Chat Error:", err);
      return c.json({ error: "Erreur lors de la conversation avec mAI." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/mai/chat", "/vibe/mai/chat", "/v1/mai/chat"], handleMAIChat);
}
