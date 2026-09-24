import "server-only";

import { randomUUID } from "node:crypto";
import { consumeStream, convertToModelMessages } from "ai";
import { resolveAgentExecutionBudget } from "@/lib/agent/budget";
import { buildAgentContext } from "@/lib/agent/context/build";
import { loadAgentProjectContext } from "@/lib/agent/context/project";
import type { ScheduleRule } from "@/lib/agent/contracts";
import type {
  AgentOccurrenceRecord,
  AgentScheduleRecord,
} from "@/lib/agent/db-schema";
import {
  type AgentFlagKey,
  type AgentFlags,
  filterToolsByFlags,
  getAgentFlags,
} from "@/lib/agent/flags";
import { createAgentStream } from "@/lib/agent/runtime";
import { scheduleChatId } from "@/lib/agent/scheduler/chat-id";
import { loadAgentSettings, toToolCategories } from "@/lib/agent/settings";
import { listMcpAgentTools } from "@/lib/agent/tools/adapters/mcp";
import {
  getMentionedPluginToolIds,
  listInstalledPluginAgentTools,
  narrowPluginAgentToolsForTask,
} from "@/lib/agent/tools/adapters/plugins";
import { applyToolPermissions } from "@/lib/agent/tools/permissions";
import { listRegisteredAgentTools } from "@/lib/agent/tools/registry";
import { selectAgentTools } from "@/lib/agent/tools/selector";
import { familyForCategory } from "@/lib/agent/tools/selector/families";
import type {
  AgentExecutionBudget,
  RegisteredAgentTool,
} from "@/lib/agent/types";
import { FALLBACK_MODELS } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  getModelEntry,
  isAgentCompatible,
  isModelAllowedForUser,
  pickDefaultAgentModel,
} from "@/lib/ai/registry";
import { isPaidTier } from "@/lib/auth/plan";
import { buildMemoryContext } from "@/lib/chat/memory";
import { startOccurrence } from "@/lib/db/agent-foundation-queries";
import {
  claimAgentRunExecution,
  createAgentRun,
  getActiveAgentRunByChatId,
  getAgentRunById,
  releaseAgentRunExecution,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";
import { getUserApiKey } from "@/lib/db/api-keys";
import {
  getChatById,
  getMcpServersByUserId,
  getMessagesByChatId,
  getWeeklyAiTokenUsage,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import { getPersistedTier } from "@/lib/db/users";
import { getTierChatWeeklyLimit } from "@/lib/plans/tier-limits";
import type { ChatMessage } from "@/lib/types";
import { generateUUID, getTextFromMessage } from "@/lib/utils";

// Exécution d'une tâche planifiée par le MÊME AgentRuntime que l'API
// interactive (POST /api/agent → createAgentStream). Invariants :
//  - même runtime, mêmes étapes, même timeline, même persistance ;
//  - aucun cookie de session : la clé du modèle vient de la clé API
//    persistée de l'utilisateur, sinon de MAI_API_KEY ;
//  - conversation réelle (table Chat) : les messages du run sont consultables
//    dans l'interface, le run est rattaché à un chatId qui existe ;
//  - reprise : un run actif pour le chat est avancé, jamais dupliqué — une
//    tâche planifiée en attente d'approbation ou de réponse reprend le même
//    run après résolution, et un crash pendant l'exécution aussi.
//
// Différences assumées avec l'API interactive :
//  - pas de streaming HTTP : le flux est consommé côté serveur, la base
//    reste la source de vérité ;
//  - sélection d'outils par règles (pas de routage par modèle hors requête) ;
//  - le token de session est une sentinelle neutre, jamais un secret.

// Clé de session neutre : aucun transport ne reçoit de secret utilisateur en
// cron ; les outils qui l'exigent se désactivent proprement ou passent par
// leur chemin serveur.
const SCHEDULED_SESSION_SENTINEL = "scheduled-run";

const TERMINAL_RUN_STATUSES: ReadonlySet<string> = new Set([
  "cancelled",
  "completed",
  "failed",
  "timed_out",
]);

// Conversation cible : création réelle au premier run du schedule,
// réutilisation aux occurrences suivantes (le chat persiste).
//
// La conversation est identifiée par le SCHEDULE, jamais par le projet :
// l'ancienne version utilisait `projectId` comme `chatId`, si bien que toutes
// les tâches planifiées d'un même projet partageaient — et mélangeaient — leur
// historique (contexte, reprises, approbations).
async function ensureScheduleChat(params: {
  schedule: AgentScheduleRecord;
}): Promise<string> {
  const chatId = scheduleChatId(params.schedule.id);
  const existing = await getChatById({ id: chatId });
  if (existing) {
    // Le propriétaire est revérifié à chaque exécution : un chat ne doit jamais
    // être réutilisé pour un autre utilisateur, même si l'identifiant fuitait.
    if (existing.userId !== params.schedule.userId) {
      throw new Error(
        "Conversation de tâche planifiée appartenant à un autre utilisateur."
      );
    }
    return chatId;
  }
  await saveChat({
    id: chatId,
    mode: "agent",
    projectId: params.schedule.projectId,
    tags: ["agent", "planifié"],
    title: params.schedule.title,
    userId: params.schedule.userId,
    visibility: "private",
  });
  return chatId;
}

export type ScheduledRunExecution =
  | { finalStatus: string; outcome: "executed"; runId: string }
  | {
      outcome: "awaiting_resolution";
      runId: string;
      status: "waiting_for_approval" | "waiting_for_user";
    }
  | { finalStatus: string; outcome: "already_done"; runId: string }
  | { outcome: "no_tools"; runId: string | null };

export async function executeScheduledRun(params: {
  abortSignal?: AbortSignal;
  occurrence: AgentOccurrenceRecord | null;
  schedule: AgentScheduleRecord;
}): Promise<ScheduledRunExecution> {
  const flags = getAgentFlags();
  if (!flags["agent.enabled"]) {
    return { outcome: "no_tools", runId: null };
  }
  const schedule = params.schedule;
  const userId = schedule.userId;

  // 1. Forfait persisté (source de vérité users.tier) : la limite produit
  // (Plus 1 h, Pro 3 h, Max aucune) s'applique aux tâches planifiées comme
  // aux runs interactifs. Un tier illisible garde un budget technique borné.
  const persisted = await getPersistedTier({ userId });
  const tier = persisted.ok ? persisted.tier : null;
  if (!tier || !isPaidTier(tier)) {
    return { outcome: "no_tools", runId: null };
  }
  const budget: AgentExecutionBudget = resolveAgentExecutionBudget({ tier });
  const weeklyUsage = await getWeeklyAiTokenUsage({ userId });
  if (weeklyUsage !== null && weeklyUsage >= getTierChatWeeklyLimit(tier)) {
    return { outcome: "no_tools", runId: null };
  }
  if (weeklyUsage === null) {
    console.warn(
      JSON.stringify({
        event: "agent_scheduler_quota_unavailable",
        userId,
      })
    );
  }

  // 2. Conversation réelle : source de vérité du chatId, avant tout run.
  const chatId = await ensureScheduleChat({ schedule });

  // 3. Création ou reprise du run. Un run actif pour ce chat est AVANCÉ,
  // jamais dupliqué ; l'occurrence porteuse d'un runId terminal est déjà
  // réalisée (crash après exécution, avant clôture) : rien à relancer.
  const activeRun = await getActiveAgentRunByChatId({ chatId });
  if (params.occurrence?.runId) {
    const prior = await getAgentRunById({
      id: params.occurrence.runId,
      userId,
    }).catch(() => null);
    if (prior && TERMINAL_RUN_STATUSES.has(prior.status)) {
      return {
        finalStatus: prior.status,
        outcome: "already_done",
        runId: prior.id,
      };
    }
    if (activeRun && activeRun.id !== params.occurrence.runId) {
      throw new Error("L'occurrence est liée à un autre run actif.");
    }
  }

  // 4. Messages existants du chat : la reprise repart de l'historique
  // persisté. Nouvelle occurrence : la consigne est d'abord persistée comme
  // message utilisateur — la conversation raconte la même chose que le run.
  const priorRows = await getMessagesByChatId({ id: chatId });
  // Les lignes lues proviennent de saveMessages (parts sérialisés par le
  // runtime lui-même) : relecture typée par un seul point de conversion.
  const existingMessages: ChatMessage[] = priorRows.map((row) => ({
    id: row.id,
    parts: row.parts as ChatMessage["parts"],
    role: row.role as ChatMessage["role"],
  }));
  const resuming = Boolean(activeRun ?? params.occurrence?.runId);
  const isContinuation = resuming || existingMessages.length > 0;

  const task = schedule.instructions.trim();
  if (!resuming) {
    const userMessageId = generateUUID();
    await saveMessages({
      messages: [
        {
          attachments: [],
          chatId,
          createdAt: new Date(),
          id: userMessageId,
          parts: [{ text: task, type: "text" }],
          role: "user",
        },
      ],
    });
    existingMessages.push({
      id: userMessageId,
      parts: [{ text: task, type: "text" }],
      role: "user",
    });
  }

  // 5. Modèle : le registre serveur (FALLBACK_MODELS) fait foi — aucun
  // cookie pour fetchUserModels en cron. Un modelId inconnu ou sans outils
  // retombe sur le défaut Agent : jamais d'échec silencieux du schedule.
  const settings = await loadAgentSettings({ userId }).catch(() => null);
  const requestedModel = getModelEntry(schedule.modelId, FALLBACK_MODELS);
  const requestedModelExists = FALLBACK_MODELS.some(
    (model) => model.id === schedule.modelId
  );
  const resolvedModelId =
    requestedModelExists &&
    requestedModel.capabilities.tools &&
    isAgentCompatible(requestedModel) &&
    isModelAllowedForUser(requestedModel.id, tier)
      ? requestedModel.id
      : pickDefaultAgentModel(
          FALLBACK_MODELS,
          settings?.defaultModel ?? null,
          tier ?? "Free"
        );
  const resolvedModelEntry = getModelEntry(resolvedModelId, FALLBACK_MODELS);

  const userApiKey = await getUserApiKey(userId);
  const model = getLanguageModel(resolvedModelId, {
    apiKey: userApiKey,
    userId,
  });

  // 6. Outils : registre complet, sélection par règles, puis permissions.
  // Sans approbations activées, les outils à approbation sont retirés — une
  // confirmation ne devient jamais une exécution silencieuse. Sur reprise,
  // les outils du run sont réutilisés tels quels (snapshot persisté).
  // Outils MCP : serveurs activés de l'utilisateur, sous le drapeau agent.mcp.
  const pluginAgentContext = flags["agent.plugins"]
    ? await listInstalledPluginAgentTools({ tier, userId }).catch(
        (error: unknown) => {
          console.warn(
            JSON.stringify({
              event: "agent_plugin_registry_unavailable",
              message: error instanceof Error ? error.message : "unknown",
            })
          );
          return { pluginIds: [], tools: [] };
        }
      )
    : { pluginIds: [], tools: [] };
  const registeredTools = [
    ...listRegisteredAgentTools(),
    ...pluginAgentContext.tools,
  ];
  const baselineTools: RegisteredAgentTool[] = filterToolsByFlags(
    flags["agent.mcp"]
      ? [
          ...registeredTools,
          ...(await getMcpServersByUserId({ userId })
            .then((servers) => listMcpAgentTools({ servers, userId }))
            .catch(() => [])),
        ]
      : registeredTools,
    flags
  );
  const continuationSnapshot =
    activeRun?.toolPolicySnapshot &&
    typeof activeRun.toolPolicySnapshot === "object"
      ? (activeRun.toolPolicySnapshot as Record<string, string>)
      : null;
  let selectedTools = continuationSnapshot
    ? baselineTools.filter((tool) => tool.id in continuationSnapshot)
    : (
        await selectAgentTools({
          capabilities: {
            files: false,
            tools: resolvedModelEntry.capabilities.tools,
          },
          enabledCategories: toToolCategories(
            schedule.config.enabledCategories as string[] | null | undefined
          ),
          mode: "auto",
          task,
          tools: baselineTools,
          userTier: tier,
        })
      ).tools;
  if (!continuationSnapshot) {
    selectedTools = narrowPluginAgentToolsForTask(
      task,
      selectedTools,
      pluginAgentContext.pluginIds
    );
  }
  if (!continuationSnapshot) {
    for (const toolId of getMentionedPluginToolIds(
      task,
      pluginAgentContext.pluginIds
    )) {
      if (!selectedTools.some((tool) => tool.id === toolId)) {
        const forced = baselineTools.find((tool) => tool.id === toolId);
        if (forced) selectedTools = [...selectedTools, forced];
      }
    }
  }
  const permissions = applyToolPermissions({
    autonomy: schedule.config.autonomy,
    overrides: settings?.toolPolicies ?? {},
    tools: selectedTools,
  });
  const approvalsEnabled = flags["agent.approvals"] ?? true;
  const enabledTools = approvalsEnabled
    ? permissions.enabledTools
    : permissions.enabledTools.filter(
        (tool) => permissions.snapshot[tool.id] === "auto"
      );
  const approvalRequiredToolIds = approvalsEnabled
    ? permissions.approvalRequiredToolIds
    : [];
  if (enabledTools.length === 0) {
    return { outcome: "no_tools", runId: activeRun?.id ?? null };
  }

  if (params.abortSignal?.aborted) {
    throw new Error(
      "Délai technique du planificateur dépassé avant la création du run."
    );
  }

  // 7. Run : création, ou remise en exécution du run repris.
  const run =
    activeRun ??
    (await createAgentRun({
      autonomy: schedule.config.autonomy,
      budget,
      chatId,
      messageId: null,
      model: resolvedModelId,
      plan: null,
      reasoningLevel: schedule.config.reasoningLevel,
      status: "running",
      toolPolicySnapshot: permissions.snapshot,
      userId,
    }));
  const executionOwner = randomUUID();
  if (!(await claimAgentRunExecution({ id: run.id, owner: executionOwner }))) {
    throw new Error("Run planifié déjà réservé par une autre exécution.");
  }
  if (params.occurrence) {
    await startOccurrence({
      id: params.occurrence.id,
      now: new Date(),
      runId: run.id,
      workerId: params.occurrence.claimedBy,
    });
  }

  // 8. Contexte projet puis contexte du modèle : mêmes builders que l'API.
  const projectContext = await loadAgentProjectContext({
    modelId: resolvedModelId,
    projectId: schedule.projectId,
    userEmail: "",
    userId,
  });
  const families = [
    ...new Set(enabledTools.map((tool) => familyForCategory(tool.category))),
  ];
  const memoryContext = await buildMemoryContext({
    effectiveAgentId: schedule.agentId,
    effectiveProjectId: schedule.projectId,
    isGhostMode: false,
    tier,
    userId,
  });
  const agentContext = await buildAgentContext({
    assistantInstructions: null,
    attachments: [],
    autonomy: schedule.config.autonomy,
    chatInstructions: schedule.instructions,
    contextWindow: resolvedModelEntry.capabilities.contextWindow,
    families,
    memoryBlock:
      [memoryContext.userMemoryBlock, memoryContext.projectMemoryBlock]
        .filter(Boolean)
        .join("\n\n") || null,
    messages: await convertToModelMessages(existingMessages),

    plan: activeRun?.plan ?? null,
    project: projectContext,
    reasoningLevel: schedule.config.reasoningLevel,
    sessionToken: SCHEDULED_SESSION_SENTINEL,
    skillInstructions: null,
    task,
    userId,
    userInstructions: null,
  });

  await updateAgentRunStatus({
    executionOwner,
    id: run.id,
    status: "running",
  });

  // 9. Exécution par le runtime standard : toute la persistance (steps,
  // checkpoints, messages, statut final, usage, événements métier) est celle
  // du runtime — identique à un run interactif.
  const stream = createAgentStream({
    abortSignal: params.abortSignal,
    agentId: schedule.agentId,
    approvalRequiredToolIds,
    budget,

    chatId,
    checkpoint: activeRun?.checkpoint?.duration ?? null,
    context: agentContext,
    executionOwner,
    existingMessages,
    firstUserMessageForTitle: null,
    flags,
    isContinuation,
    model,
    modelId: resolvedModelId,
    plan: activeRun?.plan ?? null,
    projectId: schedule.projectId,
    reasoningLevel: schedule.config.reasoningLevel,
    revision: activeRun?.revision ?? undefined,
    runId: run.id,
    sendReasoning: false,
    sessionToken: SCHEDULED_SESSION_SENTINEL,
    shouldRenameAfterFirst: false,
    startedAt: Date.now(),
    startStepIndex: activeRun?.stepCount ?? 0,
    task,
    tier,
    tools: enabledTools,
    userEmail: "",

    userId,
  });
  await consumeStream({ onError: () => {}, stream }).catch(() => {});

  // 10. Statut final relu depuis la base (jamais déduit du flux) : une
  // attente (approbation, question) persiste son statut pour la reprise.
  const finalRow = await getAgentRunById({ id: run.id, userId }).catch(
    () => null
  );
  let finalStatus = finalRow?.status ?? "failed";
  if (
    params.abortSignal?.aborted &&
    ["queued", "running", "waiting_for_tool"].includes(finalStatus)
  ) {
    finalStatus = "timed_out";
    await updateAgentRunStatus({
      completedAt: new Date(),
      error: "Délai technique du planificateur dépassé.",
      executionOwner,
      id: run.id,
      onlyIfActive: true,
      status: "timed_out",
      stopReason: "scheduler_deadline",
    });
    console.warn(
      JSON.stringify({
        event: "agent_schedule_run_timed_out",
        occurrenceId: params.occurrence?.id ?? null,
        runId: run.id,
      })
    );
  }
  if (["queued", "running", "waiting_for_tool"].includes(finalStatus)) {
    finalStatus = "failed";
    await updateAgentRunStatus({
      completedAt: new Date(),
      error: "Le flux planifié s'est interrompu avant la clôture du run.",
      executionOwner,
      id: run.id,
      onlyIfActive: true,
      status: "failed",
      stopReason: "stream_incomplete",
    });
  }
  await releaseAgentRunExecution({ id: run.id, owner: executionOwner }).catch(
    () => {}
  );
  if (
    finalStatus === "waiting_for_approval" ||
    finalStatus === "waiting_for_user"
  ) {
    return {
      outcome: "awaiting_resolution",
      runId: run.id,
      status: finalStatus,
    };
  }
  return { finalStatus, outcome: "executed", runId: run.id };
}

// Export de confort pour les tests de contrat du scheduler.
export type ScheduleRuleLike = ScheduleRule;
export { getTextFromMessage };
