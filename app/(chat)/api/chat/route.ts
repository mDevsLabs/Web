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
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  DEFAULT_CHAT_MODEL,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment, MAI_API_URL } from "@/lib/constants";
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
import type { ChatMessage, WaitingStatusData } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
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
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

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
    if (maiUser.tokensUsed >= maiUser.limit) {
      return new Response(
        JSON.stringify({
          error: "Votre limite hebdomadaire de tokens est atteinte. Veuillez mettre à niveau votre forfait sur https://mai-devs.vercel.app pour continuer.",
          over_limit: true,
          limit: maiUser.limit,
          used: maiUser.tokensUsed,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await checkIpRateLimit(ipAddress(request));

    const chatModel = selectedChatModel || DEFAULT_CHAT_MODEL;
    const isToolApprovalFlow = Boolean(messages);
    const userId = maiUser.id || maiUser.email;

    // Récupérer la clé API Neon du compte
    const userApiKey = maiUser.id ? await getUserApiKey(maiUser.id) : null;

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== userId && chat.userId !== maiUser.email) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user") {
      await saveChat({
        id,
        title: "Nouvelle discussion",
        userId,
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
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
          if (hasModelActivity) return;
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

        const result = streamText({
          activeTools: [
            "getWeather",
            "createDocument",
            "editDocument",
            "updateDocument",
            "requestSuggestions",
          ],
          instructions: systemPrompt({ requestHints, supportsTools: true }),
          messages: modelMessages,
          model,
          onChunk({ chunk }) {
            if (isModelStreamActivity(chunk)) {
              markModelActive();
            }
          },
          stopWhen: isStepCount(5),
          telemetry: {
            functionId: "stream-text",
            isEnabled: isProductionEnvironment,
          },
          tools: {
            createDocument: createDocument({
              dataStream,
              modelId: chatModel,
              session: { user: { id: userId, email: maiUser.email } } as any,
            }),
            editDocument: editDocument({
              dataStream,
              session: { user: { id: userId, email: maiUser.email } } as any,
            }),
            getWeather,
            requestSuggestions: requestSuggestions({
              dataStream,
              modelId: chatModel,
              session: { user: { id: userId, email: maiUser.email } } as any,
            }),
            updateDocument: updateDocument({
              dataStream,
              modelId: chatModel,
              session: { user: { id: userId, email: maiUser.email } } as any,
            }),
          },
          onFinish: async ({ usage }) => {
            // Décompte précis des tokens (entrée + sortie additionnés)
            const inputTokens = (usage as any)?.inputTokens ?? (usage as any)?.promptTokens ?? 0;
            const outputTokens = (usage as any)?.outputTokens ?? (usage as any)?.completionTokens ?? 0;
            const totalTokens = (usage as any)?.totalTokens ?? (inputTokens + outputTokens);

            if (totalTokens > 0) {
              try {
                await fetch(`${MAI_API_URL}/log-usage`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken}`,
                  },
                  body: JSON.stringify({ tokensUsed: totalTokens }),
                });
              } catch (logErr) {
                console.error("Erreur décompte log-usage:", logErr);
              }
            }
          },
        });

        dataStream.merge(
          toUIMessageStream({
            sendReasoning: true,
            stream: result.stream,
          })
        );

        if (titlePromise) {
          try {
            const title = await titlePromise;
            dataStream.write({ data: title, type: "data-chat-title" });
            updateChatTitleById({ chatId: id, title });
          } catch {
            /* non-fatal */
          }
        }
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
