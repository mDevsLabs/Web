import type { ShellSettings } from "../../settingsStore.js";
import type { ChatMessage, DeferredToolState } from "../../threadStore.js";
import { resolveModelRequest } from "../../llm/modelResolve.js";
import { type AgentLoopHandlers, type AgentLoopOptions, runAgentLoop } from "../agentLoop.js";
import type { TeamExpertRuntimeProfile } from "../teamExpertProfiles.js";
import type { ToolExecutionHooks } from "../toolExecutor.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type { TeamTaskQueue } from "../teamTaskQueue.js";
import type { TeamEmit, TeamOrchestratorInput, TeamTask } from "./teamTypes.js";
import { appendTeamLanguageRule, createTeamRoleScope, normalizeTeamAgentSummary } from "./teamTypes.js";
import { clampTeamPacketText, TEAM_HANDOFF_TEXT_LIMIT } from "./teamUtils.js";
import { extractTeamLeadNarrative } from "./teamPlanner.js";


function buildLeadFinalSynthesisPacket(params: {
  teamLead: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  completedTasks: TeamTask[];
  review: { verdict: "approved" | "revision_needed"; summary: string };
  hasCjk: boolean;
}): string {
  const { teamLead, userRequest, planSummary, completedTasks, review, hasCjk } =
    params;
  const taskBlocks = completedTasks
.map((task) =>
      [
        `### ${task.expertName} (${task.roleType}) — ${task.status}`,
        `Task: ${task.description}`,
        "Output:",
        clampTeamPacketText(task.result, TEAM_HANDOFF_TEXT_LIMIT),
      ].join("\n")
    )
.join("\n\n");
  const isPureDiscuss =
    completedTasks.length > 0 &&
    completedTasks.every((task) => task.kind === "discuss");
  const guidance = hasCjk
? [
        `你是 ${teamLead.name}，本次协作的 Team Lead。所有专家已完成各自的任务。`,
        "请基于用户的原始诉求和每位专家的输出，给用户写一段收尾陈述。",
        "要求：",
        "- 直接面向用户说话，不要复述任务分派过程。",
        "- 将各专家的核心观点/产出整合成连贯的整体回答，不是简单的逐条罗列。",
        "- 指出关键权衡、可选路径，以及你作为 Lead 的倾向性建议（如果有）。",
        "- 给出下一步用户可采取的动作。",
        isPureDiscuss
? '- 这是一次讨论（非交付），不要写任何代码或建议"我们已经修改了文件"之类的话术。'
: "- 如果有失败或需要返工的任务，诚实指出并说明影响。",
        '- 不要以 "## " 或 "# " 标题开头，直接写正文即可；必要时可使用简短的小标题或项目符号。',
        "- 用中文回答，语气专业而友好。",
        "- 控制在 250 字以内的紧凑总结，避免冗长。",
      ].join("\n")
: [
        `You are ${teamLead.name}, the Team Lead for this collaboration. All specialists have finished their tasks.`,
        "Write a closing message to the user that integrates every specialists output.",
        "Requirements:",
        "- Speak directly to the user; do not restate the planning/dispatch process.",
        "- Integrate the specialists outputs into a coherent answer, not a bulleted checklist.",
        "- Highlight the key trade-offs, available paths, and your Lead-level recommendation.",
        "- Tell the user what they can do next.",
        isPureDiscuss
? "- This was a discussion, not a delivery — do not write code or claim any files were changed."
: "- If any task failed or needs revision, be honest about it and its impact.",
        '- Do not start with a "## " or "# " heading; write in prose with short sub-headings or bullets only when helpful.',
        "- Keep it tight, under about 250 words.",
      ].join("\n");
  return [
    guidance,
    "",
    "## Original User Request",
    clampTeamPacketText(userRequest),
    "",
    "## Team Lead Plan Summary",
    clampTeamPacketText(planSummary),
    "",
    "## Specialist Outputs",
    taskBlocks || (hasCjk? "(无)": "(no specialist output)"),
    "",
    "## Review Verdict",
    `${review.verdict === "approved"? (hasCjk? "通过": "Approved"): hasCjk? "需要修订": "Needs revision"} — ${clampTeamPacketText(review.summary, 600)}`,
  ].join("\n");
}

async function runTeamLeadFinalSynthesis(params: {
  settings: ShellSettings;
  threadId: string;
  teamLead: TeamExpertRuntimeProfile;
  userRequest: string;
  planSummary: string;
  completedTasks: TeamTask[];
  review: { verdict: "approved" | "revision_needed"; summary: string };
  hasCjk: boolean;
  modelSelection: string;
  resolvedModel: TeamOrchestratorInput["resolvedModel"];
  signal: AbortSignal;
  thinkingLevel?: TeamOrchestratorInput["thinkingLevel"];
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  hostWebContentsId?: number | null;
  toolHooks?: ToolExecutionHooks;
  deferredToolState?: DeferredToolState;
  onDeferredToolStateChange?: (state: DeferredToolState) => void;
  toolResultReplacementState?: import("../toolResultBudget.js").ToolResultReplacementState;
  onToolResultReplacementStateChange?: (
    state: import("../toolResultBudget.js").ToolResultReplacementState
  ) => void;
  emit: (evt: TeamEmit) => void;
}): Promise<string> {
  const {
    settings,
    threadId,
    teamLead,
    userRequest,
    planSummary,
    completedTasks,
    review,
    hasCjk,
    modelSelection,
    resolvedModel,
    signal,
    thinkingLevel,
    workspaceRoot,
    extraReadableRoots,
    workspaceLspManager,
    hostWebContentsId,
    toolHooks,
    deferredToolState,
    onDeferredToolStateChange,
    toolResultReplacementState,
    onToolResultReplacementStateChange,
    emit,
  } = params;

  const teamLeadScope = createTeamRoleScope(
    {
      acceptanceCriteria: [],
      dependencies: completedTasks.map((task) => task.id),
      description:
        "Synthesize the specialists outputs into a final user-facing reply.",
      expertAssignmentKey: teamLead.assignmentKey,
      expertId: teamLead.id,
      expertName: teamLead.name,
      id: "team-lead-final",
      kind: "deliver",
      roleType: teamLead.roleType,
      status: "in_progress",
    },
    "lead"
  );

  const synthesisMessages: ChatMessage[] = [
    {
      content: buildLeadFinalSynthesisPacket({
        completedTasks,
        hasCjk,
        planSummary,
        review,
        teamLead,
        userRequest,
      }),
      role: "user",
    },
  ];

  const options: AgentLoopOptions = {
    maxOutputTokens: resolvedModel.maxOutputTokens,
    modelSelection: teamLead.preferredModelId?.trim() || modelSelection,
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
    agentSystemAppend: appendTeamLanguageRule(settings, teamLead.systemPrompt),
    composerMode: "agent",
    deferredToolState,
    extraReadableRoots,
    hostWebContentsId: hostWebContentsId?? null,
    onDeferredToolStateChange,
    onToolResultReplacementStateChange,
    signal,
    teamToolRoleScope: teamLeadScope,
    thinkingLevel,
    threadId,
    toolHooks,
    toolPoolOverride: [],
    toolResultReplacementState,
    workspaceLspManager,
    workspaceRoot,
  };

  if (
    teamLead.preferredModelId?.trim() &&
    teamLead.preferredModelId.trim()!== modelSelection
  ) {
    const resolved = resolveModelRequest(
      settings,
      teamLead.preferredModelId.trim()
    );
    if (resolved.ok) {
      options.modelSelection = teamLead.preferredModelId.trim();
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

  let collectedText = "";
  const handlers: AgentLoopHandlers = {
    onDone: (text, usage) => {
      collectedText = text;
      emit({
        teamRoleScope: teamLeadScope,
        text,
        threadId,
        type: "done",
        usage,
      });
    },
    onError: () => {},
    onTextDelta: (text) => {
      collectedText += text;
      emit({ teamRoleScope: teamLeadScope, text, threadId, type: "delta" });
    },
    onThinkingDelta: (text) => {
      emit({
        teamRoleScope: teamLeadScope,
        text,
        threadId,
        type: "thinking_delta",
      });
    },
    onToolCall: (name, args, toolCallId) => {
      emit({
        args: JSON.stringify(args),
        name,
        teamRoleScope: teamLeadScope,
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
        teamRoleScope: teamLeadScope,
        threadId,
        type: "tool_input_delta",
      });
    },
    onToolProgress: ({ name, phase, detail }) => {
      emit({
        detail,
        name,
        phase,
        teamRoleScope: teamLeadScope,
        threadId,
        type: "tool_progress",
      });
    },
    onToolResult: (name, result, success, toolCallId) => {
      emit({
        name,
        result,
        success,
        teamRoleScope: teamLeadScope,
        threadId,
        toolCallId,
        type: "tool_result",
      });
    },
  };

  try {
    await runAgentLoop(settings, synthesisMessages, options, handlers);
  } catch {
    // fall through to deterministic fallback
  }

  const narrative =
    extractTeamLeadNarrative(collectedText) ||
    normalizeTeamAgentSummary(collectedText, "");
  return narrative.trim();
}

function buildTaskDeliveryLine(task: TeamTask): string {
  const parts = [
    `- ${task.expertName}: ${task.description}`,
    `status=${task.status}`,
  ];
  return parts.join(" | ");
}

function buildTeamDeliveryText(params: {
  teamLeadName: string;
  planSummary: string;
  finalSummary: string;
  completedTasks: TeamTask[];
  review: { verdict: "approved" | "revision_needed"; summary: string };
  hasCjkRequest: boolean;
}): string {
  const {
    teamLeadName,
    planSummary,
    finalSummary,
    completedTasks,
    review,
    hasCjkRequest,
  } = params;
  const taskLines =
    completedTasks.length > 0
? completedTasks.map((task) => buildTaskDeliveryLine(task))
: [`- ${hasCjkRequest? "无角色任务。": "No specialist tasks ran."}`];
  const detailNote = hasCjkRequest
? "详细角色输出与分派过程保留在 Team 面板中。"
: "Detailed role outputs and planning history remain in the Team panel.";
  const trimmedFinal = finalSummary.trim();
  const trimmedPlan = planSummary.trim();
  const trimmedReview = review.summary.trim();
  const leadBody =
    trimmedFinal || trimmedPlan || (hasCjkRequest? "(无)": "(none)");
  const leadHeading = hasCjkRequest
? trimmedFinal
? `## ${teamLeadName} 总结`
: "## Planning Summary"
: trimmedFinal
? `## ${teamLeadName}'s Closing`
: "## Planning Summary";
  const sections = [
    "# Team Delivery",
    "",
    `**Lead:** ${teamLeadName}`,
    `**Review:** ${review.verdict === "approved" ? "Approved" : "Revision Needed"}`,
    "",
    leadHeading,
    leadBody,
  ];
  sections.push("", "## Task Status",...taskLines);
  if (!trimmedFinal && trimmedReview) {
    sections.push("", "## Review", clampTeamPacketText(trimmedReview, 1600));
  }
  sections.push("", detailNote);
  return sections.join("\n");
}

// ── Queue sync helper ────────────────────────────────────────────────────

function syncQueueToPending(
  queue: TeamTaskQueue,
  pending: TeamTask[],
  completed: TeamTask[],
  completedIds: Set<string>,
  completedTasksById: Map<string, TeamTask>
): void {
  // Sync newly-completed tasks.
  for (const task of queue.getByStatus("completed")) {
    if (!completedTasksById.has(task.id)) {
      completed.push(task);
      completedTasksById.set(task.id, task);
      completedIds.add(task.id);
    }
  }
  // Sync newly-failed tasks (including cascaded failures).
  for (const task of queue.getByStatus("failed")) {
    if (!completedTasksById.has(task.id)) {
      completed.push(task);
      completedTasksById.set(task.id, task);
    }
  }
  // Sync revision tasks (escalations awaiting replan).
  for (const task of queue.getByStatus("revision")) {
    if (!completedTasksById.has(task.id)) {
      completed.push(task);
      completedTasksById.set(task.id, task);
    }
  }
  // Remove from pending any tasks that are no longer pending/blocked in the queue.
  for (let i = pending.length - 1; i >= 0; i--) {
    const qTask = queue.get(pending[i]!.id);
    if (!qTask || (qTask.status!== "pending" && qTask.status!== "blocked")) {
      pending.splice(i, 1);
    }
  }
  // Add to pending any queue tasks that are pending/blocked but not yet in pending.
  const pendingIds = new Set(pending.map((t) => t.id));
  for (const task of queue.getPendingOrBlocked()) {
    if (!pendingIds.has(task.id)) {
      pending.push(task);
    }
  }
}

async function runTeamLeadQuickAnswer(params: {
  settings: ShellSettings;
  threadId: string;
  teamLead: TeamExpertRuntimeProfile;
  userRequest: string;
  modelSelection: string;
  resolvedModel: TeamOrchestratorInput["resolvedModel"];
  signal: AbortSignal;
  thinkingLevel?: TeamOrchestratorInput["thinkingLevel"];
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  hostWebContentsId?: number | null;
  toolHooks?: ToolExecutionHooks;
  emit: (evt: TeamEmit) => void;
}): Promise<string> {
  const {
    settings,
    threadId,
    teamLead,
    userRequest,
    modelSelection,
    resolvedModel,
    signal,
    thinkingLevel,
    workspaceRoot,
    extraReadableRoots,
    workspaceLspManager,
    hostWebContentsId,
    toolHooks,
    emit,
  } = params;

  const quickRoleScope = {
    teamExpertId: teamLead.id,
    teamExpertName: teamLead.name,
    teamRoleKind: "lead" as const,
    teamRoleType: teamLead.roleType,
    teamTaskId: "team-lead-quick",
  };

  const subMessages: ChatMessage[] = [{ content: userRequest, role: "user" }];

  let finalText = "";

  const options: AgentLoopOptions = {
    maxOutputTokens: resolvedModel.maxOutputTokens,
    modelSelection: teamLead.preferredModelId?.trim() || modelSelection,
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
    agentSystemAppend: appendTeamLanguageRule(settings, teamLead.systemPrompt),
    composerMode: "agent",
    extraReadableRoots,
    hostWebContentsId: hostWebContentsId?? null,
    signal,
    thinkingLevel,
    threadId,
    toolHooks,
    workspaceLspManager,
    workspaceRoot,
  };

  const handlers: AgentLoopHandlers = {
    onDone: (text, usage) => {
      finalText = normalizeTeamAgentSummary(text, finalText);
      emit({
        teamRoleScope: quickRoleScope,
        text,
        threadId,
        type: "done",
        usage,
      });
    },
    onError: (message) => {
      finalText = message;
      emit({ message, teamRoleScope: quickRoleScope, threadId, type: "error" });
    },
    onTextDelta: (text) => {
      finalText += text;
      emit({ teamRoleScope: quickRoleScope, text, threadId, type: "delta" });
    },
    onThinkingDelta: (text) => {
      emit({
        teamRoleScope: quickRoleScope,
        text,
        threadId,
        type: "thinking_delta",
      });
    },
    onToolCall: (name, args, toolCallId) => {
      emit({
        args: JSON.stringify(args),
        name,
        teamRoleScope: quickRoleScope,
        threadId,
        toolCallId,
        type: "tool_call",
      });
    },
    onToolResult: (name, result, success, toolCallId) => {
      emit({
        name,
        result,
        success,
        teamRoleScope: quickRoleScope,
        threadId,
        toolCallId,
        type: "tool_result",
      });
    },
  };

  await runAgentLoop(settings, subMessages, options, handlers);
  return finalText;
}

export {
  buildLeadFinalSynthesisPacket,
  runTeamLeadFinalSynthesis,
  buildTaskDeliveryLine,
  buildTeamDeliveryText,
  syncQueueToPending,
  runTeamLeadQuickAnswer,
};
