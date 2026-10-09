import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

export type TeamPlanDecideMode = "ANSWER" | "CLARIFY" | "PLAN";

export type TeamPlanTaskKind = "discuss" | "deliver";

export type TeamPlanDecideTask = {
  expert: string;
  task: string;
  kind?: TeamPlanTaskKind;
  dependencies?: string[];
  acceptanceCriteria?: string[];
};

export type TeamPlanDecision = {
  mode: TeamPlanDecideMode;
  tasks: TeamPlanDecideTask[];
  replyToUser?: string;
};

type TeamPlanDecideRuntime = {
  onDecision: (decision: TeamPlanDecision) => void;
};

const runtimes = new Map<string, TeamPlanDecideRuntime>();

export const teamPlanDecideTool: AgentToolDef = {
  description:
    "Submit the planning decision. MUST be called exactly once before the planning turn ends.",
  name: "team_plan_decide",
  parameters: {
    properties: {
      mode: {
        description: "Decision mode for this planning turn.",
        enum: ["ANSWER", "CLARIFY", "PLAN"],
        type: "string",
      },
      replyToUser: {
        description: "User-visible reply when mode is ANSWER or CLARIFY.",
        type: "string",
      },
      tasks: {
        description: "Structured specialist tasks when mode is PLAN.",
        items: {
          properties: {
            acceptanceCriteria: {
              description: "Optional acceptance criteria for the task.",
              items: { type: "string" },
              type: "array",
            },
            dependencies: {
              description:
                "Optional dependency keys referencing other tasks in the same decision.",
              items: { type: "string" },
              type: "array",
            },
            expert: {
              description: "Specialist assignment key to route the task to.",
              type: "string",
            },
            kind: {
              description:
                'Task intent. Use "discuss" when the user wants ideas / perspectives / analysis and NO file changes. Use "deliver" when the user wants concrete implementation output.',
              enum: ["discuss", "deliver"],
              type: "string",
            },
            task: {
              description: "Concrete task description for the specialist.",
              type: "string",
            },
          },
          required: ["expert", "task"],
          type: "object",
        },
        type: "array",
      },
    },
    required: ["mode"],
    type: "object",
  },
};

export function setTeamPlanDecideRuntime(
  taskId: string,
  next: TeamPlanDecideRuntime | null
): void {
  if (!taskId) {
    return;
  }
  if (next) {
    runtimes.set(taskId, next);
  } else {
    runtimes.delete(taskId);
  }
}

function normalizeTaskKind(raw: unknown): TeamPlanTaskKind {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return value === "discuss" ? "discuss" : "deliver";
}

function normalizeTask(item: unknown): TeamPlanDecideTask | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }
  const raw = item as Record<string, unknown>;
  const expert = String(raw.expert ?? "").trim();
  const task = String(raw.task ?? "").trim();
  if (!expert || !task) {
    return null;
  }
  return {
    acceptanceCriteria: Array.isArray(raw.acceptanceCriteria)
      ? raw.acceptanceCriteria
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
      : [],
    dependencies: Array.isArray(raw.dependencies)
      ? raw.dependencies
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
      : [],
    expert,
    kind: normalizeTaskKind(raw.kind),
    task,
  };
}

export function normalizeTeamPlanDecisionArgs(
  raw: Record<string, unknown>
): { ok: true; decision: TeamPlanDecision } | { ok: false; error: string } {
  const mode = String(raw.mode ?? "")
    .trim()
    .toUpperCase() as TeamPlanDecideMode;
  if (mode !== "ANSWER" && mode !== "CLARIFY" && mode !== "PLAN") {
    return {
      error: "Error: team_plan_decide.mode must be ANSWER, CLARIFY, or PLAN.",
      ok: false,
    };
  }
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .map(normalizeTask)
        .filter((task): task is TeamPlanDecideTask => Boolean(task))
    : [];
  const replyToUser = String(raw.replyToUser ?? "").trim();
  if (mode === "PLAN" && tasks.length === 0) {
    return {
      error:
        "Error: team_plan_decide requires at least one task when mode is PLAN.",
      ok: false,
    };
  }
  if ((mode === "ANSWER" || mode === "CLARIFY") && !replyToUser) {
    return {
      error:
        "Error: team_plan_decide.replyToUser is required when mode is ANSWER or CLARIFY.",
      ok: false,
    };
  }
  return {
    decision: {
      mode,
      replyToUser: replyToUser || undefined,
      tasks,
    },
    ok: true,
  };
}

export async function executeTeamPlanDecideTool(
  call: ToolCall,
  teamTaskId?: string
): Promise<ToolResult> {
  const runtime = teamTaskId ? (runtimes.get(teamTaskId) ?? null) : null;
  if (!runtime) {
    return {
      content: "team_plan_decide is only available during Team planning.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const normalized = normalizeTeamPlanDecisionArgs(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  runtime.onDecision(normalized.decision);
  return {
    content: `Planning decision recorded: ${normalized.decision.mode}.`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
