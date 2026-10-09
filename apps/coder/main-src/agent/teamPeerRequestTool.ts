import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

export type TeamPeerRequest = {
  targetExpertId: string;
  question: string;
};

type TeamPeerRequestRuntime = {
  onRequest: (payload: TeamPeerRequest) => Promise<string>;
};

const runtimes = new Map<string, TeamPeerRequestRuntime>();

export const teamRequestFromPeerTool: AgentToolDef = {
  description:
    "Ask another specialist from the same Team session for information. MVP: only completed peer outputs are guaranteed.",
  name: "team_request_from_peer",
  parameters: {
    properties: {
      question: {
        description: "Concrete question for the peer specialist.",
        type: "string",
      },
      targetExpertId: {
        description: "Target specialist assignment key or expert id.",
        type: "string",
      },
    },
    required: ["targetExpertId", "question"],
    type: "object",
  },
};

export function setTeamPeerRequestRuntime(
  taskId: string,
  next: TeamPeerRequestRuntime | null
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

export function normalizeTeamPeerRequestArgs(
  raw: Record<string, unknown>
): { ok: true; request: TeamPeerRequest } | { ok: false; error: string } {
  const targetExpertId = String(raw.targetExpertId ?? "").trim();
  const question = String(raw.question ?? "").trim();
  if (!targetExpertId || !question) {
    return {
      error:
        "Error: team_request_from_peer requires both targetExpertId and question.",
      ok: false,
    };
  }
  return {
    ok: true,
    request: {
      question,
      targetExpertId,
    },
  };
}

export async function executeTeamPeerRequestTool(
  call: ToolCall,
  teamTaskId?: string
): Promise<ToolResult> {
  const runtime = teamTaskId ? (runtimes.get(teamTaskId) ?? null) : null;
  if (!runtime) {
    return {
      content:
        "team_request_from_peer is only available in Team specialist sessions.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const normalized = normalizeTeamPeerRequestArgs(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  return {
    content: await runtime.onRequest(normalized.request),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
