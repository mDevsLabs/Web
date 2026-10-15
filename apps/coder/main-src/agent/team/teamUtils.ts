import type { AgentUserInputRequest } from "../../../src/agentSessionTypes.js";
import { createRequestUserInputToolHandler } from "../requestUserInputTool.js";
import type { TeamEmit, TeamTask, createTeamRoleScope } from "./teamTypes.js";

export const TEAM_PACKET_TEXT_LIMIT = 4000;
export const TEAM_HANDOFF_TEXT_LIMIT = 2200;

export function normalizeTeamTaskKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function buildPlanTaskSignature(expertKey: string, task: string): string {
  return `${normalizeTeamTaskKey(expertKey)}::${String(task ?? "").trim()}`;
}

export function buildPlanTaskSignatureFromTask(task: TeamTask): string {
  return buildPlanTaskSignature(
    task.expertAssignmentKey || task.expertId,
    task.description
  );
}

export function clampTeamPacketText(
  text: string | undefined,
  maxChars = TEAM_PACKET_TEXT_LIMIT
): string {
  const normalized = String(text ?? "").trim();
  if (!normalized) {
    return "(none)";
  }
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 32)).trimEnd()}\n\n[truncated for team context]`;
}

export function formatAcceptanceCriteria(criteria: string[]): string {
  if (criteria.length === 0) {
    return "- (none provided)";
  }
  return criteria.map((item) => `- ${item}`).join("\n");
}

export async function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return;
  }
  if (signal.aborted) {
    throw new Error("Team session aborted by user.");
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Team session aborted by user."));
    };
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function buildTeamUserInputHandlers(params: {
  threadId: string;
  signal: AbortSignal;
  emit: (evt: TeamEmit) => void;
  teamRoleScope: ReturnType<typeof createTeamRoleScope>;
  agentId: string;
  agentTitle: string;
}) {
  return {
    request_user_input: createRequestUserInputToolHandler(
      {
        agentId: params.agentId,
        agentTitle: params.agentTitle,
        emit: (evt) => {
          if (evt.type === "user_input_request" && evt.request) {
            params.emit({
              request: evt.request as AgentUserInputRequest,
              threadId: params.threadId,
              type: "user_input_request",
            });
          }
        },
        signal: params.signal,
        threadId: params.threadId,
      },
      { teamRoleScope: params.teamRoleScope }
    ),
  };
}


