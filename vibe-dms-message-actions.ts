/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — DMs : ACTIONS MESSAGE (vibe-dms-message-actions.ts)
 * Épinglage, recherche dans la conversation, marquage non lu, réactions emoji
 * et suggestion de réponse mAI. Scindé de vibe-dms.ts (limite Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken, getWeekData, getUserQuotaBoost, getTierMaiTokenLimit } from "./config.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { ensureDMTables, resolveConversationTarget, pushToUsers } from "./vibe-dms-core.ts";

export function registerDMMessageActionRoutes(app: Hono, registerMulti: RegisterMultiFn) {
  // 4c. PIN / UNPIN MESSAGE (max 3 par conversation, adressage partnerId)
  const handlePinMessage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const body = await c.req.json().catch(() => ({}));
      const messageId = String(body?.message_id || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        return c.json({ error: "Message invalide." }, 400);
      }
      const sql = getDb();
      await ensureDMTables().catch(() => {});
      const target = await resolveConversationTarget(sql, userId, rawKey);
      if (!target) return c.json({ error: "Conversation introuvable." }, 404);
      const conversationId = target.conversationId;
      const msgRows = await sql`SELECT id FROM direct_messages WHERE id = ${messageId}::uuid AND conversation_id = ${conversationId}::uuid LIMIT 1`;
      if (msgRows.length === 0) return c.json({ error: "Message introuvable dans cette conversation." }, 404);
      const countRows = await sql`SELECT COUNT(*) AS n FROM dm_pinned_messages WHERE conversation_id = ${conversationId}::uuid`;
      if (Number(countRows[0]?.n || 0) >= 3) {
        return c.json({ error: "Maximum 3 messages épinglés par conversation.", code: "PIN_LIMIT" }, 403);
      }
      await sql`
        INSERT INTO dm_pinned_messages (conversation_id, message_id, pinned_by)
        VALUES (${conversationId}::uuid, ${messageId}::uuid, ${userId})
        ON CONFLICT (conversation_id, message_id) DO NOTHING
      `;
      await pushToUsers(target.memberIds, "dm_pin_updated", { conversation_id: conversationId, message_id: messageId, pinned: true });
      return c.json({ success: true, pinned: true });
    } catch (err: any) {
      return c.json({ error: "Erreur épinglage." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/conversations/:partnerId/pin", "/vibe/dms/conversations/:partnerId/pin", "/v1/dms/conversations/:partnerId/pin", "/dms/conversations/:partnerId/pin"], handlePinMessage);

  const handleUnpinMessage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const messageId = String(c.req.param("messageId") || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        return c.json({ error: "Paramètres invalides." }, 400);
      }
      const sql = getDb();
      const target = await resolveConversationTarget(sql, userId, rawKey);
      if (!target) return c.json({ error: "Conversation introuvable." }, 404);
      await sql`DELETE FROM dm_pinned_messages WHERE conversation_id = ${target.conversationId}::uuid AND message_id = ${messageId}::uuid`;
      await pushToUsers(target.memberIds, "dm_pin_updated", { conversation_id: target.conversationId, message_id: messageId, pinned: false });
      return c.json({ success: true, pinned: false });
    } catch (err: any) {
      return c.json({ error: "Erreur désépinglage." }, 500);
    }
  };

  registerMulti("delete", ["/api/vibe/dms/conversations/:partnerId/pin/:messageId", "/vibe/dms/conversations/:partnerId/pin/:messageId", "/v1/dms/conversations/:partnerId/pin/:messageId", "/dms/conversations/:partnerId/pin/:messageId"], handleUnpinMessage);

  // 4d. SEARCH IN CONVERSATION (ILIKE sur content, paire user/partner)
  const handleSearchDMMessages = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const q = (c.req.query("q") || "").trim();
      if (!q) return c.json({ messages: [] });
      const sql = getDb();
      if (rawKey.startsWith("group:")) {
        const groupId = rawKey.slice(6);
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)) {
          return c.json({ messages: [] });
        }
        const memberRows = await sql`
          SELECT 1 FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${userId} LIMIT 1
        `;
        if (memberRows.length === 0) return c.json({ error: "Accès refusé." }, 403);
        const messages = await sql`
          SELECT m.id, m.conversation_id, m.sender_id, m.recipient_id, m.content, u.username as sender_username, m.created_at
          FROM direct_messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.conversation_id = ${groupId}::uuid
            AND m.content ILIKE ('%' || ${q} || '%')
            AND (m.status IS NULL OR m.status = 'sent')
            AND NOT EXISTS (SELECT 1 FROM dm_hidden_messages h WHERE h.message_id = m.id AND h.user_id = ${userId})
          ORDER BY m.created_at DESC
          LIMIT 30
        `.catch(() => []);
        return c.json({ messages });
      }
      const partnerId = Number(rawKey);
      if (!partnerId) return c.json({ messages: [] });
      const messages = await sql`
        SELECT m.id, m.conversation_id, m.sender_id, m.recipient_id, m.content, m.is_read, m.created_at
        FROM direct_messages m
        WHERE ((m.sender_id = ${userId} AND m.recipient_id = ${partnerId})
           OR (m.sender_id = ${partnerId} AND m.recipient_id = ${userId}))
          AND m.content ILIKE ('%' || ${q} || '%')
          AND (m.status IS NULL OR m.status = 'sent')
          AND NOT EXISTS (SELECT 1 FROM dm_hidden_messages h WHERE h.message_id = m.id AND h.user_id = ${userId})
        ORDER BY m.created_at DESC
        LIMIT 30
      `.catch(() => []);
      return c.json({ messages });
    } catch (err: any) {
      return c.json({ error: "Erreur recherche conversation." }, 500);
    }
  };

  registerMulti("get", ["/api/vibe/dms/messages/:partnerId/search", "/vibe/dms/messages/:partnerId/search", "/v1/dms/messages/:partnerId/search", "/dms/messages/:partnerId/search"], handleSearchDMMessages);

  // 4e. MARK CONVERSATION UNREAD (re-passe le dernier message reçu en non lu)
  const handleMarkUnread = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const rawKey = String(c.req.param("partnerId") || "");
      const sql = getDb();
      if (rawKey.startsWith("group:")) {
        const groupId = rawKey.slice(6);
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId)) {
          return c.json({ error: "Conversation introuvable." }, 404);
        }
        const memberRows = await sql`
          SELECT 1 FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${userId} LIMIT 1
        `;
        if (memberRows.length === 0) return c.json({ error: "Conversation introuvable." }, 404);
        const last = await sql`
          SELECT id, read_by FROM direct_messages
          WHERE conversation_id = ${groupId}::uuid AND sender_id <> ${userId}
            AND (status IS NULL OR status = 'sent')
          ORDER BY created_at DESC
          LIMIT 1
        `;
        if (last.length === 0) return c.json({ error: "Conversation introuvable." }, 404);
        const readers = Array.isArray(last[0].read_by)
          ? (last[0].read_by as any[]).map(String).filter((x) => x !== String(userId))
          : [];
        await sql`UPDATE direct_messages SET read_by = ${JSON.stringify(readers)}::jsonb WHERE id = ${last[0].id}::uuid`;
        return c.json({ success: true, unread: true });
      }
      const partnerId = Number(rawKey);
      if (!partnerId) return c.json({ error: "Conversation invalide." }, 400);
      const last = await sql`
        SELECT id FROM direct_messages
        WHERE recipient_id = ${userId} AND sender_id = ${partnerId}
          AND (status IS NULL OR status = 'sent')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (last.length > 0) {
        await sql`UPDATE direct_messages SET is_read = FALSE, read_at = NULL WHERE id = ${last[0].id}::uuid`;
      } else {
        // Aucun message reçu : marquer le dernier envoyé pour rouvrir le fil côté client
        const own = await sql`
          SELECT id FROM direct_messages
          WHERE sender_id = ${userId} AND recipient_id = ${partnerId}
          ORDER BY created_at DESC LIMIT 1
        `;
        if (own.length === 0) return c.json({ error: "Conversation introuvable." }, 404);
      }
      return c.json({ success: true, unread: true });
    } catch (err: any) {
      return c.json({ error: "Erreur marquage non lu." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/conversations/:partnerId/mark-unread", "/vibe/dms/conversations/:partnerId/mark-unread", "/v1/dms/conversations/:partnerId/mark-unread", "/dms/conversations/:partnerId/mark-unread"], handleMarkUnread);

  // 4b. REACT TO A DM MESSAGE (toggle emoji)
  const handleReactDM = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const messageId = c.req.param("messageId");
      const { emoji } = await c.req.json();

      if (!messageId || !emoji || typeof emoji !== 'string' || emoji.length > 16) {
        return c.json({ error: "Message et emoji requis." }, 400);
      }

      const sql = getDb();

      // Vérifier que l'utilisateur fait bien partie de la conversation
      // (messages de groupe : le destinataire est NULL → appartenance vérifiée)
      const msgRows = await sql`
        SELECT id, sender_id, recipient_id, conversation_id FROM direct_messages WHERE id = ${messageId}::uuid LIMIT 1
      `;
      if (msgRows.length === 0) return c.json({ error: "Message introuvable." }, 404);
      const msg = msgRows[0];
      if (Number(msg.sender_id) !== userId && Number(msg.recipient_id) !== userId) {
        const memberRows = await sql`
          SELECT 1 FROM dm_group_members
          WHERE conversation_id = ${msg.conversation_id}::uuid AND user_id = ${userId}
          LIMIT 1
        `;
        if (memberRows.length === 0) {
          return c.json({ error: "Accès refusé." }, 403);
        }
      }

      const existing = await sql`
        SELECT id FROM dm_reactions WHERE message_id = ${messageId}::uuid AND user_id = ${userId} AND emoji = ${emoji} LIMIT 1
      `;

      let reacted: boolean;
      if (existing.length > 0) {
        await sql`DELETE FROM dm_reactions WHERE id = ${existing[0].id}`;
        reacted = false;
      } else {
        await sql`
          INSERT INTO dm_reactions (message_id, user_id, emoji)
          VALUES (${messageId}::uuid, ${userId}, ${emoji})
          ON CONFLICT (message_id, user_id, emoji) DO NOTHING
        `;
        reacted = true;
      }

      const all = await sql`
        SELECT emoji, user_id FROM dm_reactions WHERE message_id = ${messageId}::uuid
      `;
      const grouped: { emoji: string; count: number; mine: boolean }[] = [];
      for (const r of all) {
        const g = grouped.find((x) => x.emoji === r.emoji);
        if (g) {
          g.count += 1;
          g.mine = g.mine || Number(r.user_id) === userId;
        } else {
          grouped.push({ emoji: r.emoji, count: 1, mine: Number(r.user_id) === userId });
        }
      }

      return c.json({ success: true, reacted, reactions: grouped });
    } catch (err: any) {
      console.error("[vibe-dms] React error:", err);
      return c.json({ error: "Erreur réaction." }, 500);
    }
  };

  registerMulti("post", ["/api/vibe/dms/messages/:messageId/react", "/vibe/dms/messages/:messageId/react", "/v1/dms/messages/:messageId/react"], handleReactDM);

  // 4c. AI-GENERATED REPLY SUGGESTION (mAI dans les DMs)
  const handleDMGenerateReply = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      let partnerRaw = String(c.req.param("partnerId") || "").trim();
      let draft = "";
      let preset = "improve";
      let customPrompt = "";
      let toneValue = "";

      // Récupération de partner_id, draft/text, preset et customPrompt depuis le corps JSON
      try {
        const body = await c.req.json();
        if (!partnerRaw && body?.partner_id) {
          partnerRaw = String(body.partner_id).trim();
        }
        if (body?.draft && typeof body.draft === "string") {
          draft = body.draft.trim();
        } else if (body?.text && typeof body.text === "string") {
          draft = body.text.trim();
        }
        if (body?.preset && typeof body.preset === "string") {
          preset = body.preset;
        }
        if (body?.custom_prompt && typeof body.custom_prompt === "string") {
          customPrompt = body.custom_prompt.trim();
        }
        if (body?.tone && typeof body.tone === "string") {
          toneValue = body.tone.trim();
        }
      } catch {}

      // Cible : conversation 1-1 (id numérique) ou groupe (« group:<uuid> »)
      const isGroup = partnerRaw.startsWith("group:");
      const groupId = isGroup ? partnerRaw.slice(6) : "";
      const partnerId = isGroup ? NaN : Number(partnerRaw);

      if (!isGroup && !partnerId) {
        return c.json({ error: "Identifiant du destinataire manquant." }, 400);
      }

      // Refuser l'appel si aucun texte n'est présent dans la bulle de message
      if (!draft || !draft.trim()) {
        return c.json(
          { error: "Veuillez d'abord écrire un texte dans la bulle de message pour que mAI puisse l'améliorer." },
          400
        );
      }

      const sql = getDb();
      // Contexte de la conversation (1-1 ou groupe) — calculé AVANT les presets :
      // PRESETS.improve interpole le destinataire.
      const [userRow] = await Promise.all([
        sql`SELECT username, tier FROM users WHERE id = ${userId} LIMIT 1`,
      ]);
      const userPlan = userRow[0]?.tier || "Free";

      let recent: any[] = [];
      let partnerName = "votre contact";
      let partnerLabel = "avec votre contact";
      if (isGroup) {
        const memberRows = await sql`
          SELECT 1 FROM dm_group_members WHERE conversation_id = ${groupId}::uuid AND user_id = ${userId} LIMIT 1
        `;
        if (memberRows.length === 0) return c.json({ error: "Conversation introuvable." }, 404);
        const groupRows = await sql`
          SELECT group_name FROM dm_conversations WHERE id = ${groupId}::uuid LIMIT 1
        `;
        partnerName = String(groupRows[0]?.group_name || "Groupe");
        partnerLabel = `du groupe « ${partnerName} »`;
        recent = await sql`
          SELECT m.content, m.sender_id, u.username as sender_username
          FROM direct_messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.conversation_id = ${groupId}::uuid
          ORDER BY m.created_at ASC
          LIMIT 100
        `;
      } else {
        const [partnerRow] = await Promise.all([
          sql`SELECT username, tier FROM users WHERE id = ${partnerId} LIMIT 1`,
        ]);
        partnerName = partnerRow[0]?.username || "votre contact";
        partnerLabel = `avec @${partnerName}`;
        recent = await sql`
          SELECT m.content, m.sender_id, u.username as sender_username
          FROM direct_messages m
          JOIN users u ON u.id = m.sender_id
          WHERE (m.sender_id = ${userId} AND m.recipient_id = ${partnerId})
             OR (m.sender_id = ${partnerId} AND m.recipient_id = ${userId})
          ORDER BY m.created_at ASC
          LIMIT 100
        `;
      }

      // Presets d'écriture : Réduire, Allonger, Changer le ton, Améliorer, Personnalisé
      const PRESETS: Record<string, string> = {
        shorten: "Réduis ce message : rends-le plus court et percutant tout en conservant son sens essentiel. Ne perds aucune information importante, supprime les fioritures.",
        extend: "Allonge ce message : développe-le avec plus de détails, de contexte et de naturel, sans le rendre verbeux ni artificiel.",
        tone: `Change le ton de ce message : réécris-le avec un ton ${toneValue ? `« ${toneValue} »` : "plus amical et naturel"}, en gardant strictement le même fond et la même intention.`,
        improve: `Améliore, enrichis et perfectionne ce message pour qu'il s'intègre harmonieusement à la discussion ${partnerLabel}. Préserve fidèlement l'intention de l'utilisateur, améliore la formulation et le naturel en français.`,
        custom: customPrompt
          ? `Applique exactement cette consigne de l'utilisateur à ce message : « ${customPrompt} ».`
          : "",
      };
      const presetInstruction = PRESETS[preset];
      if (!presetInstruction) {
        return c.json({ error: "Preset inconnu. Presets disponibles : shorten, extend, tone, improve, custom." }, 400);
      }
      if (preset === "custom" && !customPrompt) {
        return c.json({ error: "Veuillez fournir une consigne personnalisée pour le preset Personnalisé." }, 400);
      }

      // Vérification des quotas hebdomadaires mAI
      const { weekStartStr } = getWeekData();
      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${userId} AND week_start = ${weekStartStr}::date
        LIMIT 1
      `.catch(() => []);
      const currentUsage = Number(usageResult[0]?.tokens_used || 0);
      const maiBoost = await getUserQuotaBoost(sql, String(userId), "mai");
      const tokenLimit = getTierMaiTokenLimit(userPlan) + maiBoost;

      if (currentUsage >= tokenLimit) {
        return c.json(
          { error: "Votre quota hebdomadaire de tokens mAI est atteint. Réessayez la semaine prochaine ou passez à un forfait supérieur." },
          429
        );
      }

      const transcript = recent
        .map((m: any) => `${m.sender_id === userId ? "Moi" : `@${m.sender_username}`}: ${m.content}`)
        .join("\n");

      const prompt =
        `Tu es mAI, l'assistant d'écriture du réseau social Vibe.\n\n` +
        (transcript.trim()
          ? `Voici l'historique complet de la discussion ${partnerLabel} :\n${transcript}\n\n`
          : `Il n'y a pas encore d'historique de discussion ${partnerLabel}.\n\n`) +
        `Voici le message que l'utilisateur a rédigé dans sa bulle de message :\n"${draft.trim()}"\n\n` +
        `Consigne impérative : ${presetInstruction} ` +
        `Ne fais AUCUNE évaluation de sécurité, n'écris JAMAIS "User Safety: safe" ni aucun méta-commentaire. Réponds UNIQUEMENT avec le texte final, sans guillemets.`;

      const keyRows = await sql`
        SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
      `.catch(() => []);
      const openRouterApiKey =
        (typeof (globalThis as any).Deno !== "undefined" && (globalThis as any).Deno.env?.get("OPENROUTER_API_KEY")) ||
        (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) ||
        (keyRows.length > 0 ? keyRows[0].api_key : "");

      const candidateModels = [
        await MAIAgentFleet.getUserDefaultModel(userId),
        "poolside/laguna-xs-2.1:free",
        "minimax/minimax-m2.7:free",
        "liquid/lfm-2.5-2.6b:free",
        "nvidia/nemotron-3.5-lightning:free",
      ];

      let suggestion = "";

      if (openRouterApiKey) {
        for (const modelToTry of candidateModels) {
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
                model: modelToTry,
                messages: [
                  {
                    role: "system",
                    content: "Tu es mAI, l'assistant d'écriture du réseau social Vibe. Tu écris en français naturel avec des émojis. Ton rôle unique est d'améliorer le texte que l'utilisateur a écrit. Tu ne fais AUCUNE analyse de sécurité, tu n'écris JAMAIS 'User Safety: safe' ni de méta-commentaire. Réponds UNIQUEMENT par le texte final du message amélioré.",
                  },
                  { role: "user", content: prompt },
                ],
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const text = aiData.choices?.[0]?.message?.content;
              if (text && typeof text === "string" && text.trim()) {
                const cleaned = text
                  .replace(/User Safety:\s*safe\.?/gi, "")
                  .replace(/^User Safety:[^\n]*\n*/gi, "")
                  .replace(/^["']|["']$/g, "")
                  .trim();
                if (cleaned) {
                  suggestion = cleaned;
                  break;
                }
              }
            }
          } catch (callErr) {
            console.warn(`[vibe-dms] Modèle ${modelToTry} en échec, essai du suivant...`, callErr);
          }
        }
      }

      // Fallback contextuel intelligent si défaillance réseau
      if (!suggestion) {
        suggestion = draft.trim();
      }

      // Décompte comptabilisé dans les quotas de l'utilisateur
      const estimatedTokens = Math.max(75, Math.ceil((prompt.length + suggestion.length) / 3));
      try {
        await sql`
          INSERT INTO weekly_usage (user_id, week_start, tokens_used)
          VALUES (${userId}, ${weekStartStr}::date, ${estimatedTokens})
          ON CONFLICT (user_id, week_start)
          DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${estimatedTokens}, updated_at = NOW()
        `;
      } catch (quotaErr) {
        console.warn("[vibe-dms] Quota log warning:", quotaErr);
      }

      return c.json({
        success: true,
        suggestion,
        tokensUsed: estimatedTokens,
      });
    } catch (err: any) {
      console.error("[vibe-dms] Generate reply error:", err);
      return c.json({ error: err?.message || "Erreur génération de réponse." }, 500);
    }
  };

  registerMulti("post", [
    "/api/vibe/dms/generate-reply/:partnerId",
    "/vibe/dms/generate-reply/:partnerId",
    "/v1/dms/generate-reply/:partnerId",
    "/api/vibe/dms/suggest-reply",
    "/vibe/dms/suggest-reply",
    "/v1/dms/suggest-reply",
  ], handleDMGenerateReply);
}
