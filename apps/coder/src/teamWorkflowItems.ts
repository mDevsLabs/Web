import type {
  TeamRoleType,
  TeamRoleWorkflowState,
  TeamSessionState,
  TeamTaskStatus,
} from "./hooks/useTeamSession";

export type TeamWorkflowListItem = {
  id: string;
  expertId: string;
  expertAssignmentKey?: string;
  expertName: string;
  roleType: TeamRoleType;
  description: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  status: TeamTaskStatus;
  result?: string;
  logs: string[];
  roleKind: "specialist" | "reviewer";
  workflow: TeamRoleWorkflowState | null;
};

function buildProposalTaskId(index: number, expertName: string): string {
  const normalizedName = expertName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `team-plan-proposal-${index}${normalizedName ? `-${normalizedName}` : ""}`;
}

export function buildTeamWorkflowItems(
  session: TeamSessionState | null
): TeamWorkflowListItem[] {
  if (!session) {
    return [];
  }
  const specialistItems: TeamWorkflowListItem[] =
    session.tasks.length > 0
      ? session.tasks.map((task) => ({
          acceptanceCriteria: task.acceptanceCriteria ?? [],
          dependencies: task.dependencies,
          description: task.description,
          expertAssignmentKey: task.expertAssignmentKey,
          expertId: task.expertId,
          expertName: task.expertName,
          id: task.id,
          logs: task.logs,
          result: task.result,
          roleKind: "specialist",
          roleType: task.roleType,
          status: task.status,
          workflow: session.roleWorkflowByTaskId[task.id] ?? null,
        }))
      : (session.planProposal?.tasks ?? []).map((task, index) => ({
          acceptanceCriteria: task.acceptanceCriteria ?? [],
          dependencies: task.dependencies ?? [],
          description: task.task,
          expertAssignmentKey: task.expert,
          expertId: task.expert,
          expertName: task.expertName,
          id: buildProposalTaskId(index, task.expertName),
          logs: [],
          roleKind: "specialist",
          roleType: task.roleType,
          status: "pending",
          workflow: null,
        }));
  const preflightSummary =
    session.planProposal?.preflightSummary?.trim() ||
    session.preflightSummary.trim()
      ? session.planProposal?.preflightSummary?.trim() ||
        session.preflightSummary.trim()
      : "";
  const preflightVerdict =
    session.planProposal?.preflightVerdict ?? session.preflightVerdict;
  const reviewerWorkflow =
    session.reviewerTaskId == null
      ? null
      : (session.roleWorkflowByTaskId[session.reviewerTaskId] ?? null);
  const hasExplicitReviewer = Boolean(
    session.reviewerTaskId || reviewerWorkflow
  );
  if (!hasExplicitReviewer) {
    return specialistItems;
  }
  const reviewerInFinalReview =
    session.phase === "reviewing" ||
    Boolean(session.reviewSummary.trim() || session.reviewVerdict);
  const reviewerDescription = reviewerInFinalReview
    ? "Review specialist results and decide whether the delivery is ready."
    : "Review the user request and the lead proposal before execution begins.";
  const reviewerAcceptanceCriteria = reviewerInFinalReview
    ? [
        "Review all specialist outputs",
        "Decide whether the result is ready to deliver",
      ]
    : [
        "Flag ambiguities or missing requirements before execution starts",
        "Assess whether the role assignments and task split are sensible",
      ];
  const reviewerStatus: TeamTaskStatus = session.reviewVerdict
    ? session.reviewVerdict === "approved"
      ? "completed"
      : "revision"
    : preflightVerdict
      ? preflightVerdict === "ok"
        ? "completed"
        : "revision"
      : reviewerWorkflow?.awaitingReply
        ? "in_progress"
        : "pending";
  const reviewerResult = session.reviewSummary || preflightSummary || undefined;
  const reviewerItem: TeamWorkflowListItem = {
    acceptanceCriteria: reviewerAcceptanceCriteria,
    dependencies: specialistItems.map((item) => item.id),
    description: reviewerDescription,
    expertAssignmentKey: "reviewer",
    expertId: reviewerWorkflow?.expertId ?? "reviewer",
    expertName: reviewerWorkflow?.expertName ?? "Reviewer",
    id: session.reviewerTaskId ?? "team-reviewer",
    logs: reviewerResult ? [reviewerResult] : [],
    result: reviewerResult,
    roleKind: "reviewer",
    roleType: reviewerWorkflow?.roleType ?? "reviewer",
    status: reviewerStatus,
    workflow: reviewerWorkflow,
  };
  return [...specialistItems, reviewerItem];
}

export function getTeamWorkflowItemById(
  session: TeamSessionState | null,
  taskId: string | null | undefined
): TeamWorkflowListItem | null {
  if (!session || !taskId) {
    return null;
  }
  return (
    buildTeamWorkflowItems(session).find((item) => item.id === taskId) ?? null
  );
}
