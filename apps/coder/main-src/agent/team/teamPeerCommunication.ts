import type { ChatMessage } from "../../threadStore.js";
import type { TeamPeerRequest } from "../teamPeerRequestTool.js";
import type { PeerMailboxRequest, TeamTask } from "./teamTypes.js";
import {
  clampTeamPacketText,
  normalizeTeamTaskKey,
  TEAM_HANDOFF_TEXT_LIMIT,
} from "./teamUtils.js";

export function findPeerTask(
  allTasks: TeamTask[],
  targetExpertId: string
): TeamTask | undefined {
  const key = normalizeTeamTaskKey(targetExpertId);
  return allTasks.find((task) =>
    [task.expertId, task.expertAssignmentKey, task.expertName, task.roleType]
      .map(normalizeTeamTaskKey)
      .includes(key)
  );
}

export function buildPeerResponse(
  request: TeamPeerRequest,
  completedTasksById: Map<string, TeamTask>,
  allTasks: TeamTask[]
): string {
  const targetTask = findPeerTask(allTasks, request.targetExpertId);
  if (!targetTask) {
    return `No peer specialist matched "${request.targetExpertId}".`;
  }
  const completedTask = completedTasksById.get(targetTask.id);
  if (!completedTask) {
    return `${targetTask.expertName} has not completed their task yet. Only completed peer handoffs are available right now.`;
  }
  return [
    `Peer: ${completedTask.expertName} (${completedTask.roleType})`,
    `Peer task: ${completedTask.description}`,
    `Your question: ${request.question}`,
    "Peer output:",
    clampTeamPacketText(completedTask.result, TEAM_HANDOFF_TEXT_LIMIT),
  ].join("\n");
}

export function buildPeerMailboxMessages(
  requests: PeerMailboxRequest[],
  task: TeamTask
): ChatMessage[] {
  if (requests.length === 0) {
    return [];
  }
  const body = requests
    .map((request) =>
      [
        `### Request ${request.requestId}`,
        `From: ${request.fromExpertName} (${request.fromRoleType})`,
        `Question: ${request.question}`,
      ].join("\n")
    )
    .join("\n\n");
  return [
    {
      content: [
        "[TEAM PEER REQUESTS]",
        `While you continue ${task.description}, teammates need short answers from you.`,
        "Before continuing, call `team_reply_to_peer` for each requestId below with a concise answer based on your current findings.",
        "If you do not know yet, say what is missing or what assumption the teammate should use.",
        "",
        body,
      ].join("\n"),
      role: "user",
    },
  ];
}

export function appendTeamClarificationMessage(
  messages: ChatMessage[],
  answer: string
): ChatMessage[] {
  return [
    ...messages,
    {
      content: [
        "[TEAM CLARIFICATION ANSWER]",
        answer,
        "",
        "Continue Team planning using this answer. Do not ask the same clarification again.",
      ].join("\n"),
      role: "user",
    },
  ];
}

export function appendEffectiveTeamClarification(
  userText: string,
  answer: string
): string {
  return [userText.trim(), "", "[TEAM CLARIFICATION ANSWER]", answer.trim()]
    .join("\n")
    .trim();
}

export function applyTeamClarificationAnswers(
  userText: string,
  messages: ChatMessage[],
  answers: string[]
): { userText: string; messages: ChatMessage[] } {
  let nextUserText = userText;
  let nextMessages = messages;
  for (const rawAnswer of answers) {
    const answer = rawAnswer.trim();
    if (!answer) {
      continue;
    }
    nextUserText = appendEffectiveTeamClarification(nextUserText, answer);
    nextMessages = appendTeamClarificationMessage(nextMessages, answer);
  }
  return { messages: nextMessages, userText: nextUserText };
}
