import type { AgentToolDef, ToolCall, ToolResult } from "./agentTools.js";

export type TeamPeerReply = {
  requestId: string;
  answer: string;
};

type TeamPeerReplyRuntime = {
  onReply: (payload: TeamPeerReply) => void;
};

const runtimes = new Map<string, TeamPeerReplyRuntime>();

export const teamReplyToPeerTool: AgentToolDef = {
  description:
    "Reply to a pending peer collaboration request while you are still working on your task.",
  name: "team_reply_to_peer",
  parameters: {
    properties: {
      answer: {
        description: "A concise answer for the requesting teammate.",
        type: "string",
      },
      requestId: {
        description: "The request id from the peer mailbox prompt.",
        type: "string",
      },
    },
    required: ["requestId", "answer"],
    type: "object",
  },
};

export function setTeamPeerReplyRuntime(
  taskId: string,
  next: TeamPeerReplyRuntime | null
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

export function normalizeTeamPeerReplyArgs(
  raw: Record<string, unknown>
): { ok: true; reply: TeamPeerReply } | { ok: false; error: string } {
  const requestId = String(raw.requestId ?? "").trim();
  const answer = String(raw.answer ?? "").trim();
  if (!requestId || !answer) {
    return {
      error: "Error: team_reply_to_peer requires both requestId and answer.",
      ok: false,
    };
  }
  return {
    ok: true,
    reply: {
      answer,
      requestId,
    },
  };
}

export async function executeTeamReplyToPeerTool(
  call: ToolCall,
  teamTaskId?: string
): Promise<ToolResult> {
  const runtime = teamTaskId ? (runtimes.get(teamTaskId) ?? null) : null;
  if (!runtime) {
    return {
      content:
        "team_reply_to_peer is only available for an active Team specialist task.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const normalized = normalizeTeamPeerReplyArgs(call.arguments);
  if (!normalized.ok) {
    return {
      content: normalized.error,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  runtime.onReply(normalized.reply);
  return {
    content: `Peer reply recorded for ${normalized.reply.requestId}.`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
