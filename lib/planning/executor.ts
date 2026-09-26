import "server-only";

import { generateText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { calculator } from "@/lib/ai/tools/calculator";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { TOOL_SYSTEM_HINTS } from "@/lib/ai/tools/config";
import { dateTime } from "@/lib/ai/tools/datetime";
import { webSearch } from "@/lib/ai/tools/web-search";
import { loadMcpContext } from "@/lib/chat/mcp";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  claimScheduledMessage,
  createNotification,
  getAgentById,
  getChatById,
  getMessagesByChatId,
  getPluginInstallationsByUserId,
  getSkillById,
  recordTokenUsage,
  rescheduleRecurringMessage,
  saveChat,
  saveMessages,
  setScheduledMessageStatus,
} from "@/lib/db/queries";
import { getPersistedTier } from "@/lib/db/users";
import { requireOwnedPlanningChat } from "@/lib/planning/chat-access";
import { deriveScheduleToolMode } from "@/lib/planning/tool-mode";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { createPluginTools } from "@/lib/plugins/server";
import { canUsePlugin } from "@/lib/plugins/tier-lock";
import { toolKindFor } from "@/lib/prompts/capabilities";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";
import {
  composePersonalInstructions,
  type PersonalBlock,
} from "@/lib/prompts/personal";
import { generateUUID } from "@/lib/utils";

export type PlanningRecurrence = "none" | "daily" | "weekly" | "monthly";

export function computeNextOccurrence(
  from: Date,
  recurrence: PlanningRecurrence
): Date | null {
  const next = new Date(from.getTime());
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return null;
  }
}

export async function executeScheduledMessage(scheduledId: string) {
  // La réservation atomique empêche deux workers d'exécuter la même
  // planification. Les exécutions explicites d'un item failed restent possibles.
  const item = await claimScheduledMessage({ id: scheduledId });
  if (!item) {
    return { skipped: true, status: "not_claimable" };
  }

  try {
    const userId = item.userId;
    let targetChatId = item.chatId;

    if (targetChatId) {
      const access = await requireOwnedPlanningChat({
        chatId: targetChatId,
        user: {
          email: null,
          id: userId,
          username: null,
        },
      });
      if (access.response) {
        throw new Error(
          "La conversation cible n'appartient pas à l'utilisateur."
        );
      }
    }

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

    // Fichiers cloud / bibliothèque attachés
    const planningCloudUrls: string[] = Array.isArray(item.cloudFileUrls)
      ? (item.cloudFileUrls as string[])
      : [];

    const userAttachments = planningCloudUrls.map((url) => {
      const fileName = decodeURIComponent(url.split("/").pop() || "fichier");
      return {
        contentType: "application/octet-stream",
        name: fileName,
        url,
      };
    });

    // Enregistrer le message de l'utilisateur avec ses pièces jointes
    await saveMessages({
      messages: [
        {
          attachments: userAttachments,
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
    let agentCloudUrls: string[] = [];
    let agentSkillInstructions: string[] = [];
    let agentSkillToolIds: string[] = [];
    let agentMcpServerIds: string[] = [];
    let agentSkillMcpServerIds: string[] = [];
    const agentSkillMcpToolFilter: Record<string, string[] | null> = {};
    if (item.agentId) {
      const ag = await getAgentById({ id: item.agentId, userId });
      if (ag) {
        agentInstructions = ag.instructions || null;
        agentModel = ag.defaultModelId || null;
        agentTemp = ag.temperature ?? null;
        agentCloudUrls = Array.isArray(ag.cloudFileUrls)
          ? (ag.cloudFileUrls as string[])
          : [];
        const skillIds = Array.isArray(ag.skillIds)
          ? (ag.skillIds as string[]).filter(
              (skillId): skillId is string => typeof skillId === "string"
            )
          : [];
        const skills = await Promise.all(
          skillIds.map((skillId) =>
            getSkillById({ id: skillId, userId }).catch(() => null)
          )
        );
        agentSkillInstructions = skills
          .map((skill) => skill?.instructions?.trim())
          .filter((instructions): instructions is string =>
            Boolean(instructions)
          );
        agentSkillToolIds = Array.from(
          new Set(
            skills.flatMap((skill) =>
              Array.isArray(skill?.tools) ? (skill.tools as string[]) : []
            )
          )
        );
        agentMcpServerIds = Array.isArray(ag.mcpServerIds)
          ? (ag.mcpServerIds as string[])
          : [];
        agentSkillMcpServerIds = Array.from(
          new Set(
            skills.flatMap((skill) =>
              Array.isArray(skill?.mcpServerIds)
                ? (skill.mcpServerIds as string[])
                : []
            )
          )
        );
        for (const skill of skills) {
          if (skill?.mcpToolFilter && typeof skill.mcpToolFilter === "object") {
            Object.assign(
              agentSkillMcpToolFilter,
              skill.mcpToolFilter as Record<string, string[] | null>
            );
          }
        }
      }
    }

    const effectiveModel = item.modelId || agentModel || DEFAULT_CHAT_MODEL;
    const effectiveTemp = item.temperature ?? agentTemp ?? undefined;

    // Bloc personnalisé : même contrat que le Chat et l'Agent — le socle vient
    // de lib/prompts/chat.ts, ces consignes arrivent en dernier, délimitées.
    const allAttachedUrls = Array.from(
      new Set([...planningCloudUrls, ...agentCloudUrls])
    );
    const personalBlocks: PersonalBlock[] = [
      { body: agentInstructions, label: "ASSISTANT ACTIF" },
      {
        body: agentSkillInstructions.join("\n\n") || null,
        label: "COMPÉTENCES DE L'ASSISTANT",
      },
      { body: item.customInstructions, label: "INSTRUCTIONS PARTICULIÈRES" },
      {
        body:
          allAttachedUrls.length > 0
            ? [
                "FICHIERS JOINTS DE LA BIBLIOTHÈQUE / CLOUD :",
                ...allAttachedUrls.map(
                  (url) =>
                    `- ${decodeURIComponent(url.split("/").pop() || "fichier")} (${url})`
                ),
              ].join("\n")
            : null,
        label: "RESSOURCES JOINTES",
      },
      {
        body: `Ce message a été envoyé automatiquement à la date et heure planifiée (${new Date().toLocaleString("fr-FR")}). Réponds de manière complète et structurée.`,
        label: "DÉCLENCHEMENT",
      },
    ];
    const personalBlock = composePersonalInstructions(personalBlocks);

    const modelInstance = getLanguageModel(effectiveModel, {
      apiKey: userApiKey,
      userId,
    });

    // Périmètre d'outils de l'exécution : 3 modes (cf. lib/planning/tool-mode).
    // L'ancien champ "enabledTools" (liste d'outils unitaires) n'est plus lu :
    // l'exécuteur ne connaît que 4 outils natifs, plus les plugins, les
    // serveurs MCP et les tools de skills — cocher un outil natif non pris en
    // charge n'avait aucun effet. On dérive un mode des données existantes
    // pour les tâches créées avant la migration 0029.
    const toolMode = deriveScheduleToolMode({
      enabledTools: item.enabledTools,
      storedMode: item.toolMode,
    });
    const wantsNativeTools = toolMode === "auto";
    // « Automatique » et « Plugins / MCP et Skills » chargent tous deux le
    // contexte MCP (serveurs de l'agent ou, à défaut, serveurs par défaut de
    // l'utilisateur — c'est ce que faisait l'ancien enabledTools "mcp").
    // Seul « Aucun » s'en passe.
    const wantsMcp = toolMode !== "none";

    // Outils de plugins autorisés : mêmes règles que dans le chat, seuls les
    // plugins installés et activés par l'utilisateur sont disponibles.
    const pluginInstallations = await getPluginInstallationsByUserId({
      userId,
    });
    const persistedTier = await getPersistedTier({ userId });
    const tier = persistedTier.ok ? persistedTier.tier : "free";
    const enabledPluginIds =
      toolMode === "none"
        ? []
        : pluginInstallations.flatMap((installation) => {
            if (!installation.isEnabled) return [];
            const plugin = getPluginManifest(installation.pluginId);
            return plugin && canUsePlugin(plugin, tier) ? [plugin.id] : [];
          });
    const pluginTools = createPluginTools(
      {
        channel: "planning",
        chatModel: effectiveModel,
        isGhostMode: false,
      },
      enabledPluginIds
    );
    const effectiveMcpServerIds =
      agentSkillMcpServerIds.length > 0
        ? agentSkillMcpServerIds
        : agentMcpServerIds;
    const mcpContext = wantsMcp
      ? await loadMcpContext({
          chatId: targetChatId,
          isToolApprovalFlow: false,
          messages: null,
          requestedTools: ["mcp"],
          serverIds:
            effectiveMcpServerIds.length > 0
              ? effectiveMcpServerIds
              : undefined,
          skillMcpServerIds: agentSkillMcpServerIds,
          skillMcpToolFilter:
            Object.keys(agentSkillMcpToolFilter).length > 0
              ? agentSkillMcpToolFilter
              : null,
          userId,
        }).catch(() => null)
      : null;
    const executableMcpTools = Object.fromEntries(
      Object.entries(mcpContext?.mcpTools ?? {}).filter(
        ([, tool]) =>
          typeof (tool as { execute?: unknown }).execute === "function"
      )
    );

    // Outils serveur disponibles
    const nativeTools: Record<string, any> = {
      calculator,
      codeExecution,
      dateTime,
      webSearch,
    };
    const availableTools: Record<string, any> = {
      ...(wantsNativeTools ? nativeTools : {}),
      ...pluginTools,
      ...executableMcpTools,
    };

    const activeTools = Array.from(
      new Set([
        ...(wantsNativeTools ? Object.keys(nativeTools) : []),
        ...agentSkillToolIds,
        ...(wantsMcp ? Object.keys(executableMcpTools) : []),
      ])
    ).filter((toolId) => Boolean(availableTools[toolId]));

    // Générer la réponse
    const result = await generateText({
      // Une sélection vide signifie « aucun outil ». Passer `undefined` au SDK
      // réactiverait toutes les entrées de `tools`, y compris les plugins.
      activeTools: activeTools as any,
      instructions: buildChatSystemPrompt({
        addendum: personalBlock,
        artifactsAvailable: activeTools.length > 0,
        capabilities: {
          attachments: 0,
          memory: null,
          plan: null,
          reasoning: false,
          tools: activeTools.map((toolId) => ({
            description:
              TOOL_SYSTEM_HINTS[toolId] ?? "Outil disponible pour cette tâche.",
            id: toolId,
            kind: toolKindFor({ id: toolId }),
            label: toolId,
          })),
          toolsSupported: activeTools.length > 0,
        },
        requestHints: null,
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
      ...(effectiveTemp === undefined ? {} : { temperature: effectiveTemp }),
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
          parts: [
            {
              text: result.text || "Message exécuté avec succès.",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],
    });

    // Décompte tokens
    const usage = result.usage;
    const inputTokens =
      (usage as any)?.promptTokens ?? (usage as any)?.inputTokens ?? 0;
    const outputTokens =
      (usage as any)?.completionTokens ?? (usage as any)?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    if (totalTokens > 0) {
      await recordTokenUsage({
        idempotencyKey: `planning:${item.id}:${new Date(item.scheduledAt).toISOString()}`,
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

    // Planification récurrente : reprogrammer la prochaine occurrence au lieu
    // de terminer définitivement.
    const recurrence = (item.recurrence as PlanningRecurrence) || "none";
    if (recurrence !== "none") {
      const nextDate = computeNextOccurrence(
        // Si l'exécution a eu lieu en retard, la suivante part de l'heure
        // planifiée pour conserver le rythme, sinon de maintenant.
        new Date(item.scheduledAt) > new Date(Date.now() - 60 * 60 * 1000)
          ? new Date(item.scheduledAt)
          : new Date(),
        recurrence
      );
      if (nextDate) {
        await rescheduleRecurringMessage({
          id: item.id,
          nextScheduledAt: nextDate,
        });
      }
    }

    // Notification in-app
    const recurrenceLabel: Record<string, string> = {
      daily: "quotidien",
      monthly: "mensuel",
      none: "",
      weekly: "hebdomadaire",
    };
    await createNotification({
      body:
        `Votre message planifié « ${item.title} » a été exécuté avec succès.` +
        (recurrence === "none"
          ? ""
          : ` Prochaine exécution automatique (${recurrenceLabel[recurrence]}) reprogrammée.`),
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
      link: "/planning",
      title: "⚠️ Échec du message planifié",
      type: "ai_response",
      userId: item.userId,
    }).catch(() => {});

    throw error;
  }
}
