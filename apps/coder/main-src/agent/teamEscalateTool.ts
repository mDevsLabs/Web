import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

export type TeamEscalation = {
  reason: string;
  proposedChange: string;
  blockingEvidence: string[];
};

type TeamEscalationRuntime = {
  onEscalation: (payload: TeamEscalation) => void;
};

const runtimes = new Map<string, TeamEscalationRuntime>();

export const teamEscalateToLeadTool: AgentToolDef = {
  description:
    "Pause the current specialist task and escalate a blocking issue back to the planner for replanning.",
  name: "team_escalate_to_lead",
  parameters: {
    properties: {
      blockingEvidence: {
        description:
          "Concrete evidence such as file paths, missing symbols, or conflicting outputs.",
        items: { type: "string" },
        type: "array",
      },
      proposedChange: {
        description: "Suggested adjustment for the planner to consider.",
        type: "string",
      },
      reason: {
        description: "Why the current task cannot continue safely.",
        type: "string",
      },
    },
    required: ["reason", "proposedChange"],
    type: "object",
  },
};

export function setTeamEscalationRuntime(
  taskId: string,
  next: TeamEscalationRuntime | null
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

export function normalizeTeamEscalationArgs(
  raw: Record<string, unknown>
): { ok: true; escalation: TeamEscalation } | { ok: false; error: string } {
  const reason = String(raw.reason ?? "").trim();
  const proposedChange = String(raw.proposedChange ?? "").trim();
  if (!reason || !proposedChange) {
    return {
      error:
        "Error: team_escalate_to_lead requires both reason and proposedChange.",
      ok: false,
    };
  }
  return {
    escalation: {
      blockingEvidence: Array.isArray(raw.blockingEvidence)
        ? raw.blockingEvidence
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
        : [],
      proposedChange,
      reason,
    },
    ok: true,
  };
}

export async function executeTeamEscalateToLeadTool(
  call: ToolCall,
  teamTaskId?: string
): Promise<ToolResult> {
  const runtime = teamTaskId ? (runtimes.get(teamTaskId) ?? null) : null;
  if (!runtime) {
    return {
      content:
        "team_escalate_to_lead is only available in Team specialist sessions.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const normalized = normalizeTeamEscalationArgs(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  runtime.onEscalation(normalized.escalation);
  return {
    content: "Escalation sent to the planner.",
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
