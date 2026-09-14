/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : RÉGÉNÉRATION & EXÉCUTION D'OUTILS
 * (vibe-mai-execute.ts)
 * Régénération de la dernière réponse, exécution d'un outil approuvé et refus
 * d'un outil sensible. Mêmes contrôles que le chat : catalogue, outils
 * activés, approbation, débit et quotas. Scindé de vibe-mai.ts (limite de
 * taille Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import {
  extractToken,
  getDb,
  getWeekData,
  rateLimit,
  verifyToken,
} from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import {
  _resolveOpenRouterModel,
  buildPostContext,
  ensureMAIConversations,
  finalizePendingToolMessage,
  formatToolReply,
  getOpenRouterKey,
  getOrCreateConversation,
  getUserAutoApprove,
  makeToolCallRecord,
  resolveOwnedConversation,
  saveMAIMessage,
} from "./vibe-mai-core.ts";
import { MAIAgentFleet, SENSITIVE_TOOLS } from "./vibe-mai-fleet.ts";
import {
  isToolEnabledForUser,
  MAI_TOOLS_CATALOG,
  TOOL_EXECUTORS,
} from "./vibe-tools.ts";

export function registerVibeMAIExecuteRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 1bis-bis. RÉGÉNÉRATION DE LA DERNIÈRE RÉPONSE mAI
  // Rejoue le dernier message utilisateur (éventuellement avec le post joint),
  // supprime la réponse assistant qui suivait et en produit une nouvelle.
  const handleMAIRegenerate = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const body = await c.req.json().catch(() => ({}) as any);
      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(
        sql,
        userId,
        body?.conversation_id
      );
      if (conv.invalid)
        return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId =
        conv.id || (await getOrCreateConversation(sql, userId));

      const lastUserRows = conversationId
        ? await sql`
            SELECT id, content, created_at FROM mai_messages
            WHERE conversation_id = ${conversationId}::uuid AND sender_role = 'user' AND content IS NOT NULL
            ORDER BY created_at DESC LIMIT 1
          `
        : [];
      if (lastUserRows.length === 0) {
        return c.json({ error: "Aucun message à régénérer." }, 400);
      }
      const lastUser: any = lastUserRows[0];

      // Supprime la (les) réponse(s) assistant postérieures au dernier message utilisateur
      await sql`
        DELETE FROM mai_messages
        WHERE conversation_id = ${conversationId}::uuid AND sender_role = 'assistant' AND created_at > ${lastUser.created_at}
      `.catch(() => {});

      // Historique antérieur (hors message courant), même filtre que le chat
      let historyMessages: any[] = [];
      try {
        const historyRows = await sql`
          SELECT sender_role, content FROM mai_messages
          WHERE conversation_id = ${conversationId}::uuid AND content IS NOT NULL
            AND created_at < ${lastUser.created_at}
          ORDER BY created_at DESC LIMIT 20
        `;
        historyMessages = historyRows
          .slice()
          .reverse()
          .map((m: any) => ({
            content: String(m.content).slice(0, 4000),
            role: m.sender_role === "assistant" ? "assistant" : "user",
          }));
      } catch {}

      // Contexte de post optionnel (même comportement que le chat mAI)
      let postContextBlock = "";
      const contextPostId = body?.context?.post_id;
      if (contextPostId) {
        const postCtx = await buildPostContext(sql, String(contextPostId));
        if (postCtx) postContextBlock = `\n\n${postCtx.text}`;
      }

      const effectiveModel =
        body?.model || (await MAIAgentFleet.getUserDefaultModel(userId));
      const primaryModel = _resolveOpenRouterModel(effectiveModel);
      const openRouterApiKey = await getOpenRouterKey(sql, userId);

      const systemContent =
        "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. Tu es concis, créatif, pertinent et tu réponds en français avec des émojis." +
        " Tu connais l'historique de la conversation en cours : apporte ta réponse en continuité naturelle avec les échanges précédents, sans redemander des informations déjà données." +
        (postContextBlock
          ? " Une publication Vibe est jointe à la fin du message : base ta réponse sur son contenu, ses statistiques et ses commentaires."
          : "");

      let reply = "";
      if (openRouterApiKey) {
        const modelsToTry = [
          primaryModel,
          "poolside/laguna-xs-2.1:free",
          "nvidia/nemotron-3.5-lightning:free",
        ].filter(Boolean);
        for (const candidate of Array.from(new Set(modelsToTry))) {
          try {
            const aiRes = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                body: JSON.stringify({
                  messages: [
                    { content: systemContent, role: "system" },
                    ...historyMessages,
                    {
                      content: `${String(lastUser.content).trim()}${postContextBlock}`,
                      role: "user",
                    },
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
              `[mAI Regenerate] Erreur sur ${candidate}, essai du suivant...`,
              e
            );
          }
        }
      }
      if (!reply) {
        return c.json(
          { error: "Impossible de régénérer la réponse pour le moment." },
          502
        );
      }

      const saved = await saveMAIMessage(
        sql,
        conversationId,
        "assistant",
        reply
      );

      // Débit quota (parité avec le chat mAI)
      try {
        const { weekStartStr } = getWeekData();
        await sql`
          INSERT INTO weekly_usage (user_id, week_start, tokens_used)
          VALUES (${userId}, ${weekStartStr}::date, 250)
          ON CONFLICT (user_id, week_start)
          DO UPDATE SET tokens_used = weekly_usage.tokens_used + 250
        `;
      } catch {}

      return c.json({
        conversation_id: conversationId || null,
        message_id: saved?.id || null,
        modelUsed: effectiveModel,
        reply,
        success: true,
        user_message_id: lastUser?.id || null,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Regenerate Error:", err);
      return c.json({ error: "Erreur lors de la régénération." }, 500);
    }
  };
  registerMulti(
    "post",
    ["/api/vibe/mai/regenerate", "/vibe/mai/regenerate", "/v1/mai/regenerate"],
    handleMAIRegenerate
  );

  // 1bis. EXÉCUTION D'OUTIL APPROUVÉ PAR L'UTILISATEUR
  // Appelé par le front uniquement après confirmation explicite (bouton
  // "Approuver") — ou pour un outil non sensible (lecture seule).
  // Mêmes contrôles que le chat : catalogue, outils activés, approbation
  // des outils sensibles, limite de débit et débit de quota.
  const handleExecuteTool = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const {
        name,
        args = {},
        model,
        approve = false,
        conversation_id,
      } = await c.req.json();
      if (!name) return c.json({ error: "Nom d'outil requis." }, 400);
      const toolName = String(name);

      const catalogTool = MAI_TOOLS_CATALOG.find((t) => t.id === toolName);
      if (!catalogTool || !catalogTool.enabled) {
        return c.json(
          { error: `Outil inconnu ou désactivé : ${toolName}` },
          404
        );
      }

      if (!rateLimit(`mai-execute:${userId}`, 30, 60_000)) {
        return c.json(
          { error: "Trop de requêtes d'exécution. Réessayez dans une minute." },
          429
        );
      }

      const effectiveModel =
        model || (await MAIAgentFleet.getUserDefaultModel(userId));

      // Conversation ciblée (multi-conversations) — plus récente par défaut
      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, conversation_id);
      if (conv.invalid)
        return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId =
        conv.id || (await getOrCreateConversation(sql, userId));

      if (!(await isToolEnabledForUser(userId, toolName))) {
        const reply = `🚫 L'outil « ${toolName} » est désactivé dans vos Paramètres → Outils mAI. Activez-le pour l'utiliser.`;
        const record = makeToolCallRecord({
          args,
          model: effectiveModel,
          name: toolName,
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
        });
      }

      if (SENSITIVE_TOOLS.includes(toolName) && approve !== true) {
        const autoApprove = await getUserAutoApprove(sql, userId);
        if (!autoApprove) {
          // Le record « pending_approval » a déjà été persisté par le chat mAI :
          // aucune écriture supplémentaire ici (pas de doublon).
          return c.json({
            conversation_id: conversationId || null,
            modelUsed: effectiveModel,
            pendingTool: { args, name: toolName },
            reply: `🔐 **Approbation requise** : mAI souhaite exécuter l'outil « ${toolName} » sur votre compte. Confirmez ou refusez dans le panneau ci-dessus.`,
            requiresApproval: true,
            toolExecuted: null,
          });
        }
      }

      const executor = TOOL_EXECUTORS[toolName];
      const result = executor
        ? await executor(userId, args)
        : await MAIAgentFleet.executeTool(toolName, args, userId);
      const reply = result.success
        ? formatToolReply(toolName, result.result, "")
        : `⚠️ L'action n'a pas pu être exécutée : ${result.error}`;

      if (result.success) {
        const { weekStartStr } = getWeekData();
        await sql`
          INSERT INTO weekly_usage (user_id, week_start, tokens_used)
          VALUES (${userId}, ${weekStartStr}::date, 250)
          ON CONFLICT (user_id, week_start)
          DO UPDATE SET tokens_used = weekly_usage.tokens_used + 250
        `.catch(() => {});
      }

      // Persistance : finalise le message « approbation en attente » existant,
      // sinon insère un nouveau message assistant (jamais de doublon).
      const record = makeToolCallRecord({
        args,
        error: result.success ? null : result.error || "Erreur d'exécution",
        model: effectiveModel,
        name: toolName,
        result,
        status: result.success ? "executed" : "error",
      });
      let savedAssistantId: string | null = null;
      if (conversationId) {
        const finalized = await finalizePendingToolMessage(
          sql,
          conversationId,
          toolName,
          {
            error: result.success ? null : result.error || "Erreur d'exécution",
            model: effectiveModel,
            reply,
            result,
            status: result.success ? "executed" : "error",
          }
        );
        if (finalized.id) {
          savedAssistantId = finalized.id;
        } else {
          const saved = await saveMAIMessage(
            sql,
            conversationId,
            "assistant",
            reply,
            { toolCalls: [record] }
          );
          savedAssistantId = saved?.id ? String(saved.id) : null;
        }
      }

      return c.json({
        assistant_message_id: savedAssistantId,
        conversation_id: conversationId || null,
        modelUsed: effectiveModel,
        reply,
        toolCalls: [record],
        toolExecuted: { name: toolName, result },
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Execute Tool Error:", err);
      return c.json({ error: "Erreur lors de l'exécution de l'outil." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/mai/execute-tool",
      "/vibe/mai/execute-tool",
      "/v1/mai/execute-tool",
    ],
    handleExecuteTool
  );

  // 1ter. REFUS D'UN OUTIL SENSIBLE (persistance du flux d'approbation)
  // Appelé par le front quand l'utilisateur refuse : le message assistant
  // « approbation en attente » est finalisé avec le statut « rejected ».
  const handleMAIToolRefused = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const {
        name,
        args = {},
        conversation_id,
      } = await c.req.json().catch(() => ({}) as any);
      const toolName = String(name || "").trim();
      if (!toolName) return c.json({ error: "Nom d'outil requis." }, 400);

      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, conversation_id);
      if (conv.invalid)
        return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId =
        conv.id || (await getOrCreateConversation(sql, userId));

      const reply = `🚫 Très bien, je n'exécute pas l'outil « ${toolName} ». Dites-moi si je peux faire autre chose pour vous.`;
      const record = makeToolCallRecord({
        args,
        name: toolName,
        status: "rejected",
      });
      let savedId: string | null = null;
      if (conversationId) {
        const finalized = await finalizePendingToolMessage(
          sql,
          conversationId,
          toolName,
          { reply, status: "rejected" }
        );
        if (finalized.id) {
          savedId = finalized.id;
        } else {
          const saved = await saveMAIMessage(
            sql,
            conversationId,
            "assistant",
            reply,
            { toolCalls: [record] }
          );
          savedId = saved?.id ? String(saved.id) : null;
        }
      }

      return c.json({
        conversation_id: conversationId || null,
        message_id: savedId,
        reply,
        success: true,
        toolCalls: [record],
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Tool Refused Error:", err);
      return c.json({ error: "Erreur lors du refus de l'outil." }, 500);
    }
  };
  registerMulti(
    "post",
    [
      "/api/vibe/mai/tool-refused",
      "/vibe/mai/tool-refused",
      "/v1/mai/tool-refused",
    ],
    handleMAIToolRefused
  );
}
