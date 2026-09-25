import { randomUUID } from "node:crypto";
import { convertToModelMessages } from "ai";
import { applyIncomingApprovalDecisions } from "@/lib/agent/approvals/incoming";
import { resolveAgentExecutionBudget } from "@/lib/agent/budget";
import { buildAgentContext } from "@/lib/agent/context/build";
import {
  collectAttachments,
  validateAttachmentsAgainstModel,
} from "@/lib/agent/context/files";
import { loadAgentProjectContext } from "@/lib/agent/context/project";
import { filterToolsByFlags } from "@/lib/agent/flags";
import {
  type AgentTierFailure,
  agentTierFailureResponse,
  checkAgentAccess,
  checkAgentModelAccess,
  normalizeAgentReasoningLevel,
} from "@/lib/agent/gate";
import { buildAgentOneShotInstructions } from "@/lib/agent/instructions";
import { ensureAgentNotificationsInstalled } from "@/lib/agent/notifications/install";
import { generateTaskPlan, shouldGeneratePlan } from "@/lib/agent/plan";
import {
  createAgentStream,
  createAgentStreamResponse,
} from "@/lib/agent/runtime";
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
import type { RegisteredAgentTool, ToolPermission } from "@/lib/agent/types";
import { injectUserInputAnswers } from "@/lib/agent/user-input/inject";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  getModelEntry,
  isAgentCompatible,
  isModelAllowedForUser,
  pickDefaultAgentModel,
} from "@/lib/ai/registry";
import { toAgentToolId } from "@/lib/ai/tools/ids";
import { errorResponse } from "@/lib/api/error-response";
import { authenticateChatRequest, enforceChatRateLimit } from "@/lib/chat/auth";
import { buildChatContext } from "@/lib/chat/context";
import { loadMcpContext } from "@/lib/chat/mcp";
import { buildMemoryContext } from "@/lib/chat/memory";
import {
  claimAgentRunExecution,
  createAgentRun,
  createAgentStep,
  getActiveAgentRunByChatId,
  getAgentRunById,
  getAgentRunByMessageId,
  getAgentStepsByRunId,
  getToolExecutionsByRunId,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";
import { getAnsweredAgentUserInputsForRun } from "@/lib/db/agent-user-input-queries";
import { saveMessages } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";
import { type AgentRequestBody, agentRequestBodySchema } from "./schema";

export const maxDuration = 300;

// Le client ne fait jamais autorité : l'accès, le modèle, les fichiers, les
// outils et leurs permissions sont tous revérifiés ici, côté serveur.

function lastUserText(messages: unknown[] | undefined): string {
  if (!Array.isArray(messages)) {
    return "";
  }
  for (const message of [...messages].reverse()) {
    const candidate = message as { parts?: unknown; role?: string };
    if (candidate.role !== "user" || !Array.isArray(candidate.parts)) {
      continue;
    }
    const text = candidate.parts
      .map((part) => {
        const value = part as { text?: unknown; type?: unknown };
        return value.type === "text" && typeof value.text === "string"
          ? value.text
          : "";
      })
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }
  return "";
}

export async function POST(request: Request) {
  let body: AgentRequestBody;

  try {
    body = agentRequestBodySchema.parse(await request.json());
  } catch {
    return errorResponse("invalid_request", {
      message: "Requête Agent invalide.",
    });
  }

  try {
    // Les notifications Agent (attente de réponse, approbation, fin de run)
    // sont branchées ici, une seule fois, avant tout run.
    ensureAgentNotificationsInstalled();

    // 1. Authentification et limitation de débit, identiques au Chat. Le tier
    // vient de users.tier (source de vérité) : un compte Plus doit passer ici
    // même si son JWT porte encore un ancien forfait.
    const { auth, error, tierFailure } = await authenticateChatRequest();
    if (error === "forbidden") {
      // Instrumentation : botid renvoie isBot (ou a échoué silencieusement via
      // son catch interne). Sans secret ni payload, juste la garde franchie.
      console.warn("[agent-access] rejected guard=botid code=access_denied");
      return errorResponse("access_denied");
    }
    if (error === "unauthorized") {
      if (tierFailure) {
        return agentTierFailureResponse(tierFailure as AgentTierFailure);
      }
      return errorResponse("auth_required");
    }
    if (!auth) {
      return errorResponse("auth_required");
    }
    await enforceChatRateLimit(request, auth.userId);

    // 2. Le mode Fantôme est incompatible avec Agent (persistance requise).
    if (body.isGhostMode) {
      return errorResponse("invalid_request", {
        message: "Le mode Fantôme n'est pas disponible avec Agent.",
      });
    }

    // Un rejeu retrouve le run avant le nouveau contrôle de quota : le
    // premier essai a pu consommer le reste du quota après avoir été accepté.
    const incomingMessageId =
      (body.message as { id?: string } | undefined)?.id ?? null;
    if (incomingMessageId) {
      const replay = await getAgentRunByMessageId({
        chatId: body.id,
        messageId: incomingMessageId,
      });
      if (replay) {
        if (replay.userId !== auth.userId)
          return errorResponse("access_denied");
        return Response.json(
          { code: "existing_run", runId: replay.id, status: replay.status },
          { status: 409 }
        );
      }
      const active = await getActiveAgentRunByChatId({ chatId: body.id });
      if (active && active.userId === auth.userId) {
        return Response.json(
          { code: "active_run_conflict", runId: active.id },
          { status: 409 }
        );
      }
    }

    // 3. Garde serveur : flag, forfait payant, quota hebdomadaire.
    const access = checkAgentAccess(auth);
    if (!access.allowed) {
      return access.response;
    }
    const { flags, tier } = access;

    // 4. Registre de modèles : forfait, capacités, modèle réellement utilisable.
    // Le registre évalué est celui de l'utilisateur (fetchUserModels) — le
    // même catalogue que le sélecteur client. checkAgentModelAccess ne doit
    // jamais rejuger le modèle sur un autre catalogue (FALLBACK_MODELS) : un
    // modèle réel de l'utilisateur serait sinon classé « sans outils » et
    // refusé (model_access_denied) alors qu'il est sélectionnable dans l'UI.
    const models = await fetchUserModels();
    const settings = await loadAgentSettings({ userId: auth.userId });
    const requested = getModelEntry(body.modelId, models);
    const requestedModelExists = models.some(
      (model) => model.id === body.modelId
    );
    const resolvedModel =
      requestedModelExists &&
      requested.capabilities.tools &&
      isAgentCompatible(requested) &&
      isModelAllowedForUser(requested.id, tier)
        ? requested.id
        : pickDefaultAgentModel(models, settings.defaultModel, tier);

    // TOUTES les vérifications portent sur le modèle RÉELLEMENT résolu et sur
    // l'entrée complète du catalogue utilisateur. Le gate ne relit jamais le
    // fallback : une Laguna sélectionnée depuis /v1/models ne peut pas être
    // reclassée à tort par une heuristique de nom.
    if (resolvedModel !== body.modelId) {
      console.info(
        JSON.stringify({
          event: "agent_model_resolved",
          modelId: resolvedModel,
          requestedModelId: body.modelId,
        })
      );
    }
    const resolvedEntry = getModelEntry(resolvedModel, models);
    const modelAccess = checkAgentModelAccess({
      entry: resolvedEntry,
      flags,
      modelId: resolvedEntry.id,
      tier,
    });
    if (modelAccess.error) {
      // Instrumentation sans secret : quel garde a refusé et sur quel catalogue.
      console.warn(
        `[agent-access] rejected guard=model code=model_access_denied requestedInUserCatalog=${requested.id === body.modelId}`
      );
      return errorResponse("model_access_denied", {
        message: modelAccess.error,
      });
    }
    const capabilities = modelAccess.capabilities;

    // 5. Le contexte partagé est construit avec le modèle EFFECTIF : les
    // fichiers du projet et leurs limites ne suivent jamais le modèle demandé
    // si Agent a choisi un repli compatible avec les outils.
    const ctx = await buildChatContext(request, auth, {
      agentId: body.assistantId ?? null,
      enabledTools: [],
      id: body.id,
      isGhostMode: false,
      message: (body.message as ChatMessage | undefined) ?? null,
      messages: (body.messages as ChatMessage[] | undefined) ?? null,
      mode: "agent",
      pendingPrompt: null,
      persistIncomingMessage: false,
      projectId: body.projectId,
      selectedAgentId: body.assistantId ?? null,
      selectedChatMode: "agent",
      selectedChatModel: resolvedModel,
      selectedVisibilityType: body.visibility,
      skillId: body.skillId,
      skillParams: body.skillParams,
      tags: ["agent"],
    });

    const memoryContext = await buildMemoryContext({
      effectiveAgentId: ctx.effectiveAgentId,
      effectiveProjectId: ctx.effectiveProjectId,
      isGhostMode: false,
      tier,
      userId: ctx.userId,
    });

    // 6. Fichiers : types, nombre et capacités du modèle revérifiés.
    const attachments = collectAttachments(
      (body.message as ChatMessage | undefined) ?? null
    );
    const supportsFiles =
      capabilities.file || capabilities.image || capabilities.vision;
    if (
      attachments.length > 0 &&
      (!supportsFiles || capabilities.maxFiles <= 0)
    ) {
      return errorResponse("unsupported_media_type", {
        message:
          "Ce modèle ne prend pas en charge les fichiers. Choisissez un autre modèle ou retirez les pièces jointes.",
      });
    }
    if (attachments.length > capabilities.maxFiles) {
      return errorResponse("invalid_request", {
        message: `Ce modèle accepte au maximum ${capabilities.maxFiles} fichiers (${attachments.length} fournis).`,
      });
    }
    const mediaValidation = validateAttachmentsAgainstModel({
      attachments,
      capabilities,
    });
    if (mediaValidation.error) {
      return errorResponse("unsupported_media_type", {
        message: mediaValidation.error,
      });
    }

    // 7. Réflexion et autonomie : valeurs validées, jamais transmises telles quelles.
    const reasoningLevel = normalizeAgentReasoningLevel({
      capabilities,
      fallback: settings.reasoningLevel,
      flags,
      requested: body.reasoningLevel,
    });
    const autonomy = body.autonomy ?? settings.autonomy;
    const budget = resolveAgentExecutionBudget({ tier });

    // 8. Nouveau run ou reprise du run en attente (approbation, question).
    const isContinuation = Boolean(body.messages);
    const messageId = (body.message as { id?: string } | undefined)?.id ?? null;
    if (!isContinuation && messageId) {
      const replay = await getAgentRunByMessageId({
        chatId: ctx.id,
        messageId,
      });
      if (replay) {
        return Response.json(
          { code: "existing_run", runId: replay.id, status: replay.status },
          { status: 409 }
        );
      }
    }
    const activeRun = isContinuation
      ? await getActiveAgentRunByChatId({ chatId: ctx.id })
      : null;
    if (isContinuation && !activeRun) {
      return errorResponse("conflict", {
        message: "Aucun run actif à reprendre dans cette conversation.",
      });
    }
    if (!isContinuation) {
      const active = await getActiveAgentRunByChatId({ chatId: ctx.id });
      if (active) {
        return Response.json(
          { code: "active_run_conflict", runId: active.id },
          { status: 409 }
        );
      }
    }
    let resumeSummary: string | null = null;
    let parentRunId: string | null = null;
    if (body.resumeFromRunId) {
      if (!flags["agent.guidedResume"])
        return errorResponse("service_unavailable", {
          message: "La reprise guidée n'est pas encore activée.",
        });
      if (isContinuation)
        return errorResponse("invalid_request", {
          message: "Une reprise guidée doit envoyer une nouvelle consigne.",
        });
      const parent = await getAgentRunById({
        id: body.resumeFromRunId,
        userId: ctx.userId,
      });
      if (
        !parent ||
        parent.chatId !== ctx.id ||
        parent.status !== "timed_out"
      ) {
        return errorResponse("invalid_request", {
          message:
            "Le run à poursuivre est introuvable ou n'a pas expiré dans cette conversation.",
        });
      }
      parentRunId = parent.id;
      const [steps, executions] = await Promise.all([
        getAgentStepsByRunId({ runId: parent.id }),
        getToolExecutionsByRunId({ runId: parent.id }),
      ]);
      const completed = executions
        .filter((item) => item.status === "completed")
        .slice(-8);
      const entries = completed.map((item) => {
        const output =
          item.output && typeof item.output === "object"
            ? (item.output as Record<string, unknown>)
            : {};
        const useful = ["title", "url", "documentId", "artifactId", "source"]
          .map((key) => output[key])
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.slice(0, 180));
        return `- ${item.toolId}: ${useful.join(" · ") || "résultat disponible dans l'historique"}`;
      });
      resumeSummary = [
        `Reprise liée au run ${parent.id}. Le run initial et ses limites restent inchangés.`,
        `Arrêt: ${(parent.stopReason ?? parent.error ?? "délai dépassé").slice(0, 180)}`,
        "Étapes utiles:",
        ...steps
          .filter((step) => step.status === "completed")
          .slice(-10)
          .map(
            (step) => `- ${step.title}: ${(step.summary ?? "").slice(0, 180)}`
          ),
        "Résultats, sources et livrables:",
        ...entries,
      ]
        .join("\n")
        .slice(0, 3500);
    }

    const task = isContinuation
      ? lastUserText(body.messages)
      : (getTextFromMessage((body.message as ChatMessage) ?? null) ?? "");

    if (!task.trim()) {
      return errorResponse("invalid_request", {
        message: "Décrivez la tâche à confier à Agent.",
      });
    }

    // 9. Outils : sélection puis permissions. Sur une reprise, on réutilise
    // exactement les outils du run pour ne pas invalider un appel en attente.
    // Outils MCP : les serveurs installés et activés deviennent des outils
    // réellement exécutables (source "mcp"), sous le drapeau agent.mcp.
    const pluginAgentContext = flags["agent.plugins"]
      ? await listInstalledPluginAgentTools({ tier, userId: ctx.userId }).catch(
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
    const selectedMcpServerIds = Array.from(
      new Set([...ctx.agentMcpServerIds, ...ctx.skillMcpServerIds])
    );
    const baselineTools = filterToolsByFlags(
      flags["agent.mcp"]
        ? [
            ...registeredTools,
            ...(await loadMcpContext({
              chatId: ctx.id,
              isToolApprovalFlow: false,
              messages: null,
              requestedTools: [],
              serverIds: selectedMcpServerIds,
              skillMcpServerIds: ctx.skillMcpServerIds,
              skillMcpToolFilter: ctx.skillMcpToolFilter,
              userId: ctx.userId,
            })
              .then((mcp) =>
                listMcpAgentTools({
                  serverIds: selectedMcpServerIds,
                  servers: mcp.userMcpServers,
                  userId: ctx.userId,
                })
              )
              .catch(() => [])),
          ]
        : registeredTools,
      flags
    );
    const skillAgentToolIds = new Set(
      ctx.skillTools
        .filter((toolId) => toolId !== "mcp")
        .map((toolId) => toAgentToolId(toolId) ?? toolId)
    );

    const continuationSnapshot = activeRun
      ? (activeRun.toolPolicySnapshot as Record<string, ToolPermission>)
      : null;

    // Options one-shot du menu « + » (valides uniquement sur un envoi initial,
    // jamais sur une reprise où le plateau d'outils du run doit rester stable).
    const oneShotOptions = isContinuation
      ? null
      : {
          audio: body.audioEnabled === true,
          image: body.imageEnabled === true,
          memory: body.memoryEnabled === true,
          tasks: body.tasksEnabled === true,
          web: body.forceWeb === true,
        };

    let selectedTools: RegisteredAgentTool[];
    if (continuationSnapshot) {
      selectedTools = baselineTools.filter(
        (tool) => tool.id in continuationSnapshot
      );
    } else {
      const selection = await selectAgentTools({
        capabilities: { files: supportsFiles, tools: capabilities.tools },
        enabledCategories: toToolCategories(
          body.enabledCategories ?? settings.enabledCategories ?? null
        ),
        mode: body.toolMode,
        sessionToken: ctx.sessionToken,
        task,
        tools: baselineTools,
        userId: ctx.userId,
        userTier: tier,
      });
      selectedTools = selection.tools;
      if ((body.toolMode ?? "auto") === "auto") {
        selectedTools = narrowPluginAgentToolsForTask(
          task,
          selectedTools,
          pluginAgentContext.pluginIds
        );
      }

      // Options one-shot : les outils correspondants sont forcés dans le
      // plateau, indépendamment du mode de sélection (auto / all / catégories).
      if (oneShotOptions) {
        const forcedIds = [
          ...(oneShotOptions.tasks ? ["tasks"] : []),
          ...(oneShotOptions.image ? ["generate_image"] : []),
          ...(oneShotOptions.audio ? ["generate_audio"] : []),
          ...(oneShotOptions.memory ? ["manage_memory"] : []),
          ...(oneShotOptions.web ? ["search_web", "read_url"] : []),
        ];
        for (const toolId of forcedIds) {
          if (!selectedTools.some((tool) => tool.id === toolId)) {
            const forced = baselineTools.find((tool) => tool.id === toolId);
            if (forced) {
              selectedTools = [...selectedTools, forced];
            }
          }
        }
      }
      for (const toolId of getMentionedPluginToolIds(
        task,
        pluginAgentContext.pluginIds
      )) {
        if (!selectedTools.some((tool) => tool.id === toolId)) {
          const forced = baselineTools.find((tool) => tool.id === toolId);
          if (forced) selectedTools = [...selectedTools, forced];
        }
      }
      // Les outils d'un Skill sont une contrainte de contexte : ils ne
      // dépendent pas du sélecteur auto et doivent rester disponibles dès que
      // le plugin ou le MCP associé est installé.
      for (const tool of baselineTools) {
        if (
          skillAgentToolIds.has(tool.id) &&
          !selectedTools.some((selected) => selected.id === tool.id)
        ) {
          selectedTools = [...selectedTools, tool];
        }
      }
    }

    const permissions = applyToolPermissions({
      autonomy,
      overrides: settings.toolPolicies,
      tools: selectedTools,
    });

    // Sans approbations activées, les outils qui exigeraient un accord sont
    // retirés : une confirmation ne devient jamais une exécution silencieuse.
    const enabledTools = flags["agent.approvals"]
      ? permissions.enabledTools
      : permissions.enabledTools.filter(
          (tool) => permissions.snapshot[tool.id] === "auto"
        );
    const approvalRequiredToolIds = flags["agent.approvals"]
      ? permissions.approvalRequiredToolIds
      : [];

    if (enabledTools.length === 0) {
      return errorResponse("service_unavailable", {
        message:
          "Aucun outil n'est disponible pour cette tâche avec les réglages actuels.",
      });
    }

    const families = [
      ...new Set(enabledTools.map((tool) => familyForCategory(tool.category))),
    ];

    // 10. Plan de tâche : uniquement pour les tâches qui le justifient, et
    // conservé tel quel lors d'une reprise.
    const plan =
      activeRun?.plan ??
      (!isContinuation &&
      shouldGeneratePlan({ familyCount: families.length, task }) &&
      oneShotOptions?.tasks !== true
        ? await generateTaskPlan({
            families,
            sessionToken: ctx.sessionToken,
            task,
            userId: ctx.userId,
          })
        : null);

    // 11. Run : création, ou reprise du même run (statut remis en exécution).
    let run = activeRun;
    if (!run) {
      try {
        run = await createAgentRun({
          autonomy,
          budget,
          chatId: ctx.id,
          messageId,
          model: resolvedModel,
          parentRunId,
          plan,
          reasoningLevel,
          status: "running",
          toolPolicySnapshot: permissions.snapshot,
          userId: ctx.userId,
        });
      } catch (error) {
        const replay = messageId
          ? await getAgentRunByMessageId({ chatId: ctx.id, messageId })
          : null;
        if (replay)
          return Response.json(
            { code: "existing_run", runId: replay.id, status: replay.status },
            { status: 409 }
          );
        const conflict = await getActiveAgentRunByChatId({ chatId: ctx.id });
        if (conflict)
          return Response.json(
            { code: "active_run_conflict", runId: conflict.id },
            { status: 409 }
          );
        throw error;
      }
    }

    const executionOwner = randomUUID();
    if (
      !(await claimAgentRunExecution({ id: run.id, owner: executionOwner }))
    ) {
      console.warn(
        JSON.stringify({
          chatId: ctx.id,
          event: "agent_run_reservation_conflict",
          runId: run.id,
        })
      );
      return Response.json(
        { code: "run_execution_in_progress", runId: run.id },
        { status: 409 }
      );
    }
    if (body.message) {
      await saveMessages({
        messages: [
          {
            attachments: [],
            chatId: ctx.id,
            createdAt: new Date(),
            id: messageId as string,
            parts: (body.message as ChatMessage).parts,
            role: "user",
          },
        ],
      });
    }
    if (parentRunId)
      console.info(
        JSON.stringify({
          chatId: ctx.id,
          event: "agent_run_resumed",
          parentRunId,
          runId: run.id,
        })
      );

    if (activeRun) {
      await updateAgentRunStatus({
        executionOwner,
        id: activeRun.id,
        status: "running",
      });
    }

    // 12a. Décisions d'approbation portées par les messages entrants : elles
    // sont appliquées À LA DEMANDE PERSISTÉE du run (rattachée au ToolCall
    // exact) avant toute exécution. `needsApproval` relira ensuite la base : un
    // accord sans décision persistée n'exécute rien, et une décision refusée
    // reste définitive.
    if (activeRun) {
      await applyIncomingApprovalDecisions({
        messages: ctx.uiMessages,
        runId: activeRun.id,
      });
    }

    // 12b. Reprise après réponse : la réponse enregistrée (relue en base, jamais
    // depuis ce que transmet le client) remplace la sortie de la question dans
    // le contexte du modèle. Le run reste le MÊME : aucun nouveau run, aucune
    // nouvelle conversation, les étapes déjà réalisées restent visibles.
    const answeredUserInputs = activeRun
      ? await getAnsweredAgentUserInputsForRun({ runId: activeRun.id })
      : [];
    const injectedAnswers = injectUserInputAnswers({
      messages: ctx.modelMessages,
      requests: answeredUserInputs,
    });
    if (activeRun && injectedAnswers.length > 0) {
      await createAgentStep({
        index: activeRun.stepCount,
        runId: activeRun.id,
        status: "completed",
        summary: `${
          injectedAnswers.length
        } réponse${injectedAnswers.length > 1 ? "s" : ""} prise${
          injectedAnswers.length > 1 ? "s" : ""
        } en compte`,
        title: "Reprise après réponse",
        type: "message",
      }).catch(() => {});
    }

    // 13. Contexte projet ciblé puis construction du contexte envoyé au modèle.
    const projectContext = await loadAgentProjectContext({
      modelId: resolvedModel,
      projectId: ctx.effectiveProjectId ?? null,
      userEmail: ctx.userEmail,
      userId: ctx.userId,
    });

    // Les options one-shot et la consigne de plan partagent un contrat unique ;
    // la route ne duplique plus les instructions selon le chemin d'envoi.
    const oneShotInstructions = buildAgentOneShotInstructions(oneShotOptions);

    const agentContext = await buildAgentContext({
      assistantInstructions: ctx.agentInstructions,
      attachments,
      autonomy,
      chatInstructions:
        [ctx.chatCustomInstructions, oneShotInstructions, resumeSummary]
          .filter(Boolean)
          .join("\n\n") || null,
      contextWindow: capabilities.contextWindow,
      families,
      memoryBlock:
        [memoryContext.userMemoryBlock, memoryContext.projectMemoryBlock]
          .filter(Boolean)
          .join("\n\n") || null,

      messages:
        parentRunId && body.message
          ? await convertToModelMessages([body.message as ChatMessage])
          : ctx.modelMessages,
      plan,
      project: projectContext,
      reasoningLevel,
      sessionToken: ctx.sessionToken,
      skillInstructions:
        [ctx.skillInstructions, ...ctx.agentSkillInstructions]
          .filter(Boolean)
          .join("\n\n") || null,
      task,
      userId: ctx.userId,
      userInstructions: ctx.userCustomEnabled
        ? ctx.userCustomInstructions
        : null,
    });

    // 14. Flux d'exécution Agent (mêmes garanties de reprise que le Chat).
    const model = getLanguageModel(resolvedModel, {
      apiKey: ctx.userApiKey,
      sessionToken: ctx.sessionToken,
      userId: ctx.userId,
    });

    const stream = createAgentStream({
      abortSignal: request.signal,
      agentId: ctx.effectiveAgentId,
      approvalRequiredToolIds,

      budget,
      chatId: ctx.id,
      context: agentContext,
      executionOwner,
      existingMessages: ctx.uiMessages,
      firstUserMessageForTitle: ctx.firstUserMessageForTitle,
      flags,
      isContinuation,
      model,
      modelId: resolvedModel,
      plan,
      projectId: ctx.effectiveProjectId ?? null,
      reasoningLevel,
      runId: run.id,
      // Réflexion visible par défaut : identique au Chat (lib/chat/stream.ts
      // envoie toujours sendReasoning: true). Seuls les parts explicitement
      // fournis par le provider transitent — jamais de chain-of-thought fabriqué.
      sendReasoning: true,
      sessionToken: ctx.sessionToken,
      shouldRenameAfterFirst: ctx.shouldRenameAfterFirst,
      startedAt: Date.now(),
      // Reprise : les étapes continuent là où le run s'était arrêté au lieu de
      // repartir de l'indice 0 dans la timeline.
      startStepIndex: activeRun?.stepCount ?? 0,
      // Budget d'outils CUMULÉ : la reprise repart du compteur persisté, pas de
      // zéro (sinon une tâche relancée indéfiniment n'atteint jamais sa limite).
      startToolCallCount: activeRun?.toolCallCount ?? 0,
      task,
      tier,
      tools: enabledTools,

      userEmail: ctx.userEmail,
      userId: ctx.userId,
    });

    return createAgentStreamResponse({ chatId: ctx.id, stream });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("Erreur non gérée dans l'API Agent :", error);
    return errorResponse("internal_error", {
      message: "Agent a rencontré une erreur inattendue.",
    });
  }
}
