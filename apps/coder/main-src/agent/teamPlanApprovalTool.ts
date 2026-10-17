export type TeamPlanApprovalPayload = {
  approved: boolean;
  feedbackText?: string;
};

const waiters = new Map<string, (payload: TeamPlanApprovalPayload) => void>();

function threadPrefix(threadId: string): string {
  return `tpa:${threadId}:`;
}

export function registerTeamPlanApprovalWaiter(
  proposalId: string,
  resolve: (payload: TeamPlanApprovalPayload) => void
): void {
  waiters.set(proposalId, resolve);
}

export function unregisterTeamPlanApprovalWaiter(proposalId: string): void {
  waiters.delete(proposalId);
}

export function resolveTeamPlanApproval(
  proposalId: string,
  payload: TeamPlanApprovalPayload
): boolean {
  const w = waiters.get(proposalId);
  if (!w) return false;
  waiters.delete(proposalId);
  w(payload);
  return true;
}

export function abortTeamPlanApprovalForThread(threadId: string): void {
  const prefix = threadPrefix(threadId);
  for (const id of [...waiters.keys()]) {
    if (!id.startsWith(prefix)) continue;
    const w = waiters.get(id);
    waiters.delete(id);
    w?.({ approved: false, feedbackText: "(aborted by user)" });
  }
}

export function buildTeamPlanProposalId(threadId: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${threadPrefix(threadId)}${Date.now().toString(36)}-${rand}`;
}
