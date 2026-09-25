import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type LanguageModel,
  streamText,
  toUIMessageStream,
} from "ai";
import { generateTitleFromConversation } from "@/app/(chat)/actions";
import { systemPrompt } from "@/lib/ai/prompts";
import type { ChatRequestContext } from "@/lib/chat/context";
import {
  getStreamContext,
  isModelStreamActivity,
} from "@/lib/chat/stream-context";
import { isProductionEnvironment, MAI_API_URL } from "@/lib/constants";
import {
  createNotification,
  createStreamId,
  recordTokenUsage,
  saveMessages,
  updateMessage,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID, getTextFromMessage } from "@/lib/utils";

export type ChatStreamParams = {
  ctx: ChatRequestContext;
  model: LanguageModel;
  /**
   * Prépare les outils et l'addendum final à l'intérieur du flux :
   * c'est ici que le chargement MCP et l'instanciation des tools
   * doivent rester (le writer n'existe qu'à cet endroit).
   */
  prepareTools: (dataStream: any) => Promise<{
    tools: Record<string, any>;
    activeToolsList: string[];
    effectiveAddendum: string;
  }>;
  effectiveTemperature?: number;
  effectiveTopP?: number;
  effectiveMaxTokens?: number;
};

export function createChatStream(params: ChatStreamParams) {
  const {
    ctx,
    model,
    prepareTools,
    effectiveTemperature,
    effectiveTopP,
    effectiveMaxTokens,
  } = params;

  return createUIMessageStream({
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
            modelId: ctx.chatModel,
            modelName: ctx.chatModel,
            phase: "thinking",
          },
          transient: true,
          type: "data-waiting-status",
        });
      };

      const { tools, activeToolsList, effectiveAddendum } =
        await prepareTools(dataStream);
      const supportsTools = activeToolsList.length > 0;

      const usageEventKey = `chat:${ctx.id}:${ctx.message?.id ?? ctx.uiMessages.at(-1)?.id ?? `len-${ctx.uiMessages.length}`}:${ctx.chatModel}`;

      const result = streamText({
        activeTools: supportsTools ? (activeToolsList as any) : undefined,
        instructions: systemPrompt({
          modeAddendum: effectiveAddendum,
          requestHints: ctx.requestHints,
          supportsTools,
        }),
        messages: ctx.modelMessages,
        model,
        ...(effectiveTemperature !== undefined && effectiveTemperature !== null
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
          await handleTokenAccounting({
            chatModel: ctx.chatModel,
            dataStream,
            email: ctx.userEmail,
            isGhostMode: ctx.isGhostMode,
            sessionToken: ctx.sessionToken,
            usage: usage as any,
            usageEventKey,
            userId: ctx.userId,
          });
        },
        stopWhen: ({ steps }) => {
          if (steps.length >= 12) return true;
          // Ne pas appeler l'IA après la génération d'un quiz interactif
          const hasQuizzly = steps.some((step) =>
            step.toolCalls?.some((tc) => (tc as any)?.toolName === "quizzly")
          );
          return hasQuizzly;
        },
        telemetry: {
          functionId: "stream-text",
          isEnabled: isProductionEnvironment,
        },
        tools,
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
      await persistStreamEnd(ctx, finishedMessages as ChatMessage[]);
    },
    onError: (error) => {
      console.error("Erreur Stream AI:", error);
      return "Une erreur est survenue lors de la génération de la réponse.";
    },
    originalMessages: ctx.isToolApprovalFlow ? ctx.uiMessages : undefined,
  });
}

async function handleTokenAccounting(params: {
  dataStream: any;
  usage: any;
  chatModel: string;
  email: string;
  isGhostMode: boolean;
  sessionToken: string;
  usageEventKey: string;
  userId: string;
}): Promise<void> {
  const {
    dataStream,
    usage,
    chatModel,
    email,
    isGhostMode,
    sessionToken,
    usageEventKey,
    userId,
  } = params;
  // Décompte précis des tokens (entrée + sortie additionnés)
  const inputTokens = usage?.inputTokens ?? usage?.promptTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? usage?.completionTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? inputTokens + outputTokens;

  if (totalTokens > 0) {
    // 1. Enregistrement direct et persistant en BDD (normal et fantôme)
    await recordTokenUsage({
      idempotencyKey: usageEventKey,
      inputTokens,
      isGhostMode,
      model: chatModel,
      outputTokens,
      totalTokens,
      userEmail: email,
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
    } catch (streamErr) {
      // Repli volontaire : flux déjà fermé côté client — tracé pour diagnostic.
      console.warn("Écriture data-usage impossible (flux fermé ?):", streamErr);
    }
  }
}

async function persistStreamEnd(
  ctx: ChatRequestContext,
  finishedMessages: ChatMessage[]
): Promise<void> {
  if (ctx.isGhostMode) {
    // Mode fantôme : ne pas enregistrer la discussion ou les messages en BDD
    return;
  }
  // Notification IA : à chaque fin de génération (si activé)
  try {
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
      link: `/chat/${ctx.id}`,
      title: "Nouvelle réponse de mAI",
      type: "ai_response",
      userId: ctx.userId,
    }).catch((notifErr) =>
      console.warn("Notification de réponse non enregistrée:", notifErr)
    );
    // Browser push via service? handled client side via polling + Notification API
  } catch (notifErr) {
    console.warn("Notification de réponse non enregistrée:", notifErr);
  }

  if (ctx.isToolApprovalFlow) {
    await Promise.all(
      finishedMessages.map(async (finishedMsg) => {
        const existingMsg = ctx.uiMessages.find((m) => m.id === finishedMsg.id);
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
              chatId: ctx.id,
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
        chatId: ctx.id,
        createdAt: new Date(),
        id: currentMessage.id,
        parts: currentMessage.parts,
        role: currentMessage.role,
      })),
    });

    // Renommage auto après fin du stream IA (premier message uniquement)
    if (ctx.shouldRenameAfterFirst && ctx.firstUserMessageForTitle) {
      try {
        const assistantMsg = [...finishedMessages]
          .reverse()
          .find((m) => m.role === "assistant");
        const assistantText = assistantMsg
          ? (getTextFromMessage(assistantMsg as any) || "").slice(0, 500).trim()
          : "";
        const userText = getTextFromMessage(
          ctx.firstUserMessageForTitle as any
        );
        const title = await generateTitleFromConversation({
          assistantText,
          userText,
        });
        if (title && title !== "Nouvelle discussion") {
          const { updateChatTitleById } = await import("@/lib/db/queries");
          await updateChatTitleById({ chatId: ctx.id, title });
        }
      } catch (e) {
        console.error("Erreur renommage auto:", e);
      }
    }
  }
}

export function createChatStreamResponse(params: {
  stream: ReturnType<typeof createUIMessageStream>;
  chatId: string;
  isGhostMode: boolean;
}): Response {
  return createUIMessageStreamResponse({
    async consumeSseStream({ stream: sseStream }) {
      if (!process.env.REDIS_URL || params.isGhostMode) {
        return;
      }
      try {
        const streamContext = getStreamContext();
        if (streamContext) {
          const streamId = generateId();
          await createStreamId({ chatId: params.chatId, streamId });
          await streamContext.createNewResumableStream(
            streamId,
            () => sseStream
          );
        }
      } catch {
        /* non-critical */
      }
    },
    stream: params.stream,
  });
}
