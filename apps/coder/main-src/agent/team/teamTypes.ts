import type { AgentUserInputRequest } from "../../../src/agentSessionTypes.js";
import { extractAssistantTextForDisplay } from "../../../src/agentStructuredMessage.js";
import { buildAutoReplyLanguageRuleBlock } from "../../../src/autoReplyLanguageRule.js";
import type { ResolvedModelRequest } from "../../llm/modelResolve.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type { ShellSettings, TeamRoleType } from "../../settingsStore.js";
import type {
  ChatMessage,
  DeferredToolState,
  TeamSessionSnapshot,
} from "../../threadStore.js";
import type { TeamEscalation } from "../teamEscalateTool.js";
import type { TeamExpertRuntimeProfile } from "../teamExpertProfiles.js";
import type {
  TeamPlanDecideTask,
  TeamPlanTaskKind,
} from "../teamPlanDecideTool.js";
import type { ToolExecutionHooks } from "../toolExecutor.js";

export type TeamPhase =
  | "researching"
  | "planning"
  | "preflight"
  | "proposing"
  | "executing"
  | "reviewing"
  | "synthesizing"
  | "delivering"
  | "cancelled";

export type TeamTaskStatus =
  | "pending"
  | "blocked"
  | "in_progress"
  | "completed"
  | "failed"
  | "revision";

export type SpecialistRunResult = {
  success: boolean;
  text: string;
  escalation?: TeamEscalation;
};

export type PeerMailboxRequest = {
  requestId: string;
  fromTaskId: string;
  fromExpertId: string;
  fromExpertName: string;
  fromRoleType: TeamRoleType;
  question: string;
  resolve: (answer: string) => void;
  deliveredCount: number;
  timer: ReturnType<typeof setTimeout> | null;
};

export type TeamTask = {
  id: string;
  expertId: string;
  expertAssignmentKey?: string;
  expertName: string;
  roleType: TeamRoleType;
  description: string;
  status: TeamTaskStatus;
  dependencies: string[];
  acceptanceCriteria: string[];
  kind: TeamPlanTaskKind;
  result?: string;
};

export type TeamRoleScope = {
  teamTaskId: string;
  teamExpertId: string;
  teamRoleKind: "specialist" | "reviewer" | "lead";
  teamExpertName: string;
  teamRoleType: TeamRoleType;
};

export type TeamEmit =
  | { threadId: string; type: "team_phase"; phase: TeamPhase }
  | {
      threadId: string;
      type: "delta";
      text: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "tool_input_delta";
      name: string;
      partialJson: string;
      index: number;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "thinking_delta";
      text: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "tool_progress";
      name: string;
      phase: string;
      detail?: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "tool_call";
      name: string;
      args: string;
      toolCallId: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "tool_result";
      name: string;
      result: string;
      success: boolean;
      toolCallId: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "done";
      text: string;
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
      };
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "error";
      message: string;
      teamRoleScope: TeamRoleScope;
    }
  | {
      threadId: string;
      type: "team_task_created";
      task: {
        id: string;
        expertId: string;
        expertAssignmentKey?: string;
        expertName: string;
        roleType: TeamRoleType;
        description: string;
        status: TeamTaskStatus;
        dependencies?: string[];
        acceptanceCriteria?: string[];
      };
    }
  | {
      threadId: string;
      type: "team_expert_started";
      taskId: string;
      expertId: string;
    }
  | {
      threadId: string;
      type: "team_expert_progress";
      taskId: string;
      expertId: string;
      message?: string;
      delta?: string;
    }
  | {
      threadId: string;
      type: "team_expert_done";
      taskId: string;
      expertId: string;
      success: boolean;
      result: string;
    }
  | {
      threadId: string;
      type: "team_review";
      verdict: "approved" | "revision_needed";
      summary: string;
    }
  | { threadId: string; type: "team_lead_final"; summary: string }
  | { threadId: string; type: "team_plan_summary"; summary: string }
  | {
      threadId: string;
      type: "team_preflight_review";
      verdict: "ok" | "needs_clarification";
      summary: string;
    }
  | {
      threadId: string;
      type: "user_input_request";
      request: AgentUserInputRequest;
    }
  | {
      threadId: string;
      type: "team_plan_proposed";
      proposalId: string;
      summary: string;
      tasks: Array<{
        expert: string;
        expertName: string;
        roleType: TeamRoleType;
        task: string;
        dependencies?: string[];
        acceptanceCriteria?: string[];
      }>;
      preflightSummary?: string;
      preflightVerdict?: "ok" | "needs_clarification";
    }
  | {
      threadId: string;
      type: "team_plan_decision";
      proposalId: string;
      approved: boolean;
    }
  | {
      threadId: string;
      type: "team_plan_revised";
      revisionId: string;
      summary: string;
      reason: string;
      tasks: Array<{
        id: string;
        expertId: string;
        expert: string;
        expertAssignmentKey?: string;
        expertName: string;
        roleType: TeamRoleType;
        task: string;
        dependencies?: string[];
        acceptanceCriteria?: string[];
      }>;
      addedTaskIds: string[];
      removedTaskIds: string[];
      keptTaskIds: string[];
    };

export function createTeamRoleScope(
  task: TeamTask,
  roleKind: "specialist" | "reviewer" | "lead"
): TeamRoleScope {
  return {
    teamExpertId: task.expertId,
    teamExpertName: task.expertName,
    teamRoleKind: roleKind,
    teamRoleType: task.roleType,
    teamTaskId: task.id,
  };
}

export function buildReviewerWorkflowTask(
  reviewer: TeamExpertRuntimeProfile,
  description: string,
  dependencies: string[],
  acceptanceCriteria: string[]
): TeamTask {
  return {
    acceptanceCriteria,
    dependencies,
    description,
    expertAssignmentKey: reviewer.assignmentKey,
    expertId: reviewer.id,
    expertName: reviewer.name,
    id: `reviewer-${reviewer.assignmentKey || reviewer.id}`,
    kind: "deliver",
    roleType: reviewer.roleType,
    status: "in_progress",
  };
}

export function normalizeTeamAgentSummary(raw: string, fallback: string): string {
  return extractAssistantTextForDisplay(raw, fallback);
}

export function appendTeamLanguageRule(
  settings: ShellSettings,
  prompt?: string
): string {
  const lang = settings.language ?? "fr";
  const ruleBlock = buildAutoReplyLanguageRuleBlock(lang, lang);
  const extra = String(prompt ?? "").trim();
  return extra ? `${ruleBlock}\n\n---\n\n${extra}` : ruleBlock;
}

export type TeamOrchestratorInput = {
  settings: ShellSettings;
  threadId: string;
  messages: ChatMessage[];
  modelSelection: string;
  resolvedModel: ResolvedModelRequest & { ok: true };
  agentSystemAppend?: string;
  signal: AbortSignal;
  thinkingLevel?: "off" | "low" | "medium" | "high" | "max";
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
  onDone: (
    fullText: string,
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    },
    teamSnapshot?: TeamSessionSnapshot
  ) => void;
  onError: (message: string) => void;
};

export type LLMPlannedTask = {
  expert: string;
  task: string;
  kind: TeamPlanTaskKind;
  dependencies?: string[];
  acceptanceCriteria?: string[];
};

export type LeadPlanMode = "ANSWER" | "PLAN" | "CLARIFY";

export function toLlmPlannedTasks(tasks: TeamPlanDecideTask[]): LLMPlannedTask[] {
  return tasks.map((task) => ({
    acceptanceCriteria: task.acceptanceCriteria ?? [],
    dependencies: task.dependencies ?? [],
    expert: task.expert,
    kind: task.kind ?? "deliver",
    task: task.task,
  }));
}

