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
import type { ReasoningDetailsSink } from "@/lib/ai/reasoning-details";
import { createReasoningChunkWriter } from "@/lib/ai/reasoning-stream";
import {
  normalizeReasoningLevel,
  resolveReasoningProviderOptions,
} from "@/lib/ai/registry/reasoning";
import type { ChatRequestContext } from "@/lib/chat/context";
import {
  CHAT_FALLBACK_FINAL_RESPONSE,
  chatEndedOnQuizzly,
  createChatStreamControls,
  shouldWriteChatFallback,
} from "@/lib/chat/loop";
import type { MemoryContext } from "@/lib/chat/memory";
import {
  getStreamContext,
  isModelStreamActivity,
} from "@/lib/chat/stream-context";
import {
  type AnnouncedChatTool,
  chatModelToolParams,
  hasArtifactChatTool,
} from "@/lib/chat/tool-policy";
import { isProductionEnvironment, MAI_API_URL } from "@/lib/constants";
import {
  createNotification,
  createStreamId,
  recordTokenUsage,
  saveMessages,
  updateMessage,
} from "@/lib/db/queries";
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
    /** Plateau instancié. Seules les clés annoncées partent vers le modèle. */
    tools: Record<string, unknown> | undefined;
    /** Outils réellement décrits et éligibles. Source du prompt et de l'appel. */
    announced: AnnouncedChatTool[];
    /** `capabilities.tools` du catalogue, pas « la liste est non vide ». */
    toolsSupported: boolean;
    effectiveAddendum: string;
  }>;
  /** Mémoire de la requête : le prompt n'en parle que si elle est lisible. */
  memoryContext: MemoryContext | null;
  effectiveTemperature?: number;
  effectiveTopP?: number;
  effectiveMaxTokens?: number;
  /** Collecteur branché sur le flux du provider (voir `lib/ai/providers.ts`). */
  reasoningSink?: ReasoningDetailsSink;
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
    reasoningSink,
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

      const { tools, announced, toolsSupported, effectiveAddendum } =
        await prepareTools(dataStream);
      const modelTools = chatModelToolParams(
        tools,
        announced.map((tool) => tool.id)
      );
      const sentIds = new Set(
        "activeTools" in modelTools ? modelTools.activeTools : []
      );
      const visibleTools = announced.filter((tool) => sentIds.has(tool.id));
      const loopSupportsTools = visibleTools.length > 0;
      // La part est créée avant le premier appel modèle : le collecteur peut
      // écrire dès le premier chunk de raisonnement reçu.
      const reasoningWriter = reasoningSink
        ? createReasoningChunkWriter(dataStream, `reasoning-${generateUUID()}`)
        : null;
      if (reasoningSink) {
        reasoningSink.onDelta = (text) => reasoningWriter?.push(text);
      }

      const usageEventKey = `chat:${ctx.id}:${ctx.message?.id ?? ctx.uiMessages.at(-1)?.id ?? `len-${ctx.uiMessages.length}`}:${ctx.chatModel}`;
      const instructions = buildChatSystemPrompt({
        addendum: effectiveAddendum || null,
        artifactsAvailable: hasArtifactChatTool(
          visibleTools.map((tool) => tool.id)
        ),
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
          tools: visibleTools.map((tool) => ({
            description: tool.description,
            id: tool.id,
            kind: toolKindFor({ id: tool.id }),
            label: tool.id,
          })),
          toolsSupported,
        },
        requestHints: ctx.requestHints ?? null,
      });

      const result = streamText({
        // `chatModelToolParams` type les outils en `unknown` : le SDK attend
        // un ToolSet. Le plateau est déjà filtré, le cast ne l'élargit pas.
        ...(modelTools as {
          activeTools?: string[];
          tools?: Record<string, any>;
        }),
        instructions,
        ...createChatStreamControls({
          instructions,
          supportsTools: loopSupportsTools,
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
        ...(ctx.reasoningLevel
          ? {
              providerOptions: resolveReasoningProviderOptions(
                normalizeReasoningLevel(ctx.reasoningLevel)
              ),
            }
          : {}),
        onAbort() {
          reasoningWriter?.finish();
        },
        onChunk({ chunk }) {
          if (isModelStreamActivity(chunk)) {
            markModelActive();
          }
        },
        onError() {
          reasoningWriter?.finish();
        },
        onFinish: async ({ text, usage }) => {
          reasoningWriter?.finish();
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
        telemetry: {
          functionId: "stream-text",
          isEnabled: isProductionEnvironment,
        },
      });

      dataStream.merge(
        toUIMessageStream({
          sendReasoning: true,
          stream: result.stream,
        })
      );

      // Le flux est consommé par le merge. On attend la fin pour écrire un
      // repli si aucune phrase n'est sortie — sauf après un quiz, où le
      // modèle ne doit plus être relancé ni commenté.
      try {
        const finishReason = await result.finishReason;
        if (finishReason === "error") {
          return;
        }
        const text = await result.text;
        const steps = await result.steps;
        if (
          shouldWriteChatFallback({
            endedOnQuizzly: chatEndedOnQuizzly(steps),
            text,
          })
        ) {
          const fallbackId = generateId();
          dataStream.write({ id: fallbackId, type: "text-start" });
          dataStream.write({
            delta: CHAT_FALLBACK_FINAL_RESPONSE,
            id: fallbackId,
            type: "text-delta",
          });
          dataStream.write({ id: fallbackId, type: "text-end" });
        }
      } catch (error) {
        console.error("Synthèse de repli impossible:", error);
      }
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
