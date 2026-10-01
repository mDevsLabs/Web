import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type LanguageModel,
  streamText,
  toUIMessageStream,
} from "ai";
import { generateTitleFromConversation } from "@/app/(chat)/actions";
import { readReasoningTokens, resolveBillableTotal } from "@/lib/agent/usage";
import { TOOL_SYSTEM_HINTS } from "@/lib/ai/tools/config";
import type { ChatRequestContext } from "@/lib/chat/context";
import type { MemoryContext } from "@/lib/chat/memory";
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
import { getPluginSystemHints } from "@/lib/plugins/server";
import { toolKindFor } from "@/lib/prompts/capabilities";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";
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
  /** Mémoire de la requête : le prompt n'en parle que si elle est lisible. */
  memoryContext: MemoryContext | null;
  effectiveTemperature?: number;
  effectiveTopP?: number;
  effectiveMaxTokens?: number;
};

export function createChatStream(params: ChatStreamParams) {
  const {
    ctx,
    model,
    prepareTools,
    memoryContext,
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
      // Les hints de plugins complètent (et peuvent surcharger) ceux des outils
      // natifs : source unique côté registre de plugins.
      const toolHints: Record<string, string> = {
        ...TOOL_SYSTEM_HINTS,
        ...getPluginSystemHints(),
      };

      const usageEventKey = `chat:${ctx.id}:${ctx.message?.id ?? ctx.uiMessages.at(-1)?.id ?? `len-${ctx.uiMessages.length}`}:${ctx.chatModel}`;

      const result = streamText({
        activeTools: supportsTools ? (activeToolsList as any) : undefined,
        instructions: buildChatSystemPrompt({
          addendum: effectiveAddendum || null,
          artifactsAvailable: supportsTools,
          capabilities: {
            attachments: 0,
            memory: memoryContext?.memoryActive
              ? {
                  block:
                    [
                      memoryContext.userMemoryBlock,
                      memoryContext.projectMemoryBlock,
                    ]
                      .filter(Boolean)
                      .join("\n\n") || null,
                  writable: memoryContext.memoryAllowAdd,
                }
              : null,
            plan: null,
            reasoning: false,
            tools: activeToolsList.map((toolId) => ({
              description:
                toolHints[toolId] ?? "Outil disponible pour cet échange.",
              id: toolId,
              kind: toolKindFor({ id: toolId }),
              label: toolId,
            })),
            toolsSupported: supportsTools,
          },
          requestHints: ctx.requestHints ?? null,
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
        onFinish: async ({ text, usage }) => {
          await handleTokenAccounting({
            chatId: ctx.id,
            // Attribution figée ici (migration 0035) : la conversation peut être
            // supprimée plus tard, son mode et son projet doivent rester
            // lisibles dans l'historique de consommation. `ctx.chat` est la
            // ligne persistée ; à défaut, le mode demandé par la requête est
            // la meilleure information disponible, et le projet effectif peut
            // venir d'une conversation pas encore écrite.
            chatMode:
              ctx.chat?.mode ??
              (ctx.selectedChatMode as "chat" | "agent" | undefined) ??
              "chat",
            chatModel: ctx.chatModel,
            chatProjectId:
              ctx.chat?.projectId ?? ctx.effectiveProjectId ?? null,
            dataStream,
            email: ctx.userEmail,
            isGhostMode: ctx.isGhostMode,
            sessionToken: ctx.sessionToken,
            usage: usage as any,
            usageEventKey,
            userId: ctx.userId,
          });

          // Renommage auto, ICI et pas dans `onEnd`.
          //
          // `onEnd` s'exécute après la fermeture du flux : le titre était bien
          // écrit en base, mais rien ne pouvait le notifier au client. Le
          // `mutate` de l'historique partait de `onFinish` côté client, donc
          // avant, lisait l'ancien titre, et la sidebar affichait
          // « Nouvelle discussion » jusqu'à une revalidation fortuite.
          //
          // Le type `"chat-title"` et son consommateur
          // (components/chat/data-stream-handler.tsx) existaient déjà : c'est
          // l'émission qui manquait.
          if (ctx.shouldRenameAfterFirst && ctx.firstUserMessageForTitle) {
            try {
              const generated = await generateTitleFromConversation({
                assistantText: (text ?? "").slice(0, 500).trim(),
                userText: getTextFromMessage(
                  ctx.firstUserMessageForTitle as any
                ),
              });
              if (generated && generated !== "Nouvelle discussion") {
                const { updateChatTitleById } = await import(
                  "@/lib/db/queries"
                );
                await updateChatTitleById({ chatId: ctx.id, title: generated });
                dataStream.write({
                  data: generated,
                  type: "data-chat-title",
                });
              }
            } catch (error) {
              // Un titre raté ne doit jamais faire échouer l'échange : la
              // conversation est déjà complète et persistée.
              console.error("Erreur renommage auto:", error);
            }
          }
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
  chatId: string;
  chatMode: "chat" | "agent";
  chatProjectId: string | null;
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
    chatId,
    chatMode,
    chatProjectId,
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
  // La réflexion est un sous-ensemble des tokens de sortie, mais l'AI SDK la sort
  // de `outputTokens` : elle doit donc être recomposée explicitement, sans
  // double comptage. Règle partagée avec le chemin Agent.
  const reasoningTokens = readReasoningTokens(usage);
  const totalTokens = resolveBillableTotal({
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens: usage?.totalTokens ?? 0,
  });

  if (totalTokens > 0) {
    // 1. Enregistrement direct et persistant en BDD (normal et fantôme)
    await recordTokenUsage({
      chatId,
      chatMode,
      chatProjectId,
      idempotencyKey: usageEventKey,
      inputTokens,
      isGhostMode,
      model: chatModel,
      outputTokens,
      reasoningTokens,
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
          reasoningTokens,
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
          reasoningTokens,
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

    // Le renommage auto n'est PLUS ici : il est fait dans `streamText.onFinish`
    // (au-dessus), tant que le flux est ouvert, pour pouvoir émettre la part
    // `data-chat-title`. Le faire ici fonctionnait en base, mais la sidebar
    // n'apprenait le nouveau titre qu'à la revalidation suivante.
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
