import type { ShellSettings } from "../../settingsStore.js";
import type { ChatMessage, DeferredToolState } from "../../threadStore.js";
import { type AgentLoopHandlers, type AgentLoopOptions, runAgentLoop } from "../agentLoop.js";
import { type AgentToolDef, isReadOnlyAgentTool } from "../agentTools.js";
import { setTeamEscalationRuntime, type TeamEscalation, teamEscalateToLeadTool } from "../teamEscalateTool.js";
import type { TeamExpertRuntimeProfile } from "../teamExpertProfiles.js";
import { setTeamPeerRequestRuntime, type TeamPeerRequest, teamRequestFromPeerTool } from "../teamPeerRequestTool.js";
import type { TeamPlanTaskKind } from "../teamPlanDecideTool.js";
import { setTeamPeerReplyRuntime, type TeamPeerReply, teamReplyToPeerTool } from "../teamReplyToPeerTool.js";
import type { ToolExecutionHooks } from "../toolExecutor.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import { resolveModelRequest } from "../../llm/modelResolve.js";
import type { SpecialistRunResult, TeamEmit, TeamOrchestratorInput, TeamTask } from "./teamTypes.js";
import { appendTeamLanguageRule, createTeamRoleScope, normalizeTeamAgentSummary } from "./teamTypes.js";
import { buildTeamUserInputHandlers, clampTeamPacketText, formatAcceptanceCriteria } from "./teamUtils.js";
import { buildFullPlanBreakdown, buildDependencyHandoffSection } from "./teamPlanner.js";
import { buildPeerResponse } from "./teamPeerCommunication.js";

function buildSpecialistTaskPacket(params: {

  task: TeamTask;
  expert: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  completedTasksById: Map<string, TeamTask>;
  allTasks?: TeamTask[];
}): string {

  const {
    task,
    expert,
    userRequest,
    planSummary,
    completedTasksById,
    allTasks,
  } = params;
  const isDiscuss = task.kind === "discuss";
  const introLines = isDiscuss
    ? [
        "You are a specialist working under a Team Lead.",
        "This is a DISCUSSION task (kind: discuss). The user wants your perspective, ideas, or analysis — NOT code changes.",
        "You are receiving a focused assignment packet instead of the full chat transcript.",
        "Rules for discussion tasks:",
        "- Do NOT modify files. Do NOT propose diffs. Do NOT write implementation code blocks.",
        "- You may inspect the repository with read-only tools (Read, Glob, Grep, LSP) to ground your opinions, but your output is text only.",
        "- Produce a concise, structured textual deliverable from your specialty lens: options, trade-offs, risks, recommendations, questions for the Lead, etc.",
        "- If the user later wants to implement, the Lead will dispatch a separate deliver-kind task.",
      ]
    : [
        "You are a specialist working under a Team Lead.",
        "You are receiving a focused assignment packet instead of the full chat transcript.",
        "Use the dependency handoffs below as the authoritative outputs from your teammates.",
        "Stay within your assigned scope and produce a concrete deliverable.",
      ];
  return [
    ...introLines,
    "",
    "## Original User Request",
    clampTeamPacketText(userRequest),
    "",
    "## Team Lead Plan Summary",
    clampTeamPacketText(planSummary),
    "",
    "## Full Plan Breakdown",
    buildFullPlanBreakdown(task, allTasks ?? [task]),
    "",
    "## Your Role",
    `${expert.name} (${expert.roleType})`,
    "",
    `## Assigned Task (${isDiscuss ? "discussion — no file changes" : "deliverable"})`,
    task.description,
    "",
    "## Acceptance Criteria",
    formatAcceptanceCriteria(task.acceptanceCriteria),
    "",
    "## Dependency Handoffs",
    buildDependencyHandoffSection(task, completedTasksById),
  ].join("\n");
}

function buildSpecialistToolPool(
  base: AgentToolDef[],
  expert: TeamExpertRuntimeProfile,
  taskKind: TeamPlanTaskKind = "deliver"
): AgentToolDef[] {
  const allow =
    expert.allowedTools && expert.allowedTools.length > 0
      ? new Set(expert.allowedTools)
      : null;
  let filtered = allow
    ? base.filter((tool) => allow.has(tool.name))
    : [...base];
  if (taskKind === "discuss") {
    filtered = filtered.filter((tool) => isReadOnlyAgentTool(tool.name));
  }
  for (const tool of [
    teamEscalateToLeadTool,
    teamRequestFromPeerTool,
    teamReplyToPeerTool,
  ]) {
    if (!filtered.some((item) => item.name === tool.name)) {
      filtered.push(tool);
    }
  }
  return filtered;
}

async function runOneSpecialist(params: {
  settings: ShellSettings;
  task: TeamTask;
  expert: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  completedTasksById: Map<string, TeamTask>;
  allTasks: TeamTask[];
  modelSelection: string;
  resolvedModel: TeamOrchestratorInput["resolvedModel"];
  signal: AbortSignal;
  thinkingLevel?: TeamOrchestratorInput["thinkingLevel"];
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  hostWebContentsId?: number | null;
  toolHooks?: ToolExecutionHooks;
  baseTools: AgentToolDef[];
  threadId: string;
  deferredToolState?: DeferredToolState;
  onDeferredToolStateChange?: (state: DeferredToolState) => void;
  toolResultReplacementState?: import("../toolResultBudget.js").ToolResultReplacementState;
  onToolResultReplacementStateChange?: (
    state: import("../toolResultBudget.js").ToolResultReplacementState
  ) => void;
  pullPeerMailboxMessages?: () => Promise<ChatMessage[]>;
  handlePeerRequest?: (request: TeamPeerRequest) => Promise<string>;
  handlePeerReply?: (reply: TeamPeerReply) => void;
  emit: (evt: TeamEmit) => void;
}): Promise<SpecialistRunResult> {
  const {
    settings,
    task,
    expert,
    userRequest,
    planSummary,
    completedTasksById,
    allTasks,
    modelSelection,
    resolvedModel,
    signal,
    thinkingLevel,
    workspaceRoot,
    extraReadableRoots,
    workspaceLspManager,
    hostWebContentsId,
    toolHooks,
    baseTools,
    threadId,
    deferredToolState,
    onDeferredToolStateChange,
    toolResultReplacementState,
    onToolResultReplacementStateChange,
    pullPeerMailboxMessages,
    handlePeerRequest,
    handlePeerReply,
    emit,
  } = params;

  const subMessages: ChatMessage[] = [
    {
      content: buildSpecialistTaskPacket({
        allTasks,
        completedTasksById,
        expert,
        planSummary,
        task,
        userRequest,
      }),
      role: "user",
    },
  ];
  const specializedToolPool = buildSpecialistToolPool(
    baseTools,
    expert,
    task.kind
  );
  let finalText = "";
  let success = true;
  let escalation: TeamEscalation | undefined;
  const teamRoleScope = createTeamRoleScope(task, "specialist");

  const options: AgentLoopOptions = {
    maxOutputTokens: resolvedModel.maxOutputTokens,
    modelSelection: expert.preferredModelId?.trim() || modelSelection,
    paradigm: resolvedModel.paradigm,
    requestApiKey: resolvedModel.apiKey,
    requestBaseURL: resolvedModel.baseURL,
    requestModelId: resolvedModel.requestModelId,
    requestOAuthAuth: resolvedModel.oauthAuth,
    requestProviderId: resolvedModel.providerId,
    requestProviderIdentity: resolvedModel.providerIdentity,
    requestProxyUrl: resolvedModel.proxyUrl,
    ...(resolvedModel.contextWindowTokens == null
      ? {}
      : { contextWindowTokens: resolvedModel.contextWindowTokens }),
    temperatureMode: resolvedModel.temperatureMode,
    ...(resolvedModel.temperature == null
      ? {}
      : { temperature: resolvedModel.temperature }),
    agentSystemAppend: appendTeamLanguageRule(settings, expert.systemPrompt),
    beforeRoundMessages: pullPeerMailboxMessages,
    composerMode: "agent",
    deferredToolState,
    extraReadableRoots,
    hostWebContentsId: hostWebContentsId ?? null,
    onDeferredToolStateChange,
    onToolResultReplacementStateChange,
    signal,
    teamToolRoleScope: teamRoleScope,
    thinkingLevel,
    threadId,
    toolHooks,
    toolPoolOverride: specializedToolPool,
    toolResultReplacementState,
    workspaceLspManager,
    workspaceRoot,
  };

  const handlers: AgentLoopHandlers = {
    onDone: (text, usage) => {
      finalText = normalizeTeamAgentSummary(text, finalText);
      emit({ teamRoleScope, text, threadId, type: "done", usage });
    },
    onError: (message) => {
      success = false;
      finalText = message;
      emit({ message, teamRoleScope, threadId, type: "error" });
    },
    onTextDelta: (text) => {
      finalText += text;
      emit({ teamRoleScope, text, threadId, type: "delta" });
    },
    onThinkingDelta: (text) => {
      emit({ teamRoleScope, text, threadId, type: "thinking_delta" });
    },
    onToolCall: (name, args, toolCallId) => {
      emit({
        expertId: task.expertId,
        message: `Calling tool: ${name}`,
        taskId: task.id,
        threadId,
        type: "team_expert_progress",
      });
      emit({
        args: JSON.stringify(args),
        name,
        teamRoleScope,
        threadId,
        toolCallId,
        type: "tool_call",
      });
    },
    onToolInputDelta: ({ name, partialJson, index }) => {
      emit({
        index,
        name,
        partialJson,
        teamRoleScope,
        threadId,
        type: "tool_input_delta",
      });
    },
    onToolProgress: ({ name, phase, detail }) => {
      emit({
        detail,
        name,
        phase,
        teamRoleScope,
        threadId,
        type: "tool_progress",
      });
    },
    onToolResult: (name, result, toolSuccess, toolCallId) => {
      emit({
        expertId: task.expertId,
        message: `Tool ${name}: ${toolSuccess ? "success" : "failed"}`,
        taskId: task.id,
        threadId,
        type: "team_expert_progress",
      });
      emit({
        name,
        result,
        success: toolSuccess,
        teamRoleScope,
        threadId,
        toolCallId,
        type: "tool_result",
      });
    },
  };

  try {
    if (
      expert.preferredModelId?.trim() &&
      expert.preferredModelId.trim() !== modelSelection
    ) {
      const resolvedOverride = resolveModelRequest(
        settings,
        expert.preferredModelId.trim()
      );
      if (resolvedOverride.ok) {
        options.modelSelection = expert.preferredModelId.trim();
        options.requestModelId = resolvedOverride.requestModelId;
        options.paradigm = resolvedOverride.paradigm;
        options.requestApiKey = resolvedOverride.apiKey;
        options.requestBaseURL = resolvedOverride.baseURL;
        options.requestProxyUrl = resolvedOverride.proxyUrl;
        options.requestProviderId = resolvedOverride.providerId;
        options.requestProviderIdentity = resolvedOverride.providerIdentity;
        options.requestOAuthAuth = resolvedOverride.oauthAuth;
        options.maxOutputTokens = resolvedOverride.maxOutputTokens;
        options.contextWindowTokens = resolvedOverride.contextWindowTokens;
        options.temperatureMode = resolvedOverride.temperatureMode;
        options.temperature = resolvedOverride.temperature;
      }
    }
    setTeamEscalationRuntime(teamRoleScope.teamTaskId, {
      onEscalation: (payload) => {
        escalation = payload;
      },
    });
    setTeamPeerRequestRuntime(teamRoleScope.teamTaskId, {
      onRequest: async (request) =>
        handlePeerRequest
          ? handlePeerRequest(request)
          : buildPeerResponse(request, completedTasksById, allTasks),
    });
    setTeamPeerReplyRuntime(teamRoleScope.teamTaskId, {
      onReply: (reply) => {
        handlePeerReply?.(reply);
      },
    });
    try {
      options.customToolHandlers = buildTeamUserInputHandlers({
        agentId: teamRoleScope.teamTaskId,
        agentTitle: teamRoleScope.teamExpertName,
        emit,
        signal,
        teamRoleScope,
        threadId,
      });
      await runAgentLoop(settings, subMessages, options, handlers);
    } finally {
      setTeamEscalationRuntime(teamRoleScope.teamTaskId, null);
      setTeamPeerRequestRuntime(teamRoleScope.teamTaskId, null);
      setTeamPeerReplyRuntime(teamRoleScope.teamTaskId, null);
    }
  } catch (error) {
    success = false;
    finalText = error instanceof Error ? error.message : String(error);
  }
  if (escalation) {
    return {
      escalation,
      success: false,
      text:
        finalText ||
        [
          `Escalation: ${escalation.reason}`,
          `Proposed change: ${escalation.proposedChange}`,
          ...(escalation.blockingEvidence.length > 0
            ? [
                "Evidence:",
                ...escalation.blockingEvidence.map((item) => `- ${item}`),
              ]
            : []),
        ].join("\n"),
    };
  }
  return { success, text: finalText };
}

function getReadyTasks(
  pending: TeamTask[],
  completedIds: Set<string>
): TeamTask[] {
  return pending.filter(
    (t) =>
      t.dependencies.length === 0 ||
      t.dependencies.every((dep) => completedIds.has(dep))
  );
}

export {
  buildSpecialistToolPool,
  buildSpecialistTaskPacket,
  runOneSpecialist,
  getReadyTasks,
};
