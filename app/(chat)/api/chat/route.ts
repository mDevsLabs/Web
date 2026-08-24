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
import { AI_MODES, DEFAULT_AI_MODE, getAIMode } from "@/lib/ai/modes";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { imageGenerate } from "@/lib/ai/tools/image-generate";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { isProductionEnvironment, MAI_API_URL } from "@/lib/constants";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
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
      selectedChatModel,
      selectedChatMode,
      selectedVisibilityType,
      projectId,
      tags,
      customInstructions,
      temperatureOverride,
      enabledTools,
    } = requestBody as PostRequestBody & {
      projectId?: string | null;
      tags?: string[];
      customInstructions?: string;
      temperatureOverride?: number | null;
      enabledTools?: string[];
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

    const chatModel = selectedChatModel || DEFAULT_CHAT_MODEL;
    const chatModeId =
      selectedChatMode && AI_MODES[selectedChatMode as keyof typeof AI_MODES]
        ? selectedChatMode
        : DEFAULT_AI_MODE;
    const chatMode = getAIMode(chatModeId);
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

    const chat = await getChatById({ id });
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
        messagesFromDb.length === 0 &&
        message?.role === "user" &&
        chat.title === "Nouvelle discussion"
      ) {
        shouldRenameAfterFirst = true;
        firstUserMessageForTitle = message;
      }
    } else if (message?.role === "user") {
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
        customInstructions: customInstructions ?? null,
        id,
        modeId: chatModeId,
        projectId: projectId ?? null,
        tags: tags ?? [],
        temperatureOverride: temperatureOverride ?? null,
        title: "Nouvelle discussion",
        userId,
        visibility: selectedVisibilityType,
      });
      shouldRenameAfterFirst = true;
      firstUserMessageForTitle = message;
    } else if (chat && projectId !== undefined) {
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

    if (message?.role === "user") {
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
    const chatModeOverride = (chat as any)?.modeId ?? chatModeId;
    const chatTempOverride =
      (chat as any)?.temperatureOverride ?? temperatureOverride ?? null;

    // Instructions du projet associé
    let projectCustomInstructions: string | null = null;
    const effectiveProjectId = (chat as any)?.projectId || projectId;
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
      } catch {}
    }

    // Construire le prompt addendum effectif
    const effectiveMode = getAIMode(chatModeOverride);
    let effectiveAddendum = effectiveMode.systemPromptAddendum || "";
    if (userCustomEnabled && userCustomInstructions) {
      effectiveAddendum = `Instructions personnalisées de l'utilisateur (à respecter en priorité):\n${userCustomInstructions}\n\n${effectiveAddendum}`;
    }
    if (projectCustomInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nContexte et instructions du dossier/projet :\n${projectCustomInstructions}`;
    }
    if (chatCustomInstructions) {
      effectiveAddendum = `${effectiveAddendum}\n\nInstructions spécifiques à cette discussion:\n${chatCustomInstructions}`;
    }
    // One-shot tools: if enabledTools provided, inject extremely recommended directive
    const requestedTools: string[] = Array.isArray(enabledTools)
      ? enabledTools
      : [];
    if (requestedTools.length > 0) {
      const toolLabels: Record<string, string> = {
        codeExecution: "codeExecution (exécution Python/JS navigateur)",
        createDocument: "createDocument (créer artifact)",
        editDocument: "editDocument (éditer artifact)",
        getWeather: "getWeather (météo)",
        imageGenerate: "imageGenerate (génération d'image)",
        requestSuggestions: "requestSuggestions (suggestions)",
        updateDocument: "updateDocument (réécrire artifact)",
      };
      const listed = requestedTools.map((t) => toolLabels[t] || t).join(", ");
      effectiveAddendum += `\n\n⚠️ OUTILS ACTIVÉS POUR CE MESSAGE — UTILISATION EXTRÊMEMENT RECOMMANDÉE SI PERTINENT : ${listed}. Tu DOIS les utiliser dès que la demande s'y prête, ne les ignore pas. Si plusieurs outils sont activés, choisis le plus pertinent.`;
    }

    // Température effective: chat override > user default > mode default
    const effectiveTemperature =
      chatTempOverride ?? userDefaultTemp ?? effectiveMode.temperature;
    const effectiveTopP = userDefaultTopP ?? effectiveMode.topP;

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

        // Tous les outils désactivés par défaut — one-shot via enabledTools
        const requestedTools2: string[] = Array.isArray(enabledTools)
          ? enabledTools
          : [];
        // Filtrer par les outils autorisés par le mode si mode restreint, sinon tous
        const modeAllowed = effectiveMode.activeTools; // null means no tools at all? We override: if mode is null, still respect enabledTools? Spec says disabled by default, so mode null still allows if user enabled
        const filteredTools =
          modeAllowed === null && requestedTools2.length === 0
            ? []
            : requestedTools2.filter(
                (t) =>
                  modeAllowed === null ||
                  modeAllowed === undefined ||
                  modeAllowed.includes(t as any) ||
                  true
              );
        // If user explicitly enabled tools, allow even if mode is null (override)
        const activeToolsList: string[] =
          requestedTools2.length > 0 ? requestedTools2 : [];
        const supportsTools = activeToolsList.length > 0;

        const result = streamText({
          activeTools: supportsTools ? (activeToolsList as any) : undefined,
          instructions: systemPrompt({
            modeAddendum: effectiveAddendum,
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
              try {
                await fetch(`${MAI_API_URL}/log-usage`, {
                  body: JSON.stringify({ tokensUsed: totalTokens }),
                  headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                });
              } catch (logErr) {
                console.error("Erreur décompte log-usage:", logErr);
              }
              try {
                dataStream.write({
                  data: { tokens: totalTokens, total: totalTokens } as any,
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
            codeExecution,
            createDocument: createDocument({
              dataStream,
              modelId: chatModel,
              session: { user: { email: maiUser.email, id: userId } } as any,
            }),
            editDocument: editDocument({
              dataStream,
              session: { user: { email: maiUser.email, id: userId } } as any,
            }),
            getWeather,
            imageGenerate: imageGenerate({
              dataStream,
              session: { user: { email: maiUser.email, id: userId } } as any,
            }),
            requestSuggestions: requestSuggestions({
              dataStream,
              modelId: chatModel,
              session: { user: { email: maiUser.email, id: userId } } as any,
            }),
            updateDocument: updateDocument({
              dataStream,
              modelId: chatModel,
              session: { user: { email: maiUser.email, id: userId } } as any,
            }),
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
        if (!process.env.REDIS_URL) {
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
