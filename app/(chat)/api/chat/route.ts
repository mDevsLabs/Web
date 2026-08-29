import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { DEFAULT_CHAT_MODEL, getModelCapabilities } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { audioGenerate } from "@/lib/ai/tools/audio-generate";
import { calculator } from "@/lib/ai/tools/calculator";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { createDocument } from "@/lib/ai/tools/create-document";
import { dateTime } from "@/lib/ai/tools/datetime";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { imageGenerate } from "@/lib/ai/tools/image-generate";
import { note } from "@/lib/ai/tools/note";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { webSearch } from "@/lib/ai/tools/web-search";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { isProductionEnvironment, MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMcpServersByUserId,
  getMessagesByChatId,
  getSkillById,
  recordTokenUsage,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { createMcpChatTools } from "@/lib/mcp/chat-tools";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import {
  convertToUIMessages,
  generateUUID,
  getTextFromMessage,
} from "@/lib/utils";
import { generateTitleFromConversation } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function isModelStreamActivity(chunk: { type: string }) {
  return !["start", "start-step", "finish-step", "finish", "raw"].includes(
    chunk.type
  );
}

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      messages,

      selectedChatMode,
      selectedVisibilityType,
      projectId,
      skillId,
      tags,
      customInstructions,
      temperatureOverride,
      enabledTools,
      isGhostMode = false,
    } = requestBody as PostRequestBody & {
      projectId?: string | null;
      skillId?: string | null;
      tags?: string[];
      customInstructions?: string;
      temperatureOverride?: number | null;
      enabledTools?: string[];
      isGhostMode?: boolean;
    };

    const [botIdResult, sessionToken, maiUser] = await Promise.all([
      checkBotId().catch(() => null),
      getMaiSessionToken(),
      getMaiUser(),
    ]);

    if (botIdResult?.isBot) {
      return new ChatbotError("forbidden:api").toResponse();
    }

    if (!sessionToken || !maiUser) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    // 1. Vérification du quota hebdomadaire
    const userId = maiUser.id || maiUser.email;

    if (maiUser.tokensUsed >= maiUser.limit) {
      return new Response(
        JSON.stringify({
          error:
            "Votre limite hebdomadaire de tokens est atteinte. Veuillez mettre à niveau votre forfait sur https://mai-devs.vercel.app pour continuer.",
          limit: maiUser.limit,
          over_limit: true,
          used: maiUser.tokensUsed,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    await checkIpRateLimit(ipAddress(request), userId);

    const chat = await getChatById({ id });
    const effectiveProjectId = (chat as any)?.projectId || projectId;
    let projectCustomInstructions: string | null = null;
    let projectDefaultModel: string | null = null;

    if (effectiveProjectId) {
      try {
        const { getProjectById } = await import("@/lib/db/queries");
        const proj = await getProjectById({
          id: effectiveProjectId,
          userEmail: maiUser.email,
          userId,
        });
        if (proj?.customInstructions) {
          projectCustomInstructions = proj.customInstructions;
        }
        if (proj?.defaultModel) {
          projectDefaultModel = proj.defaultModel;
        }
      } catch {}
    }

    const effectiveSkillId = (chat as any)?.skillId || skillId;
    let skillInstructions: string | null = null;
    let skillTools: string[] = [];

    if (effectiveSkillId) {
      try {
        const activeSkill = await getSkillById({
          id: effectiveSkillId,
          userId,
        });
        if (activeSkill) {
          skillInstructions = activeSkill.instructions;
          if (Array.isArray(activeSkill.tools)) {
            skillTools = activeSkill.tools as string[];
          }
        }
      } catch {}
    }

    // Agent remplace Mode IA — agentId envoyé par use-active-chat (cookie + DB)
    const bodyAny = requestBody as any;
    const agentIdFromBody: string | null =
      bodyAny.agentId ?? bodyAny.selectedAgentId ?? null;
    const chatModelFromAgent: string | null = bodyAny.selectedChatModel || null;
    // Si un agent est actif, son modèle par défaut prime (global cookie déjà mis à jour côté client)
    let agentInstructions: string | null = null;
    let agentDefaultModel: string | null = null;
    let agentSkillIds: string[] = [];
    let _agentMcpIds: string[] = [];
    let agentTemperature: number | null = null;
    let agentTopP: number | null = null;
    let agentMaxTokens: number | null = null;
    const effectiveAgentId = (chat as any)?.agentId || agentIdFromBody || null;
    if (effectiveAgentId) {
      try {
        const { getAgentById } = await import("@/lib/db/queries");
        const ag = await getAgentById({ id: effectiveAgentId, userId });
        if (ag) {
          agentInstructions = ag.instructions || null;
          agentDefaultModel = ag.defaultModelId || null;
          agentTemperature = (ag as any).temperature ?? null;
          agentTopP = (ag as any).topP ?? null;
          agentMaxTokens = (ag as any).maxTokens ?? null;
          if (Array.isArray(ag.skillIds)) {
            agentSkillIds = ag.skillIds as string[];
          }
          if (Array.isArray(ag.mcpServerIds)) {
            _agentMcpIds = ag.mcpServerIds as string[];
          }
        }
      } catch {}
    }
    const chatModel =
      chatModelFromAgent ||
      agentDefaultModel ||
      projectDefaultModel ||
      DEFAULT_CHAT_MODEL;
    const isToolApprovalFlow = Boolean(messages);

    // Règle: bloquer l'envoi de fichiers si le modèle ne supporte pas vision/file
    if (message?.parts) {
      const hasFilePart = message.parts.some((p: any) => p.type === "file");
      if (hasFilePart) {
        const caps = getModelCapabilities(chatModel);
        if (!caps.vision) {
          return new ChatbotError(
            "bad_request:api",
            "Ce modèle ne prend pas en charge les fichiers/images. Changez de modèle ou retirez les pièces jointes."
          ).toResponse();
        }
      }
    }

    // Récupérer la clé API Neon du compte
    const userApiKey = maiUser.id ? await getUserApiKey(maiUser.id) : null;

    let messagesFromDb: DBMessage[] = [];
    let shouldRenameAfterFirst = false;
    let firstUserMessageForTitle: typeof message | null = null;

    if (chat) {
      if (chat.userId !== userId && chat.userId !== maiUser.email) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
      // Renommer seulement si c'est la première interaction (pas de messages en DB)
      if (
        !isGhostMode &&
        messagesFromDb.length === 0 &&
        message?.role === "user" &&
        chat.title === "Nouvelle discussion"
      ) {
        shouldRenameAfterFirst = true;
        firstUserMessageForTitle = message;
      }
    } else if (message?.role === "user" && !isGhostMode) {
      if (projectId) {
        const { getProjectById } = await import("@/lib/db/queries");
        const proj = await getProjectById({ id: projectId, userId });
        if (!proj) {
          return new ChatbotError(
            "not_found:database",
            "Projet introuvable"
          ).toResponse();
        }
      }
      await saveChat({
        agentId: effectiveAgentId ?? null,
        customInstructions: customInstructions ?? null,
        id,
        modeId: selectedChatMode ?? undefined,
        projectId: projectId ?? null,
        skillId: effectiveSkillId ?? null,
        tags: tags ?? [],
        temperatureOverride: temperatureOverride ?? null,
        title: "Nouvelle discussion",
        userId,
        visibility: selectedVisibilityType,
      });
      shouldRenameAfterFirst = true;
      firstUserMessageForTitle = message;
    } else if (chat && projectId !== undefined && !isGhostMode) {
      // Update project association on existing chat if explicitly passed
      const { updateChatProjectById } = await import("@/lib/db/queries");
      try {
        await updateChatProjectById({
          chatId: id,
          projectId: projectId ?? null,
          userId,
        });
      } catch {}
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      city,
      country,
      latitude,
      longitude,
    };

    if (message?.role === "user" && !isGhostMode) {
      await saveMessages({
        messages: [
          {
            attachments: [],
            chatId: id,
            createdAt: new Date(),
            id: message.id,
            parts: message.parts,
            role: "user",
          },
        ],
      });
    }

    const modelMessages = await convertToModelMessages(uiMessages);

    // Récupérer custom instructions utilisateur + chat
    let userCustomInstructions: string | null = null;
    let userCustomEnabled = false;
    let userDefaultTemp: number | null = null;
    let userDefaultTopP: number | null = null;
    try {
      const postgres = (await import("postgres")).default;
      const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (url) {
        const sql = postgres(url, { prepare: false });
        const rows =
          await sql`SELECT custom_instructions, custom_instructions_enabled, default_temperature, default_top_p FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`;
        if (rows.length > 0) {
          userCustomInstructions = rows[0].custom_instructions || null;
          userCustomEnabled = !!rows[0].custom_instructions_enabled;
          userDefaultTemp = rows[0].default_temperature ?? null;
          userDefaultTopP = rows[0].default_top_p ?? null;
        }
        await sql.end();
      }
    } catch {}

    // Chat-level overrides (persisted in Chat table)
    const chatCustomInstructions =
      (chat as any)?.customInstructions ?? customInstructions ?? null;
    const chatTempOverride =
      (chat as any)?.temperatureOverride ?? temperatureOverride ?? null;

    // Construire le prompt addendum effectif (Agent remplace Mode IA)
    let effectiveAddendum = "";
    if (agentInstructions) {
      effectiveAddendum = `AGENT ACTIF — Instructions prioritaires de l'agent :\n${agentInstructions}`;
    }
    if (userCustomEnabled && userCustomInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nInstructions personnalisées de l'utilisateur (à respecter en priorité):\n${userCustomInstructions}`;
    }
    if (projectCustomInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nContexte et instructions du dossier/projet :\n${projectCustomInstructions}`;
    }
    if (chatCustomInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nInstructions spécifiques à cette discussion:\n${chatCustomInstructions}`;
    }
    if (skillInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nCOMPETENCE / SKILL ACTIF POUR CETTE DISCUSSION :\n${skillInstructions}`;
    }
    // Skills/MCP embarqués dans l'agent (fusion avec skill actif + one-shot)
    if (agentSkillIds.length > 0 && !skillInstructions) {
      // Si agent a des skills mais pas de skill actif, on concatène leurs instructions (optionnel lazy)
    }
    if (isGhostMode) {
      effectiveAddendum += `\n\nMODE FANTÔME ACTIF : Cette discussion est éphémère et confidentielle (non enregistrée). L'outil de génération d'image est strictement indisponible dans ce mode.`;
    }
    // One-shot tools + outils issus du skill actif
    const combinedEnabledTools = Array.from(
      new Set([
        ...(Array.isArray(enabledTools) ? enabledTools : []),
        ...skillTools,
      ])
    );
    const requestedTools: string[] = combinedEnabledTools.filter(
      (t) => !isGhostMode || (t !== "imageGenerate" && t !== "audioGenerate")
    );
    if (requestedTools.length > 0) {
      const toolLabels: Record<string, string> = {
        audioGenerate:
          "audioGenerate (synthèse vocale - exécuter immédiatement avec la voix par défaut 'flux-alexis-en' sans demander à l'utilisateur de choisir la voix)",
        calculator:
          "calculator (calculs mathématiques, fonctions trigonométriques, logarithmes, conversions d'unités : longueur, masse, température, temps, volume, données, énergie, pression, vitesse, surface, angle)",
        codeExecution: "codeExecution (exécution Python/JS navigateur)",
        createDocument: "createDocument (créer artifact)",
        dateTime:
          "dateTime (date/heure actuelle, conversions entre fuseaux horaires, différences entre dates, calcul de la date de Pâques, formatage)",
        editDocument: "editDocument (éditer artifact)",
        getWeather:
          "getWeather (météo actuelle et prévisions 1-7 jours, celsius/fahrenheit)",
        imageGenerate: "imageGenerate (génération d'image)",
        note: "note (créer une note formatée et téléchargeable en markdown, texte, JSON, CSV, HTML, ou code)",
        requestSuggestions: "requestSuggestions (suggestions)",
        updateDocument: "updateDocument (réécrire artifact)",
        webSearch: "webSearch (recherche sur le Web en temps réel)",
      };
      const listed = requestedTools.map((t) => toolLabels[t] || t).join(", ");
      effectiveAddendum += `\n\nOUTILS ACTIVÉS POUR CE MESSAGE — UTILISATION EXTRÊMEMENT RECOMMANDÉE SI PERTINENT : ${listed}. Tu DOIS les utiliser dès que la demande s'y prête, ne les ignore pas. Si plusieurs outils sont activés, choisis le plus pertinent. Pour l'audio, ne demande JAMAIS de choix de voix, génère directement avec la voix par défaut.`;
    }

    // Température effective: chat override > agent > user default (plus de mode)
    const effectiveTemperature =
      chatTempOverride ?? agentTemperature ?? userDefaultTemp ?? undefined;
    const effectiveTopP = agentTopP ?? userDefaultTopP ?? undefined;
    const effectiveMaxTokens = agentMaxTokens ?? undefined;

    // Initialiser le modèle de langage mAI
    const model = getLanguageModel(chatModel, {
      apiKey: userApiKey,
      sessionToken,
      userId: maiUser.id,
    });

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        let hasModelActivity = false;

        const markModelActive = () => {
          if (hasModelActivity) {
            return;
          }
          hasModelActivity = true;
          dataStream.write({
            data: {
              message: "Génération en cours...",
              modelId: chatModel,
              modelName: chatModel,
              phase: "thinking",
            },
            transient: true,
            type: "data-waiting-status",
          });
        };

        // Charger les serveurs MCP de l'utilisateur et auto-découvrir les outils si toolsCache est vide
        const userMcpServers = await getMcpServersByUserId({ userId }).catch(
          () => []
        );

        // Auto-découverte à chaud si un serveur activé n'a pas encore son toolsCache
        for (const server of userMcpServers) {
          if (
            server.isEnabled &&
            (!server.toolsCache || (server.toolsCache as any[]).length === 0)
          ) {
            try {
              const { fetchMcpTools } = await import("@/lib/mcp/client");
              const discoveredTools = await fetchMcpTools(server as any);
              if (discoveredTools && discoveredTools.length > 0) {
                server.toolsCache = discoveredTools as any;
                const { updateMcpServerSync } = await import("@/lib/db/queries");
                await updateMcpServerSync({
                  id: server.id,
                  success: true,
                  toolsCache: discoveredTools,
                  userId,
                }).catch(() => {});
              }
            } catch (syncErr) {
              console.error(
                `Auto-découverte outils MCP échouée pour ${server.name}:`,
                syncErr
              );
            }
          }
        }

        const mcpTools = createMcpChatTools({
          chatId: id,
          servers: userMcpServers,
          userId,
        });
        const mcpToolKeys = Object.keys(mcpTools);

        // Outils activés (demande directe + skill actif + MCP)
        const combinedRequestedTools = Array.from(
          new Set([
            ...(Array.isArray(enabledTools) ? enabledTools : []),
            ...skillTools,
          ])
        );
        const requestedTools2: string[] = combinedRequestedTools.filter(
          (t) =>
            !isGhostMode || (t !== "imageGenerate" && t !== "audioGenerate")
        );

        const hasMcpEnabled = requestedTools2.some(
          (t) => t === "mcp" || t.startsWith("mcp_") || t.startsWith("mcp:")
        );
        const activeToolsList: string[] = [
          ...requestedTools2.filter(
            (t) => !t.startsWith("mcp_") && t !== "mcp" && !t.startsWith("mcp:")
          ),
          ...(hasMcpEnabled
            ? mcpToolKeys
            : requestedTools2.filter((t) => mcpToolKeys.includes(t))),
        ];
        const supportsTools = activeToolsList.length > 0;

        // Consigne explicite pour le modèle lorsque des outils MCP sont actifs
        let finalEffectiveAddendum = effectiveAddendum;
        if (hasMcpEnabled && mcpToolKeys.length > 0) {
          const activeServerNames = userMcpServers
            .filter((s) => s.isEnabled)
            .map((s) => s.name)
            .join(", ");
          finalEffectiveAddendum = `${finalEffectiveAddendum ? `${finalEffectiveAddendum}\n\n` : ""}Tu as accès à des outils externes connectés via le protocole MCP (${activeServerNames}). Outils MCP disponibles: ${mcpToolKeys.join(", ")}. Lorsque l'utilisateur demande une action ou une recherche (par exemple lister des commits, dépôts, pull requests GitHub, fichiers, etc.), tu DOIS appeler directement les outils MCP correspondants et ne JAMAIS affirmer que tu n'as pas accès à Git ou aux outils MCP.`;
        }

        const result = streamText({
          activeTools: supportsTools ? (activeToolsList as any) : undefined,
          instructions: systemPrompt({
            modeAddendum: finalEffectiveAddendum,
            requestHints,
            supportsTools,
          }),
          messages: modelMessages,
          model,
          ...(effectiveTemperature !== undefined &&
          effectiveTemperature !== null
            ? { temperature: effectiveTemperature }
            : {}),
          ...(effectiveTopP !== undefined && effectiveTopP !== null
            ? { topP: effectiveTopP }
            : {}),
          ...(effectiveMaxTokens !== undefined && effectiveMaxTokens !== null
            ? { maxOutputTokens: effectiveMaxTokens }
            : {}),
          onChunk({ chunk }) {
            if (isModelStreamActivity(chunk)) {
              markModelActive();
            }
          },
          onFinish: async ({ usage }) => {
            // Décompte précis des tokens (entrée + sortie additionnés)
            const inputTokens =
              (usage as any)?.inputTokens ?? (usage as any)?.promptTokens ?? 0;
            const outputTokens =
              (usage as any)?.outputTokens ??
              (usage as any)?.completionTokens ??
              0;
            const totalTokens =
              (usage as any)?.totalTokens ?? inputTokens + outputTokens;

            if (totalTokens > 0) {
              // 1. Enregistrement direct et persistant en BDD (normal et fantôme)
              await recordTokenUsage({
                inputTokens,
                isGhostMode,
                model: chatModel,
                outputTokens,
                totalTokens,
                userEmail: maiUser.email,
                userId,
              });

              // 2. Notification de l'endpoint API mAI log-usage
              try {
                const logRes = await fetch(`${MAI_API_URL}/log-usage`, {
                  body: JSON.stringify({
                    inputTokens,
                    isGhostMode,
                    model: chatModel,
                    outputTokens,
                    tokensUsed: totalTokens,
                  }),
                  headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                });

                if (!logRes.ok) {
                  const errText = await logRes.text();
                  console.error(
                    "[API log-usage] Status:",
                    logRes.status,
                    "Response:",
                    errText
                  );
                }
              } catch (logErr) {
                console.error("Erreur décompte log-usage:", logErr);
              }

              // 3. Diffusion en direct au client via le flux
              try {
                dataStream.write({
                  data: {
                    inputTokens,
                    outputTokens,
                    tokens: totalTokens,
                    total: totalTokens,
                  } as any,
                  transient: true,
                  type: "data-usage" as any,
                });
              } catch {}
            }
          },
          stopWhen: isStepCount(5),
          telemetry: {
            functionId: "stream-text",
            isEnabled: isProductionEnvironment,
          },
          tools: {
            audioGenerate: audioGenerate({
              dataStream,
              session: {
                token: sessionToken,
                user: isGhostMode
                  ? null
                  : { email: maiUser.email, id: userId, token: sessionToken },
              } as any,
            }),
            calculator,
            codeExecution,
            createDocument: createDocument({
              dataStream,
              modelId: chatModel,
              session: {
                user: isGhostMode ? null : { email: maiUser.email, id: userId },
              } as any,
            }),
            dateTime,
            editDocument: editDocument({
              dataStream,
              session: {
                user: isGhostMode ? null : { email: maiUser.email, id: userId },
              } as any,
            }),
            getWeather,
            ...(isGhostMode
              ? {}
              : {
                  imageGenerate: imageGenerate({
                    dataStream,
                    session: {
                      token: sessionToken,
                      user: {
                        email: maiUser.email,
                        id: userId,
                        token: sessionToken,
                      },
                    } as any,
                  }),
                }),
            note: note({
              dataStream,
              session: {
                user: isGhostMode ? null : { email: maiUser.email, id: userId },
              } as any,
            }),
            requestSuggestions: requestSuggestions({
              dataStream,
              modelId: chatModel,
              session: {
                user: isGhostMode ? null : { email: maiUser.email, id: userId },
              } as any,
            }),
            updateDocument: updateDocument({
              dataStream,
              modelId: chatModel,
              session: {
                user: isGhostMode ? null : { email: maiUser.email, id: userId },
              } as any,
            }),
            webSearch,
            ...mcpTools,
          },
        });

        dataStream.merge(
          toUIMessageStream({
            sendReasoning: true,
            stream: result.stream,
          })
        );
      },
      generateId: generateUUID,
      onEnd: async ({ messages: finishedMessages }) => {
        if (isGhostMode) {
          // Mode fantôme : ne pas enregistrer la discussion ou les messages en BDD
          return;
        }
        // Notification IA : à chaque fin de génération (si activé)
        try {
          const { createNotification } = await import("@/lib/db/queries");
          const snippet = (() => {
            const last = [...finishedMessages]
              .reverse()
              .find((m) => m.role === "assistant");
            if (!last) {
              return "mAI a répondu à votre message.";
            }
            const txt = getTextFromMessage(last as any) || "";
            return txt.slice(0, 180) || "mAI a répondu à votre message.";
          })();
          // fire-and-forget, gating inside createNotification respects prefs
          createNotification({
            body: snippet,
            link: `/chat/${id}`,
            title: "Nouvelle réponse de mAI",
            type: "ai_response",
            userId,
          }).catch(() => {});
          // Browser push via service? handled client side via polling + Notification API
        } catch {}

        if (isToolApprovalFlow) {
          await Promise.all(
            finishedMessages.map(async (finishedMsg) => {
              const existingMsg = uiMessages.find(
                (m) => m.id === finishedMsg.id
              );
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                });
                return;
              }

              await saveMessages({
                messages: [
                  {
                    attachments: [],
                    chatId: id,
                    createdAt: new Date(),
                    id: finishedMsg.id,
                    parts: finishedMsg.parts,
                    role: finishedMsg.role,
                  },
                ],
              });
            })
          );
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              attachments: [],
              chatId: id,
              createdAt: new Date(),
              id: currentMessage.id,
              parts: currentMessage.parts,
              role: currentMessage.role,
            })),
          });

          // Renommage auto après fin du stream IA (premier message uniquement)
          if (shouldRenameAfterFirst && firstUserMessageForTitle) {
            try {
              const assistantMsg = [...finishedMessages]
                .reverse()
                .find((m) => m.role === "assistant");
              const assistantText = assistantMsg
                ? (getTextFromMessage(assistantMsg as any) || "")
                    .slice(0, 500)
                    .trim()
                : "";
              const userText = getTextFromMessage(
                firstUserMessageForTitle as any
              );
              const title = await generateTitleFromConversation({
                assistantText,
                userText,
              });
              if (title && title !== "Nouvelle discussion") {
                await updateChatTitleById({ chatId: id, title });
              }
            } catch (e) {
              console.error("Erreur renommage auto:", e);
            }
          }
        }
      },
      onError: (error) => {
        console.error("Erreur Stream AI:", error);
        return "Une erreur est survenue lors de la génération de la réponse.";
      },
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    });

    return createUIMessageStreamResponse({
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL || isGhostMode) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ chatId: id, streamId });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch {
          /* non-critical */
        }
      },
      stream,
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("Unhandled error in chat API:", error);
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const maiUser = await getMaiUser();
  if (!maiUser) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });
  const userId = maiUser.id || maiUser.email;

  if (chat?.userId !== userId && chat?.userId !== maiUser.email) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
