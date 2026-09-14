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
import { extractToken, getDb, getWeekData, verifyToken } from "./config.ts";
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
import { isToolEnabledForUser, TOOL_EXECUTORS } from "./vibe-tools.ts";

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
    const context = await buildPostContext(sql, opts.postId);
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
    for (const candidate of [
      "poolside/laguna-xs-2.1:free",
      "nvidia/nemotron-3.5-lightning:free",
    ]) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        try {
          const aiRes = await fetch(
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
            if (textOutput && textOutput.trim()) {
              answer = textOutput.trim();
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

    // Débit quota (parité avec le chat mAI)
    try {
      const { weekStartStr } = getWeekData();
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${opts.requesterId}, ${weekStartStr}::date, 250)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 250
      `;
    } catch {}

    return answer.slice(0, 800);
  } catch (err) {
    console.warn("[mAI /mai] generateMAICommentAnswer:", (err as any)?.message);
    return null;
  }
}

export function registerVibeMAIChatRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 1. mAI CHAT & TOOL EXECUTION
  const handleMAIChat = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const { message, execute_tool, model, context, conversation_id } =
        await c.req.json();
      if (!message || !message.trim())
        return c.json({ error: "Message requis." }, 400);

      // Modèle demandé par le client (sélecteur mAI), sinon réglage utilisateur
      const effectiveModel =
        model || (await MAIAgentFleet.getUserDefaultModel(userId));

      const sql = getDb();
      const userRows =
        await sql`SELECT username, tier FROM users WHERE id = ${userId} LIMIT 1`;
      const username = userRows[0]?.username || "Ami";

      // ── Conversation persistée : contexte complet pour chaque message ──
      await ensureMAIConversations();
      const requestedConv = await resolveOwnedConversation(
        sql,
        userId,
        conversation_id
      );
      if (requestedConv.invalid)
        return c.json({ error: "Conversation introuvable." }, 404);
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
          if (Number(cnt[0]?.n || 0) === 1)
            await maybeAutoTitleConversation(
              sql,
              conversationId,
              String(message)
            );
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

      // Post mentionné : contenu + stats + premiers commentaires + médias (fichiers)
      let postContextBlock = "";
      let postImageParts: any[] = [];
      if (context?.post_id) {
        const postCtx = await buildPostContext(sql, String(context.post_id));
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
                (p: any, i: number) => `${i + 1}. « ${trunc(p.content, 500)} »`
              )
              .join("\n");
            personalContextBlock += `\n\nContexte : voici les publications récentes de l'utilisateur :\n${list}`;
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
              .map((m: any) => `— « ${trunc(m.content, 200)} »`)
              .join("\n")
              .slice(0, 2000);
            personalContextBlock += `\n\nContexte : extraits récents des messages privés de l'utilisateur (confidentiel, ne pas citer verbatim) :\n${excerpt}`;
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
                const itemList = items
                  .map((it: any) => `— « ${trunc(it.content, 200)} »`)
                  .join("\n")
                  .slice(0, 2000);
                personalContextBlock += `\nPublications épinglées dans ces livres :\n${itemList}`;
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
        const reply = `🚫 L'outil « ${toolToRun} » est désactivé dans vos Paramètres → Outils mAI. Activez-le pour l'utiliser.`;
        const record = makeToolCallRecord({
          args: toolArgs,
          model: effectiveModel,
          name: toolToRun,
          status: "disabled",
        });
        let savedAssistant: any = null;
        if (conversationId)
          savedAssistant = await saveMAIMessage(
            sql,
            conversationId,
            "assistant",
            reply,
            { toolCalls: [record] }
          );
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
          const reply = `🔐 **Approbation requise** : mAI souhaite exécuter l'outil « ${toolToRun} » sur votre compte. Confirmez ou refusez dans le panneau ci-dessus.`;
          const record = makeToolCallRecord({
            args: toolArgs,
            model: effectiveModel,
            name: toolToRun,
            status: "pending_approval",
          });
          let savedAssistant: any = null;
          if (conversationId)
            savedAssistant = await saveMAIMessage(
              sql,
              conversationId,
              "assistant",
              reply,
              { toolCalls: [record] }
            );
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

      let toolResult: any = null;
      if (toolToRun) {
        // Registre vibe-tools d'abord (couvre les outils sans case dans la flotte,
        // ex. analyze_creator_stats), flotte en repli.
        const executor = TOOL_EXECUTORS[toolToRun];
        toolResult = executor
          ? await executor(userId, toolArgs)
          : await MAIAgentFleet.executeTool(toolToRun, toolArgs, userId);
      }

      const { weekStartStr } = getWeekData();
      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${userId}, ${weekStartStr}::date, 250)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + 250
      `.catch(() => {});

      let reply = `Bonjour @${username} ! Je suis mAI. Comment puis-je vous aider ?`;

      if (!toolToRun) {
        const openRouterApiKey = await getOpenRouterKey(sql, userId);

        const resolveModel = (m: string) => {
          if (
            !m ||
            m === "default" ||
            m === "mai-1.5-light" ||
            m === "openrouter/free"
          )
            return "poolside/laguna-xs-2.1:free";
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
          if (!modelsToTry.includes("google/gemini-2.5-flash"))
            modelsToTry.push("google/gemini-2.5-flash");
        } else {
          if (!modelsToTry.includes("poolside/laguna-xs-2.1:free"))
            modelsToTry.push("poolside/laguna-xs-2.1:free");
          if (!modelsToTry.includes("nvidia/nemotron-3.5-lightning:free"))
            modelsToTry.push("nvidia/nemotron-3.5-lightning:free");
        }

        const userText = `${message.trim()}${postContextBlock}${personalContextBlock}`;
        const userContent: any = hasImages
          ? [{ text: userText, type: "text" }, ...postImageParts]
          : userText;
        const systemContent =
          "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. Tu es concis, créatif, pertinent et tu réponds en français avec des émojis." +
          " Tu connais l'historique de la conversation en cours : apporte ta réponse en continuité naturelle avec les échanges précédents, sans redemander des informations déjà données." +
          (hasImages
            ? " Des images sont jointes à la publication mentionnée : analyse-les directement."
            : "") +
          (postContextBlock
            ? " Une publication Vibe est jointe à la fin du message : base ta réponse sur son contenu, ses statistiques et ses commentaires."
            : "");

        if (openRouterApiKey) {
          for (const candidate of modelsToTry) {
            try {
              const aiRes = await fetch(
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
                const textOutput = aiData.choices?.[0]?.message?.content;
                if (textOutput && textOutput.trim()) {
                  reply = textOutput.trim();
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
      } else if (toolResult && toolResult.success) {
        reply = formatToolReply(toolToRun, toolResult.result, username);
      } else if (toolResult && !toolResult.success) {
        reply = `⚠️ L'action n'a pas pu être exécutée : ${toolResult.error}`;
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
          { toolCalls: toolCallRecords }
        );
      }

      return c.json({
        assistant_message_id: savedAssistant?.id || null,
        conversation_id: conversationId || null,
        modelUsed: effectiveModel,
        reply,
        toolCalls: toolCallRecords,
        toolExecuted: toolToRun
          ? { name: toolToRun, result: toolResult }
          : null,
        user_message_id: savedUser?.id || null,
      });
    } catch (err: any) {
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
