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
import { buildTeamUserInputHandlers, clampTeamPacketText, formatAcceptanceCriteria } from "./teamUtils.js";
import { buildSpecialistToolPool } from "./teamSpecialistRunner.js";


function buildPreflightReviewerPacket(params: {
  reviewer: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  plannedTasks: TeamTask[];
  specialists: TeamExpertRuntimeProfile[];
}): string {
  const { reviewer, userRequest, planSummary, plannedTasks, specialists } =
    params;
  const roster = specialists
    .map((s) => `- ${s.assignmentKey} (${s.name}, ${s.roleType})`)
    .join("\n");
  const taskLines = plannedTasks
    .map((task, idx) =>
      [
        `### Task ${idx + 1} — ${task.expertName} (${task.roleType})`,
        `Assignment: ${task.description}`,
        "Acceptance Criteria:",
        formatAcceptanceCriteria(task.acceptanceCriteria),
        `Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(", ") : "none"}`,
      ].join("\n")
    )
    .join("\n\n");
  return [
    `You are ${reviewer.name}, acting as a preflight requirement reviewer.`,
    "This is BEFORE any specialist executes. Your job is to evaluate the USER REQUEST and the LEAD PROPOSAL for:",
    "- clarity of requirements (are there ambiguities or unstated assumptions?)",
    "- completeness of the plan (does it cover the user goal without gaps or unnecessary scope?)",
    "- role assignment sanity (do the chosen specialists fit the tasks?)",
    "- risks and blockers the user/lead should know before execution.",
    "",
    "Do NOT review implementation outputs (none exist yet). Keep your note concise.",
    "",
    "## User Request",
    clampTeamPacketText(userRequest),
    "",
    "## Lead Plan Summary",
    clampTeamPacketText(planSummary),
    "",
    "## Specialist Roster",
    roster,
    "",
    "## Proposed Tasks",
    taskLines || "(empty)",
    "",
    "## Output Format",
    "### Verdict: OK | NEEDS_CLARIFICATION",
    "### Concerns",
    "- bullet list (may be empty)",
    "### Suggestions",
    "- bullet list (may be empty)",
    "### Summary",
    "One concise paragraph addressed to the user.",
    "",
    'Your verdict line MUST start with exactly "### Verdict: OK" or "### Verdict: NEEDS_CLARIFICATION".',
  ].join("\n");
}

async function runPreflightReviewerAgent(params: {
  settings: ShellSettings;
  threadId: string;
  reviewer: TeamExpertRuntimeProfile;
  plannedTasks: TeamTask[];
  userRequest: string;
  planSummary: string;
  specialists: TeamExpertRuntimeProfile[];
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
}): Promise<{ verdict: "ok" | "needs_clarification"; summary: string }> {
  const {
    settings,
    threadId,
    reviewer,
    plannedTasks,
    userRequest,
    planSummary,
    specialists,
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

  const messages: ChatMessage[] = [
    {
      content: buildPreflightReviewerPacket({
        plannedTasks,
        planSummary,
        reviewer,
        specialists,
        userRequest,
      }),
      role: "user",
    },
  ];

  let reviewText = "";
  const reviewerTask = buildReviewerWorkflowTask(
    reviewer,
    "Review the user request and the lead proposal before execution begins.",
    plannedTasks.map((task) => task.id),
    [
      "Flag ambiguities or missing requirements before execution starts",
      "Assess whether the role assignments and task split are sensible",
    ]
  );
  const teamRoleScope = createTeamRoleScope(reviewerTask, "reviewer");
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
    emit({
      detail: "Reviewing the request and lead proposal before execution.",
      name: reviewer.name,
      phase: "starting",
      teamRoleScope,
      threadId,
      type: "tool_progress",
    });
    options.customToolHandlers = buildTeamUserInputHandlers({
      agentId: teamRoleScope.teamTaskId,
      agentTitle: teamRoleScope.teamExpertName,
      emit,
      signal,
      teamRoleScope,
      threadId,
    });
    await runAgentLoop(settings, messages, options, handlers);
  } catch {
    // Degrade gracefully — caller will treat empty review as OK.
  }

  const needsClarification = /###\s*Verdict:\s*NEEDS_CLARIFICATION/i.test(
    reviewText
  );
  const summary = normalizeTeamAgentSummary(
    reviewText,
    "Preflight review not produced; proceeding as OK."
  );
  return {
    summary,
    verdict: needsClarification ? "needs_clarification" : "ok",
  };
}

// ── LLM-based Reviewer Agent ─────────────────────────────────────────────


export { buildPreflightReviewerPacket, runPreflightReviewerAgent };
