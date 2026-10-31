import "server-only";

import { generateText } from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { fetchModelsForUser } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import { calculator } from "@/lib/ai/tools/calculator";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { dateTime } from "@/lib/ai/tools/datetime";
import { mergeToolHints } from "@/lib/ai/tools/hints";
import { readUrl } from "@/lib/ai/tools/read-url";
import { webSearch } from "@/lib/ai/tools/web-search";
import { loadMcpContext } from "@/lib/chat/mcp";
import { guardNativeChatTools } from "@/lib/chat/native-tool-guard";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  claimScheduledMessage,
  createNotification,
  getAgentById,
  getChatById,
  getChatSecurity,
  getMessagesByChatId,
  getPluginInstallationsByUserId,
  getSkillById,
  getWeeklyAiTokenUsage,
  recordTokenUsage,
  releaseScheduledMessageClaim,
  rescheduleRecurringMessage,
  saveChat,
  saveMessages,
  setScheduledMessageStatus,
} from "@/lib/db/queries";
import { getPersistedTier } from "@/lib/db/users";
import { createIntegrationSecretResolver } from "@/lib/integrations/tokens";
import { requireOwnedPlanningChat } from "@/lib/planning/chat-access";
import {
  announcePlanningTools,
  createPlanningLoopControls,
  mergePlanningTools,
  planningAssistantParts,
  planningExecutionOutcome,
  planningModelToolParams,
  planningToolsSupported,
  toPlanningModelMessages,
} from "@/lib/planning/generation";
import {
  buildScheduleFromRecord,
  computeNextOccurrence,
  type PlanningRecurrence,
  type RecurrenceSchedule,
} from "@/lib/planning/recurrence";
import { deriveScheduleToolMode } from "@/lib/planning/tool-mode";
import { getTierChatWeeklyLimit } from "@/lib/plans/tier-limits";
import { getPluginManifest } from "@/lib/plugins/catalog";
import { createPluginTools, getPluginSystemHints } from "@/lib/plugins/server";
import { canUsePlugin } from "@/lib/plugins/tier-lock";
import { customPluginChatTools } from "@/lib/plugins/user-plugin-tools";
import { buildChatSystemPrompt } from "@/lib/prompts/chat";
import {
  composePersonalInstructions,
  type PersonalBlock,
} from "@/lib/prompts/personal";
import { generateUUID } from "@/lib/utils";

export type { PlanningRecurrence };

/**
 * Le quota hebdomadaire est-il épuisé pour cet utilisateur?
 *
 * `null` = usage illisible (base momentanément indisponible). On ne bloque
 * alors pas l'exécution: c'est l'amont qui applique de toute façon, et un
 * refus sur une lecture ratée empêcherait une tâche légitime de partir.
 * Même choix que `lib/agent/scheduler/execute.ts`.
 */
async function isWeeklyQuotaExhausted(userId: string): Promise<boolean | null> {
  const persisted = await getPersistedTier({ userId });
  if (!persisted.ok) {
    return null;
  }
  const used = await getWeeklyAiTokenUsage({ userId });
  if (used === null) {
    return null;
  }
  return used >= getTierChatWeeklyLimit(persisted.tier);
}

export async function executeScheduledMessage(scheduledId: string) {
  // La réservation atomique empêche deux workers d'exécuter la même
  // planification. Les exécutions explicites d'un item failed restent possibles.
  const item = await claimScheduledMessage({ id: scheduledId });
  if (!item) {
    return { skipped: true, status: "not_claimable" };
  }

  // Quota épuisé: on DIFFÈRE au lieu d'échouer. Le scheduler Agent fait la
  // même chose avant de créer un run. Marquer `failed` ici était le seul
  // comportement possible jusqu'ici — une tâche récurrente s'arrêtait sur un
  // quota atteint et ne repartait jamais, alors que rien n'avait échoué.
  const quotaExhausted = await isWeeklyQuotaExhausted(item.userId);
  if (quotaExhausted === true) {
    await releaseScheduledMessageClaim({ id: item.id });
    console.warn(
      JSON.stringify({
        event: "planning_quota_exhausted",
        userId: item.userId,
      })
    );
    return { deferred: true, status: "quota_exhausted" };
  }

  try {
    const userId = item.userId;
    let targetChatId = item.chatId;
    // Mode de la conversation cible, figé pour l'attribution de la consommation
    // (migration 0035). Une planification peut écrire dans une conversation
    // EXISTANTE, dont le mode n'est pas forcément « chat»: le lire vaut mieux
    // que supposer, d'autant que la conversation peut être supprimée ensuite.
    let targetMode: "chat" | "agent" = "chat";
    let targetProjectId: string | null = null;
    let existingChat: Awaited<ReturnType<typeof getChatById>> = null;

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
      existingChat = await getChatById({ id: targetChatId });
      targetMode = existingChat?.mode === "agent" ? "agent" : "chat";
      targetProjectId = existingChat?.projectId ?? null;

      // Un tick d'arrière-plan n'a pas de cookie de déverrouillage : une
      // conversation sécurisée ne peut pas être alimentée par la
      // planification. On clôt l'item avec un motif lisible plutôt que de le
      // reprendre à chaque tick.
      if (existingChat) {
        const security = await getChatSecurity({
          chatId: existingChat.id,
        });
        if (security) {
          await setScheduledMessageStatus({
            id: item.id,
            lastError:
              "Conversation sécurisée : déverrouillez-la ou retirez son PIN pour reprendre la planification.",
            status: "failed",
          });
          console.warn(
            JSON.stringify({
              chatId: existingChat.id,
              event: "planning_secured_chat_skipped",
            })
          );
          return { skipped: true, status: "secured_chat" };
        }
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
    } else if (!existingChat) {
      // La conversation annoncée par la planification a disparu entre-temps
      // (suppression manuelle): on repart sur une conversation neuve plutôt
      // que d'échouer, et l'attribution repart sur le mode par défaut.
      targetChatId = generateUUID();
      targetMode = "chat";
      targetProjectId = null;
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

    // Récupérer la clé API si disponible. Le catalogue part en parallèle :
    // le tick n'a pas de cookie, et Flint n'est pas dans la liste embarquée.
    const userApiKey = await getUserApiKey(userId);
    const catalogModelsPromise = fetchModelsForUser({
      apiKey: userApiKey,
      userId,
    });

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

    // Bloc personnalisé: même contrat que le Chat et l'Agent — le socle vient
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
                "FICHIERS JOINTS DE LA BIBLIOTHÈQUE / CLOUD:",
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

    // Périmètre d'outils de l'exécution: 3 modes (cf. lib/planning/tool-mode).
    // L'ancien champ "enabledTools" (liste d'outils unitaires) n'est plus lu:
    // l'exécuteur ne connaît que 4 outils natifs, plus les plugins, les
    // serveurs MCP et les tools de skills — cocher un outil natif non pris en
    // charge n'avait aucun effet. On dérive un mode des données existantes
    // pour les tâches créées avant la migration 0029.
    const toolMode = deriveScheduleToolMode({
      enabledTools: item.enabledTools,
      storedMode: item.toolMode,
    });
    const wantsNativeTools = toolMode === "auto";
    // « Automatique» et « Plugins / MCP et Skills» chargent tous deux le
    // contexte MCP (serveurs de l'agent ou, à défaut, serveurs par défaut de
    // l'utilisateur — c'est ce que faisait l'ancien enabledTools "mcp").
    // Seul « Aucun» s'en passe.
    const wantsMcp = toolMode !== "none";

    // Outils de plugins autorisés: mêmes règles que dans le chat, seuls les
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
    // La planification n'est pas un canal interactif: `createPluginTools` n'y
    // sert que la lecture des connecteurs. Une écriture planifiée relève de
    // l'Agent, seule voie où le moteur de permissions peut la soumettre à
    // approbation.
    const pluginTools = createPluginTools(
      {
        channel: "planning",
        chatModel: effectiveModel,
        isGhostMode: false,
        secretResolver: createIntegrationSecretResolver({ userId }),
        userId,
      },
      enabledPluginIds
    );
    const customPlugins =
      toolMode === "none"
        ? { addendum: "", ids: [] as string[], tools: {} }
        : await customPluginChatTools(userId);
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

    // Outils natifs du mode Automatique. `readUrl` suit `webSearch` : le hint
    // demande de lire la page retenue. La garde renvoie le contrat d'erreur
    // Agent au modèle, sans détail interne.
    const nativeTools = guardNativeChatTools({
      calculator,
      codeExecution,
      dateTime,
      readUrl,
      webSearch,
    });
    const mergedTools = mergePlanningTools({
      custom: customPlugins.tools,
      mcp: wantsMcp ? executableMcpTools : {},
      native: {
        ...(wantsNativeTools ? nativeTools : {}),
      },
      plugin: pluginTools,
    });
    if (mergedTools.collisions.length > 0) {
      console.warn(
        JSON.stringify({
          collisions: mergedTools.collisions,
          event: "planning_tool_collision",
        })
      );
    }

    const catalogModels = await catalogModelsPromise;
    const toolsSupported = planningToolsSupported({
      modelId: effectiveModel,
      models: catalogModels,
    });
    if (!toolsSupported && toolMode !== "none") {
      console.info(
        `[planning] outils omis model=${effectiveModel} reason=capabilities.tools`
      );
    }

    const candidateIds = Array.from(
      new Set([
        ...(wantsNativeTools ? Object.keys(nativeTools) : []),
        ...agentSkillToolIds,
        ...customPlugins.ids,
        ...(wantsMcp ? Object.keys(executableMcpTools) : []),
      ])
    ).filter((toolId) => Boolean(mergedTools.tools[toolId]));
    const announced = toolsSupported
      ? announcePlanningTools({
          hints: mergeToolHints(getPluginSystemHints()),
          owners: mergedTools.owners,
          toolIds: candidateIds,
          tools: mergedTools.tools,
        })
      : [];
    const modelTools = planningModelToolParams({
      activeIds: announced.map((tool) => tool.id),
      tools: mergedTools.tools,
      toolsSupported: announced.length > 0,
    });
    const instructions = buildChatSystemPrompt({
      addendum: personalBlock,
      artifactsAvailable: announced.length > 0,
      capabilities: {
        attachments: 0,
        memory: null,
        plan: null,
        reasoning: false,
        tools: announced.map((tool) => ({
          description: tool.description,
          id: tool.id,
          kind: tool.kind,
          label: tool.id,
        })),
        toolsSupported: announced.length > 0,
      },
      requestHints: null,
    });

    // Générer la réponse. Une sélection vide omet `tools` et `activeTools` :
    // `activeTools` absent réactiverait tout le plateau.
    const result = await generateText({
      ...(modelTools as {
        activeTools?: string[];
        tools?: Record<string, any>;
      }),
      instructions,
      ...createPlanningLoopControls({
        instructions,
        supportsTools: announced.length > 0,
      }),
      messages: await toPlanningModelMessages({
        messages: existingDbMsgs,
        prompt: item.prompt,
      }),
      model: modelInstance,
      ...(effectiveTemp === undefined ? {} : { temperature: effectiveTemp }),
    });

    const outcome = planningExecutionOutcome(result.text);

    // Enregistrer le message assistant, appels d'outils compris.
    await saveMessages({
      messages: [
        {
          attachments: [],
          chatId: targetChatId,
          createdAt: new Date(),
          id: assistantMessageId,
          parts: planningAssistantParts({
            steps: result.steps.map((step) => ({
              toolCalls: step.toolCalls,
              toolResults: step.toolResults,
            })),
            text: outcome.text,
          }),
          role: "assistant",
        },
      ],
    });

    // Décompte tokens, y compris quand la synthèse a échoué : les appels
    // d'outils ont déjà été consommés.
    const usage = result.usage;
    const inputTokens =
      (usage as any)?.promptTokens ?? (usage as any)?.inputTokens ?? 0;
    const outputTokens =
      (usage as any)?.completionTokens ?? (usage as any)?.outputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    if (totalTokens > 0) {
      await recordTokenUsage({
        // La planification crée sa conversation cible avant l'appel: le lien
        // est donc disponible, contrairement à une exécution qui débiterait
        // avant la persistance du chat.
        chatId: targetChatId,
        chatMode: targetMode,
        chatProjectId: targetProjectId,
        idempotencyKey: `planning:${item.id}:${new Date(item.scheduledAt).toISOString()}`,
        inputTokens,
        isGhostMode: false,
        model: effectiveModel,
        outputTokens,
        totalTokens,
        userId,
      });
    }

    if (outcome.status === "failed") {
      await setScheduledMessageStatus({
        id: item.id,
        lastError: outcome.lastError,
        resultChatId: targetChatId,
        status: "failed",
      });
      await createNotification({
        body: `Échec de l'envoi planifié « ${item.title}»: ${outcome.lastError}`,
        link: `/chat/${targetChatId}`,
        title: " Échec du message planifié",
        type: "ai_response",
        userId,
      }).catch(() => {});
      return {
        chatId: targetChatId,
        status: "failed",
        success: false,
      };
    }

    // Marquer la planification comme complétée
    await setScheduledMessageStatus({
      executedAt: new Date(),
      id: item.id,
      resultChatId: targetChatId,
      status: "completed",
    });

    // Planification récurrente: reprogrammer la prochaine occurrence au lieu
    // de terminer définitivement. Le moteur est calendaire (migration 0046):
    // la prochaine occurrence est reconstruite depuis l'heure murale de la
    // tâche dans SON fuseau — plus de dérive DST ni de débordement de mois.
    const recurrence = (item.recurrence as PlanningRecurrence) || "none";
    if (recurrence !== "none") {
      // Si l'exécution a eu lieu à l'heure (ou en léger retard), la suivante
      // part de l'occurrence planifiée pour conserver le rythme, sinon de
      // maintenant — même règle qu'avant la migration.
      const onTime =
        new Date(item.scheduledAt) > new Date(Date.now() - 60 * 60 * 1000);
      const reference = onTime ? new Date(item.scheduledAt) : new Date();
      // Lignes créées avant 0046: les champs calendaires sont NULL et le
      // fallback reconstruit l'heure murale depuis scheduledAt.
      const schedule: RecurrenceSchedule = buildScheduleFromRecord(item, {
        scheduledAt: reference,
      });
      const nextDate = computeNextOccurrence(schedule, reference);
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
        `Votre message planifié « ${item.title}» a été exécuté avec succès.` +
        (recurrence === "none"
          ? ""
          : ` Prochaine exécution automatique (${recurrenceLabel[recurrence]}) reprogrammée.`),
      link: `/chat/${targetChatId}`,
      title: " Message planifié exécuté",
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
      body: `Échec de l'envoi planifié « ${item.title}»: ${errorMsg.slice(0, 100)}`,
      link: "/planning",
      title: " Échec du message planifié",
      type: "ai_response",
      userId: item.userId,
    }).catch(() => {});

    throw error;
  }
}
