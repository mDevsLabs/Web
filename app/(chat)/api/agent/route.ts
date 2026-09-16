import { applyIncomingApprovalDecisions } from "@/lib/agent/approvals/incoming";
import { resolveAgentExecutionBudget } from "@/lib/agent/budget";
import { buildAgentContext } from "@/lib/agent/context/build";
import { collectAttachments } from "@/lib/agent/context/files";
import { loadAgentProjectContext } from "@/lib/agent/context/project";
import {
  type AgentTierFailure,
  agentTierFailureResponse,
  checkAgentAccess,
  checkAgentModelAccess,
  normalizeAgentReasoningLevel,
} from "@/lib/agent/gate";
import { ensureAgentNotificationsInstalled } from "@/lib/agent/notifications/install";
import { generateTaskPlan, shouldGeneratePlan } from "@/lib/agent/plan";
import {
  createAgentStream,
  createAgentStreamResponse,
} from "@/lib/agent/runtime";
import { loadAgentSettings, toToolCategories } from "@/lib/agent/settings";
import { listMcpAgentTools } from "@/lib/agent/tools/adapters/mcp";
import { applyToolPermissions } from "@/lib/agent/tools/permissions";
import { listRegisteredAgentTools } from "@/lib/agent/tools/registry";
import { selectAgentTools } from "@/lib/agent/tools/selector";
import { familyForCategory } from "@/lib/agent/tools/selector/families";
import type { RegisteredAgentTool, ToolPermission } from "@/lib/agent/types";
import { injectUserInputAnswers } from "@/lib/agent/user-input/inject";
import { fetchUserModels } from "@/lib/ai/models.server";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelEntry, pickDefaultAgentModel } from "@/lib/ai/registry";
import { errorResponse } from "@/lib/api/error-response";
import { authenticateChatRequest, enforceChatRateLimit } from "@/lib/chat/auth";
import { buildChatContext } from "@/lib/chat/context";
import { loadMcpContext } from "@/lib/chat/mcp";
import {
  createAgentRun,
  createAgentStep,
  getActiveAgentRunByChatId,
  updateAgentRunStatus,
} from "@/lib/db/agent-queries";
import { getAnsweredAgentUserInputsForRun } from "@/lib/db/agent-user-input-queries";
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

    // 3. Garde serveur : flag, forfait payant, quota hebdomadaire.
    const access = checkAgentAccess(auth);
    if (!access.allowed) {
      return access.response;
    }
    const { flags, tier } = access;

    // 4. Contexte partagé avec le Chat : création de la conversation en mode
    // « agent », projet, mémoire, assistant, skill, hints géographiques.
    const ctx = await buildChatContext(request, auth, {
      agentId: body.assistantId ?? null,
      enabledTools: [],
      id: body.id,
      isGhostMode: false,
      message: (body.message as ChatMessage | undefined) ?? null,
      messages: (body.messages as ChatMessage[] | undefined) ?? null,
      mode: "agent",
      pendingPrompt: null,
      projectId: body.projectId,
      selectedAgentId: body.assistantId ?? null,
      selectedChatMode: "agent",
      selectedChatModel: body.modelId,
      selectedVisibilityType: body.visibility,
      skillId: body.skillId,
      tags: ["agent"],
    });

    // 5. Registre de modèles : forfait, capacités, modèle réellement utilisable.
    // Le registre évalué est celui de l'utilisateur (fetchUserModels) — le
    // même catalogue que le sélecteur client. checkAgentModelAccess ne doit
    // jamais rejuger le modèle sur un autre catalogue (FALLBACK_MODELS) : un
    // modèle réel de l'utilisateur serait sinon classé « sans outils » et
    // refusé (model_access_denied) alors qu'il est sélectionnable dans l'UI.
    const models = await fetchUserModels();
    const settings = await loadAgentSettings({ userId: ctx.userId });
    const requested = getModelEntry(body.modelId, models);
    const resolvedModel = requested.capabilities.tools
      ? requested.id
      : pickDefaultAgentModel(models, settings.defaultModel, tier);

    const modelAccess = checkAgentModelAccess({
      capabilitiesOverride: requested.capabilities,
      flags,
      modelId: resolvedModel,
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
    const activeRun = isContinuation
      ? await getActiveAgentRunByChatId({ chatId: ctx.id })
      : null;

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
    const baselineTools = flags["agent.mcp"]
      ? [
          ...listRegisteredAgentTools(),
          ...(await loadMcpContext({
            chatId: ctx.id,
            isToolApprovalFlow: false,
            messages: null,
            requestedTools: [],
            skillMcpServerIds: [],
            skillMcpToolFilter: null,
            userId: ctx.userId,
          })
            .then((mcp) =>
              listMcpAgentTools({
                servers: mcp.userMcpServers,
                userId: ctx.userId,
              })
            )
            .catch(() => [])),
        ]
      : listRegisteredAgentTools();
    const continuationSnapshot = activeRun
      ? (activeRun.toolPolicySnapshot as Record<string, ToolPermission>)
      : null;

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
      (shouldGeneratePlan({ familyCount: families.length, task })
        ? await generateTaskPlan({
            families,
            sessionToken: ctx.sessionToken,
            task,
            userId: ctx.userId,
          })
        : null);

    // 11. Run : création, ou reprise du même run (statut remis en exécution).
    const run =
      activeRun ??
      (await createAgentRun({
        autonomy,
        budget,
        chatId: ctx.id,
        messageId: (body.message as { id?: string } | undefined)?.id ?? null,
        model: resolvedModel,
        plan,
        reasoningLevel,
        status: "running",
        toolPolicySnapshot: permissions.snapshot,
        userId: ctx.userId,
      }));

    if (activeRun) {
      await updateAgentRunStatus({ id: activeRun.id, status: "running" });
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
      modelId: ctx.chatModel,
      projectId: ctx.effectiveProjectId ?? null,
      userEmail: ctx.userEmail,
      userId: ctx.userId,
    });

    const agentContext = await buildAgentContext({
      assistantInstructions: ctx.agentInstructions,
      attachments,
      autonomy,
      chatInstructions: ctx.chatCustomInstructions,
      contextWindow: capabilities.contextWindow,
      families,
      memoryBlock: null,
      messages: ctx.modelMessages,
      plan,
      project: projectContext,
      reasoningLevel,
      sessionToken: ctx.sessionToken,
      skillInstructions: ctx.skillInstructions,
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
      approvalRequiredToolIds,
      budget,
      chatId: ctx.id,
      context: agentContext,
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
      sendReasoning: capabilities.reasoning === true,
      sessionToken: ctx.sessionToken,
      shouldRenameAfterFirst: ctx.shouldRenameAfterFirst,
      startedAt: Date.now(),
      // Reprise : les étapes continuent là où le run s'était arrêté au lieu de
      // repartir de l'indice 0 dans la timeline.
      startStepIndex: activeRun?.stepCount ?? 0,
      task,
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
