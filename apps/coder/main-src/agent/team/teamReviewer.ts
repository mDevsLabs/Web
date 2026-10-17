import type { ShellSettings } from "../../settingsStore.js";
import type { ChatMessage, DeferredToolState } from "../../threadStore.js";
import { type AgentLoopHandlers, type AgentLoopOptions, runAgentLoop } from "../agentLoop.js";
import type { AgentToolDef } from "../agentTools.js";
import type { TeamExpertRuntimeProfile } from "../teamExpertProfiles.js";
import type { ToolExecutionHooks } from "../toolExecutor.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import { resolveModelRequest } from "../../llm/modelResolve.js";
import type { TeamEmit, TeamOrchestratorInput, TeamTask } from "./teamTypes.js";
import { appendTeamLanguageRule, buildReviewerWorkflowTask, createTeamRoleScope, normalizeTeamAgentSummary } from "./teamTypes.js";
import { buildTeamUserInputHandlers, clampTeamPacketText, formatAcceptanceCriteria, TEAM_HANDOFF_TEXT_LIMIT } from "./teamUtils.js";
import { buildSpecialistToolPool } from "./teamSpecialistRunner.js";

function buildReviewerTaskPacket(params: {

  reviewer: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  completedTasks: TeamTask[];
}): string {
  const { reviewer, userRequest, planSummary, completedTasks } = params;
  const taskSummary = completedTasks
    .map((task) =>
      [
        `### ${task.expertName} (${task.roleType}) - ${task.status}`,
        `Task: ${task.description}`,
        `Acceptance Criteria:\n${formatAcceptanceCriteria(task.acceptanceCriteria)}`,
        "Output:",
        clampTeamPacketText(task.result, TEAM_HANDOFF_TEXT_LIMIT),
      ].join("\n")
    )
    .join("\n\n");
  return [
    `You are ${reviewer.name}, the reviewer for this team workflow.`,
    "Review the specialists outputs for correctness, regressions, and quality.",
    "Base your review on the task packets and completed outputs below.",
    "",
    "## Original User Request",
    clampTeamPacketText(userRequest),
    "",
    "## Team Lead Plan Summary",
    clampTeamPacketText(planSummary),
    "",
    "## Specialist Outputs",
    taskSummary || "(no specialist output)",
    "",
    "Respond with your review following your review checklist.",
    'Your verdict line MUST start with exactly "### Verdict: APPROVED" or "### Verdict: NEEDS_REVISION".',
  ].join("\n");
}

async function runReviewerAgent(params: {
  settings: ShellSettings;
  threadId: string;
  reviewer: TeamExpertRuntimeProfile;
  completedTasks: TeamTask[];
  userRequest: string;
  planSummary: string;
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
  deferredToolState?: DeferredToolState;
  onDeferredToolStateChange?: (state: DeferredToolState) => void;
  toolResultReplacementState?: import("../toolResultBudget.js").ToolResultReplacementState;
  onToolResultReplacementStateChange?: (
    state: import("../toolResultBudget.js").ToolResultReplacementState
  ) => void;
  emit: (evt: TeamEmit) => void;
}): Promise<{ verdict: "approved" | "revision_needed"; summary: string }> {
  const {
    settings,
    threadId,
    reviewer,
    completedTasks,
    userRequest,
    planSummary,
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
    deferredToolState,
    onDeferredToolStateChange,
    toolResultReplacementState,
    onToolResultReplacementStateChange,
    emit,
  } = params;

  const reviewMessages: ChatMessage[] = [
    {
      content: buildReviewerTaskPacket({
        completedTasks,
        planSummary,
        reviewer,
        userRequest,
      }),
      role: "user",
    },
  ];

  const reviewerTask = buildReviewerWorkflowTask(
    reviewer,
    "Review specialist results and provide the final verdict.",
    completedTasks.map((task) => task.id),
    ["Review all specialist results", "Provide a clear final verdict"]
  );
  const teamRoleScope = createTeamRoleScope(reviewerTask, "reviewer");

  let reviewText = "";
  const specializedTools = buildSpecialistToolPool(baseTools, reviewer);
  const options: AgentLoopOptions = {
    maxOutputTokens: resolvedModel.maxOutputTokens,
    modelSelection: reviewer.preferredModelId?.trim() || modelSelection,
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
    agentSystemAppend: appendTeamLanguageRule(settings, reviewer.systemPrompt),
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
    toolPoolOverride: specializedTools,
    toolResultReplacementState,
    workspaceLspManager,
    workspaceRoot,
  };

  if (
    reviewer.preferredModelId?.trim() &&
    reviewer.preferredModelId.trim() !== modelSelection
  ) {
    const resolved = resolveModelRequest(
      settings,
      reviewer.preferredModelId.trim()
    );
    if (resolved.ok) {
      options.modelSelection = reviewer.preferredModelId.trim();
      options.requestModelId = resolved.requestModelId;
      options.paradigm = resolved.paradigm;
      options.requestApiKey = resolved.apiKey;
      options.requestBaseURL = resolved.baseURL;
      options.requestProxyUrl = resolved.proxyUrl;
      options.requestProviderId = resolved.providerId;
      options.requestProviderIdentity = resolved.providerIdentity;
      options.requestOAuthAuth = resolved.oauthAuth;
      options.maxOutputTokens = resolved.maxOutputTokens;
      options.contextWindowTokens = resolved.contextWindowTokens;
      options.temperatureMode = resolved.temperatureMode;
      options.temperature = resolved.temperature;
    }
  }

  const handlers: AgentLoopHandlers = {
    onDone: (text, usage) => {
      reviewText = text;
      emit({ teamRoleScope, text, threadId, type: "done", usage });
    },
    onError: (message) => {
      emit({ message, teamRoleScope, threadId, type: "error" });
    },
    onTextDelta: (text) => {
      reviewText += text;
      emit({ teamRoleScope, text, threadId, type: "delta" });
    },
    onThinkingDelta: (text) => {
      emit({ teamRoleScope, text, threadId, type: "thinking_delta" });
    },
    onToolCall: (name, args, toolCallId) => {
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
    onToolResult: (name, result, success, toolCallId) => {
      emit({
        name,
        result,
        success,
        teamRoleScope,
        threadId,
        toolCallId,
        type: "tool_result",
      });
    },
  };

  try {
    options.customToolHandlers = buildTeamUserInputHandlers({
      agentId: teamRoleScope.teamTaskId,
      agentTitle: teamRoleScope.teamExpertName,
      emit,
      signal,
      teamRoleScope,
      threadId,
    });
    await runAgentLoop(settings, reviewMessages, options, handlers);
  } catch {
    // fall through to deterministic fallback
  }

  const hasRevisionVerdict = /###\s*Verdict:\s*NEEDS_REVISION/i.test(
    reviewText
  );
  const hasFailedTasks = completedTasks.some((t) => t.status === "failed");

  const verdict: "approved" | "revision_needed" =
    hasRevisionVerdict || hasFailedTasks ? "revision_needed" : "approved";

  const summary = normalizeTeamAgentSummary(
    reviewText,
    hasFailedTasks
      ? `Review: ${completedTasks.filter((t) => t.status === "failed").length} task(s) failed.`
      : `Review: All ${completedTasks.length} task(s) completed successfully.`
  );

  return { summary, verdict };
}

// ── LLM-based Lead final synthesis ───────────────────────────────────────


export { buildReviewerTaskPacket, runReviewerAgent };
