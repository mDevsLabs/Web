import "server-only";

import { generateText } from "ai";
import { systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { calculator } from "@/lib/ai/tools/calculator";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { dateTime } from "@/lib/ai/tools/datetime";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { webSearch } from "@/lib/ai/tools/web-search";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  createNotification,
  getAgentById,
  getChatById,
  getMessagesByChatId,
  getScheduledMessageById,
  recordTokenUsage,
  saveChat,
  saveMessages,
  setScheduledMessageStatus,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export async function executeScheduledMessage(scheduledId: string) {
  const item = await getScheduledMessageById({ id: scheduledId });
  if (!item) {
    throw new Error(`Message planifié introuvable : ${scheduledId}`);
  }

  if (item.status !== "pending" && item.status !== "failed") {
    return { skipped: true, status: item.status };
  }

  // Marquer en processing
  await setScheduledMessageStatus({
    id: item.id,
    status: "processing",
  });

  try {
    const userId = item.userId;
    let targetChatId = item.chatId;

    // Déterminer ou créer la discussion cible
    if (item.createMode === "new_chat" || !targetChatId) {
      targetChatId = generateUUID();
      await saveChat({
        agentId: item.agentId ?? null,
        customInstructions: item.customInstructions ?? null,
        id: targetChatId,
        projectId: null,
        skillId: null,
        tags: ["planifié"],
        temperatureOverride: item.temperature ?? null,
        title: item.title || "Message planifié",
        userId,
        visibility: "private",
      });
    } else {
      const existing = await getChatById({ id: targetChatId });
      if (!existing) {
        targetChatId = generateUUID();
        await saveChat({
          agentId: item.agentId ?? null,
          customInstructions: item.customInstructions ?? null,
          id: targetChatId,
          projectId: null,
          skillId: null,
          tags: ["planifié"],
          temperatureOverride: item.temperature ?? null,
          title: item.title || "Message planifié",
          userId,
          visibility: "private",
        });
      }
    }

    // Charger les messages précédents de la discussion
    const existingDbMsgs = await getMessagesByChatId({ id: targetChatId });
    const userMessageId = generateUUID();
    const assistantMessageId = generateUUID();

    // Enregistrer le message de l'utilisateur
    await saveMessages({
      messages: [
        {
          attachments: [],
          chatId: targetChatId,
          createdAt: new Date(),
          id: userMessageId,
          parts: [{ text: item.prompt, type: "text" }],
          role: "user",
        },
      ],
    });

    // Récupérer la clé API si disponible
    const userApiKey = await getUserApiKey(userId);

    // Instructions de l'agent
    let agentInstructions: string | null = null;
    let agentModel: string | null = null;
    let agentTemp: number | null = null;
    if (item.agentId) {
      const ag = await getAgentById({ id: item.agentId, userId });
      if (ag) {
        agentInstructions = ag.instructions || null;
        agentModel = ag.defaultModelId || null;
        agentTemp = ag.temperature ?? null;
      }
    }

    const effectiveModel = item.modelId || agentModel || "google/gemini-2.5-flash";
    const effectiveTemp = item.temperature ?? agentTemp ?? undefined;

    let modeAddendum = "";
    if (agentInstructions) {
      modeAddendum += `AGENT ACTIF :\n${agentInstructions}\n\n`;
    }
    if (item.customInstructions) {
      modeAddendum += `INSTRUCTIONS PARTICULIÈRES :\n${item.customInstructions}\n\n`;
    }
    modeAddendum += `Ce message a été envoyé automatiquement à la date et heure planifiée (${new Date().toLocaleString("fr-FR")}). Réponds de manière complète et structurée.`;

    const modelInstance = getLanguageModel(effectiveModel, {
      apiKey: userApiKey,
      userId,
    });

    const enabledToolsList = Array.isArray(item.enabledTools)
      ? (item.enabledTools as string[])
      : [];

    // Outils serveur disponibles
    const availableTools: Record<string, any> = {
      calculator,
      codeExecution,
      dateTime,
      getWeather,
      webSearch,
    };

    const activeTools = enabledToolsList.filter((t) => Boolean(availableTools[t]));

    // Générer la réponse
    const result = await generateText({
      activeTools: activeTools.length > 0 ? (activeTools as any) : undefined,
      instructions: systemPrompt({
        modeAddendum,
        supportsTools: activeTools.length > 0,
      }),
      messages: [
        ...existingDbMsgs.map((m) => ({
          content:
            (m.parts as any[])
              ?.filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("\n") || "",
          role: m.role as "user" | "assistant",
        })),
        { content: item.prompt, role: "user" },
      ],
      model: modelInstance,
      ...(effectiveTemp !== undefined ? { temperature: effectiveTemp } : {}),
      stopWhen: (step: any) => (step.steps?.length ?? 0) >= 6,
      tools: availableTools,
    });

    // Enregistrer le message assistant
    await saveMessages({
      messages: [
        {
          attachments: [],
          chatId: targetChatId,
          createdAt: new Date(),
          id: assistantMessageId,
          parts: [{ text: result.text || "Message exécuté avec succès.", type: "text" }],
          role: "assistant",
        },
      ],
    });

    // Décompte tokens
    const usage = result.usage;
    const inputTokens = (usage as any)?.promptTokens ?? (usage as any)?.inputTokens ?? 0;
    const outputTokens = (usage as any)?.completionTokens ?? (usage as any)?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    if (totalTokens > 0) {
      await recordTokenUsage({
        inputTokens,
        isGhostMode: false,
        model: effectiveModel,
        outputTokens,
        totalTokens,
        userId,
      });
    }

    // Marquer la planification comme complétée
    await setScheduledMessageStatus({
      executedAt: new Date(),
      id: item.id,
      resultChatId: targetChatId,
      status: "completed",
    });

    // Notification in-app
    await createNotification({
      body: `Votre message planifié « ${item.title} » a été exécuté avec succès.`,
      link: `/chat/${targetChatId}`,
      title: "⏰ Message planifié exécuté",
      type: "ai_response",
      userId,
    }).catch(() => {});

    return {
      chatId: targetChatId,
      status: "completed",
      success: true,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    await setScheduledMessageStatus({
      id: item.id,
      lastError: errorMsg,
      status: "failed",
    });

    await createNotification({
      body: `Échec de l'envoi planifié « ${item.title} » : ${errorMsg.slice(0, 100)}`,
      link: `/planning`,
      title: "⚠️ Échec du message planifié",
      type: "ai_response",
      userId: item.userId,
    }).catch(() => {});

    throw error;
  }
}
