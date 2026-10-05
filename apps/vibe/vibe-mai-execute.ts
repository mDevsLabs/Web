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
import { extractToken, getDb, verifyToken, rateLimit } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { MAIAgentFleet, SENSITIVE_TOOLS } from "./vibe-mai-fleet.ts";
import { MAI_TOOLS_CATALOG, TOOL_EXECUTORS, isToolEnabledForUser } from "./vibe-tools.ts";
import {
  ensureMAIConversations,
  getOrCreateConversation,
  resolveOwnedConversation,
  saveMAIMessage,
  makeToolCallRecord,
  finalizePendingToolMessage,
  findPendingToolMessage,
  claimPendingToolMessage,
  getUserAutoApprove,
  formatToolReply,
  buildPostContext,
  getOpenRouterKey,
  _resolveOpenRouterModel,
  extractApprovalNonce,
  APPROVAL_NONCE_ARG,
  reserveMAIQuota,
  readJSONResponseLimited,
} from "./vibe-mai-core.ts";

export function registerVibeMAIExecuteRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 1bis-bis. RÉGÉNÉRATION DE LA DERNIÈRE RÉPONSE mAI
  // Rejoue le dernier message utilisateur (éventuellement avec le post joint),
  // supprime la réponse assistant qui suivait et en produit une nouvelle.
  const handleMAIRegenerate = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      if (!rateLimit(`mai-regenerate:${userId}`, 10, 60_000)) {
        return c.json({ error: "Trop de régénérations. Réessayez dans une minute." }, 429);
      }
      const body = await c.req.json().catch(() => ({} as any));
      if (body?.model !== undefined && (typeof body.model !== "string" || body.model.length > 120)) {
        return c.json({ error: "Modèle invalide." }, 400);
      }
      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, body?.conversation_id);
      if (conv.invalid) return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId = conv.id || await getOrCreateConversation(sql, userId);
      if (!conversationId) return c.json({ error: "Conversation indisponible." }, 500);

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
      // Capturer les IDs avant l'appel externe : created_at peut être identique
      // pour plusieurs messages insérés dans la même transaction.
      const assistantRows = await sql`
        SELECT id
        FROM mai_messages
        WHERE conversation_id = ${conversationId}::uuid
          AND sender_role = 'assistant'
          AND created_at > ${lastUser.created_at}
        ORDER BY created_at ASC, id ASC
        LIMIT 100
      `;
      const assistantIds = (assistantRows as any[]).map((row) => String(row.id)).filter(Boolean);

      // Historique antérieur (hors message courant), même filtre que le chat
      let historyMessages: any[] = [];
      try {
        const historyRows = await sql`
          SELECT sender_role, content FROM mai_messages
          WHERE conversation_id = ${conversationId}::uuid AND content IS NOT NULL
            AND created_at < ${lastUser.created_at}
          ORDER BY created_at DESC LIMIT 20
        `;
        historyMessages = historyRows.slice().reverse().map((m: any) => ({
          role: m.sender_role === "assistant" ? "assistant" : "user",
          content: String(m.content).slice(0, 4000),
        }));
      } catch {}

      // Contexte de post optionnel (même comportement que le chat mAI), avec
      // contrôle d'accès avant toute suppression de l'ancienne réponse.
      let postContextBlock = "";
      const contextPostId = body?.context?.post_id;
      if (contextPostId !== undefined && contextPostId !== null && contextPostId !== "") {
        if (typeof contextPostId !== "string" || contextPostId.length > 80) {
          return c.json({ error: "Identifiant de publication invalide." }, 400);
        }
        const postCtx = await buildPostContext(sql, contextPostId, userId);
        if (!postCtx) return c.json({ error: "Publication introuvable ou inaccessible." }, 404);
        postContextBlock = `\n\n${postCtx.text}`;
      }

      const effectiveModel = body?.model || (await MAIAgentFleet.getUserDefaultModel(userId));
      const primaryModel = _resolveOpenRouterModel(effectiveModel);
      const openRouterApiKey = await getOpenRouterKey(sql, userId);
      if (!openRouterApiKey) return c.json({ error: "Aucune clé IA n'est configurée pour le moment." }, 503);
      // Réservation avant l'appel externe : une régénération au quota ne
      // consomme pas de requête OpenRouter.
      const quota = await reserveMAIQuota(sql, userId);
      if (!quota.ok) return c.json({ error: quota.reason || "Quota mAI hebdomadaire atteint." }, 429);

      const systemContent =
        "Tu es mAI, l'intelligence artificielle intégrée au réseau social Vibe. Tu es concis, créatif, pertinent et tu réponds en français avec des émojis." +
        " Tu connais l'historique de la conversation en cours : apporte ta réponse en continuité naturelle avec les échanges précédents, sans redemander des informations déjà données." +
        (postContextBlock ? " Une publication Vibe est jointe à la fin du message : base ta réponse sur son contenu, ses statistiques et ses commentaires." : "");

      let reply = "";
      const modelsToTry = [primaryModel, "poolside/laguna-xs-2.1:free", "nvidia/nemotron-3.5-lightning:free"].filter(Boolean);
      for (const candidate of Array.from(new Set(modelsToTry))) {
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
                { role: "user", content: `${String(lastUser.content).trim()}${postContextBlock}`.slice(0, 24_000) },
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
              reply = textOutput.slice(0, 20_000);
              break;
            }
          }
        } catch (e) {
          console.warn(`[mAI Regenerate] Erreur sur ${candidate}, essai du suivant...`, e);
        } finally {
          clearTimeout(timeout);
        }
      }
      if (!reply) {
        // L'ancienne réponse est conservée : aucune fausse réponse n'est
        // persistée et une régénération échouée reste sans effet de bord.
        return c.json({ error: "Impossible de régénérer la réponse pour le moment." }, 502);
      }

      // Supprime uniquement les réponses capturées avant l'appel externe,
      // sans se fier à created_at (qui peut être identique pour un lot).
      if (assistantIds.length > 0) {
        await sql`
          DELETE FROM mai_messages
          WHERE id = ANY(${assistantIds}::uuid[])
        `.catch(() => {});
      }
      const saved = await saveMAIMessage(sql, conversationId, "assistant", reply);

      return c.json({
        success: true,
        reply,
        message_id: saved?.id || null,
        modelUsed: effectiveModel,
        conversation_id: conversationId || null,
        user_message_id: lastUser?.id || null,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Regenerate Error:", err);
      return c.json({ error: "Erreur lors de la régénération." }, 500);
    }
  };
  registerMulti("post", ["/api/vibe/mai/regenerate", "/vibe/mai/regenerate", "/v1/mai/regenerate"], handleMAIRegenerate);

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
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      const body = await c.req.json().catch(() => ({} as any));
      const { name, model, approve = false, conversation_id } = body || {};
      if (typeof name !== "string" || !name.trim() || name.length > 100) {
        return c.json({ error: "Nom d'outil requis." }, 400);
      }
      if (approve !== undefined && typeof approve !== "boolean") {
        return c.json({ error: "Approbation invalide." }, 400);
      }
      if (model !== undefined && (typeof model !== "string" || model.length > 120)) {
        return c.json({ error: "Modèle invalide." }, 400);
      }
      let parsedArgs: { args: Record<string, any>; nonce: string | null };
      try {
        parsedArgs = extractApprovalNonce(body?.args, body?.nonce ?? body?.approval_nonce ?? body?.approvalNonce);
      } catch (err: any) {
        return c.json({ error: err?.message || "Arguments d'outil invalides." }, 400);
      }
      const args = parsedArgs.args;
      const approvalNonce = parsedArgs.nonce;
      const toolName = name.trim();

      const catalogTool = MAI_TOOLS_CATALOG.find((t) => t.id === toolName);
      if (!catalogTool || !catalogTool.enabled) {
        return c.json({ error: `Outil inconnu ou désactivé : ${toolName}` }, 404);
      }

      if (!rateLimit(`mai-execute:${userId}`, 30, 60_000)) {
        return c.json({ error: "Trop de requêtes d'exécution. Réessayez dans une minute." }, 429);
      }

      const effectiveModel = model || (await MAIAgentFleet.getUserDefaultModel(userId));

      // Conversation ciblée (multi-conversations) — plus récente par défaut
      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, conversation_id);
      if (conv.invalid) return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId = conv.id || await getOrCreateConversation(sql, userId);
      if (!conversationId) return c.json({ error: "Conversation indisponible." }, 500);

      if (!(await isToolEnabledForUser(userId, toolName))) {
        const reply = `🚫 L'outil « ${toolName} » est désactivé dans vos Paramètres → Outils mAI. Activez-le pour l'utiliser.`;
        const record = makeToolCallRecord({ name: toolName, args, status: "disabled", model: effectiveModel });
        let savedAssistant: any = null;
        if (conversationId) savedAssistant = await saveMAIMessage(sql, conversationId, "assistant", reply, { toolCalls: [record] });
        return c.json({
          reply,
          toolExecuted: null,
          toolCalls: [record],
          modelUsed: effectiveModel,
          conversation_id: conversationId || null,
          assistant_message_id: savedAssistant?.id || null,
        });
      }

      let pendingApproval: { id: string; call: any } | null = null;
      let pendingCandidate: { id: string; call: any } | null = null;
      if (SENSITIVE_TOOLS.includes(toolName)) {
        const autoApprove = await getUserAutoApprove(sql, userId);
        if (!autoApprove) {
          // `approve=true` n'est jamais une preuve suffisante : il faut le
          // record pending persisté ET son nonce, ainsi que les arguments
          // exacts. Le nonce est trouvé dans le body ou dans args (client actuel).
          pendingCandidate = await findPendingToolMessage(sql, conversationId, toolName, args, approvalNonce);
          if (approve !== true || !approvalNonce || !pendingCandidate) {
            const pendingHint = pendingCandidate?.call?.approvalNonce || approvalNonce;
            return c.json({
              error: "Approbation serveur invalide ou expirée. Refaites la demande depuis le panneau mAI.",
              reply: `🔐 **Approbation requise** : mAI souhaite exécuter l'outil « ${toolName} » sur votre compte. Confirmez ou refusez dans le panneau ci-dessus.`,
              requiresApproval: true,
              pendingTool: pendingCandidate
                ? {
                    name: toolName,
                    args: pendingHint ? { ...args, [APPROVAL_NONCE_ARG]: pendingHint } : args,
                    nonce: pendingHint,
                    approvalNonce: pendingHint,
                  }
                : undefined,
              toolExecuted: null,
              modelUsed: effectiveModel,
              conversation_id: conversationId || null,
            }, 403);
          }
        }
      }

      const quota = await reserveMAIQuota(sql, userId);
      if (!quota.ok) return c.json({ error: quota.reason || "Quota mAI hebdomadaire atteint." }, 429);

      if (pendingCandidate) {
        pendingApproval = await claimPendingToolMessage(sql, conversationId, toolName, args, approvalNonce!);
        if (!pendingApproval) {
          return c.json({ error: "Cette approbation a déjà été consommée ou est en cours de traitement." }, 409);
        }
      }

      let result: any;
      try {
        const executor = TOOL_EXECUTORS[toolName];
        result = executor
          ? await executor(userId, args)
          : await MAIAgentFleet.executeTool(toolName, args, userId);
      } catch (err: any) {
        result = { success: false, result: null, error: err?.message || "Erreur d'exécution" };
      }
      const safeError = result?.success ? null : String(result?.error || "Erreur d'exécution").slice(0, 500);
      const safeResult = (() => {
        try {
          const serialized = JSON.stringify(result);
          if (serialized.length <= 24_000) return result;
          return { success: Boolean(result?.success), result: { truncated: true, preview: serialized.slice(0, 24_000) }, error: safeError };
        } catch {
          return { success: false, result: null, error: "Résultat d'outil indisponible." };
        }
      })();
      const reply = result?.success
        ? formatToolReply(toolName, result.result, "")
        : `⚠️ L'action n'a pas pu être exécutée : ${safeError}`;

      // Persistance : finalise le message « approbation en attente » existant,
      // sinon insère un nouveau message assistant (jamais de doublon).
      const record = makeToolCallRecord({
        name: toolName,
        args,
        status: result?.success ? "executed" : "error",
        result: safeResult,
        error: safeError,
        model: effectiveModel,
      });
      let savedAssistantId: string | null = null;
      if (conversationId) {
        if (pendingApproval) {
          const finalized = await finalizePendingToolMessage(
            sql,
            conversationId,
            toolName,
            {
              status: result?.success ? "executed" : "error",
              result: safeResult,
              error: safeError,
              reply,
              model: effectiveModel,
            },
            approvalNonce,
            args
          );
          if (!finalized.id) {
            console.error("[vibe-mai] pending approval introuvable après exécution", { toolName, userId });
            return c.json({ error: "Action exécutée mais journalisation d'approbation indisponible." }, 500);
          }
          savedAssistantId = finalized.id;
        } else {
          const saved = await saveMAIMessage(sql, conversationId, "assistant", reply, { toolCalls: [record] });
          savedAssistantId = saved?.id ? String(saved.id) : null;
        }
      }

      return c.json({
        reply,
        toolExecuted: { name: toolName, result: safeResult },
        toolCalls: [record],
        modelUsed: effectiveModel,
        conversation_id: conversationId || null,
        assistant_message_id: savedAssistantId,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Execute Tool Error:", err);
      return c.json({ error: "Erreur lors de l'exécution de l'outil." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/mai/execute-tool", "/vibe/mai/execute-tool", "/v1/mai/execute-tool"], handleExecuteTool);

  // 1ter. REFUS D'UN OUTIL SENSIBLE (persistance du flux d'approbation)
  // Appelé par le front quand l'utilisateur refuse : le message assistant
  // « approbation en attente » est finalisé avec le statut « rejected ».
  const handleMAIToolRefused = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      if (!Number.isSafeInteger(userId) || userId <= 0) return c.json({ error: "Non authentifié." }, 401);

      if (!rateLimit(`mai-refuse:${userId}`, 30, 60_000)) {
        return c.json({ error: "Trop de demandes de refus. Réessayez dans une minute." }, 429);
      }
      const body = await c.req.json().catch(() => ({} as any));
      const { name, conversation_id } = body || {};
      const toolName = typeof name === "string" ? name.trim() : "";
      if (!toolName || toolName.length > 100) return c.json({ error: "Nom d'outil requis." }, 400);
      let parsedArgs: { args: Record<string, any>; nonce: string | null };
      try {
        parsedArgs = extractApprovalNonce(body?.args, body?.nonce ?? body?.approval_nonce ?? body?.approvalNonce);
      } catch (err: any) {
        return c.json({ error: err?.message || "Arguments d'outil invalides." }, 400);
      }
      const { args, nonce } = parsedArgs;

      const sql = getDb();
      await ensureMAIConversations();
      const conv = await resolveOwnedConversation(sql, userId, conversation_id);
      if (conv.invalid) return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId = conv.id || await getOrCreateConversation(sql, userId);
      if (!conversationId) return c.json({ error: "Conversation indisponible." }, 500);

      const pending = await findPendingToolMessage(sql, conversationId, toolName, args, nonce);
      if (!nonce || !pending) {
        return c.json({ error: "Refus d'approbation invalide ou expiré." }, 403);
      }

      const reply = `🚫 Très bien, je n'exécute pas l'outil « ${toolName} ». Dites-moi si je peux faire autre chose pour vous.`;
      const record = makeToolCallRecord({ name: toolName, args, status: "rejected" });
      let savedId: string | null = null;
      if (conversationId) {
        const finalized = await finalizePendingToolMessage(
          sql,
          conversationId,
          toolName,
          { status: "rejected", reply },
          nonce,
          args
        );
        if (finalized.id) {
          savedId = finalized.id;
        } else {
          return c.json({ error: "Refus d'approbation déjà traité ou introuvable." }, 409);
        }
      }

      return c.json({
        success: true,
        reply,
        toolCalls: [record],
        conversation_id: conversationId || null,
        message_id: savedId,
      });
    } catch (err: any) {
      console.error("[Vibe API] mAI Tool Refused Error:", err);
      return c.json({ error: "Erreur lors du refus de l'outil." }, 500);
    }
  };
  registerMulti("post", ["/api/vibe/mai/tool-refused", "/vibe/mai/tool-refused", "/v1/mai/tool-refused"], handleMAIToolRefused);
}
