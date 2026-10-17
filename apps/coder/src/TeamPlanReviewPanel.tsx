import { useLayoutEffect, useState } from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import type { TeamPlanProposalState } from "./hooks/useTeamSession";
import { useI18n } from "./i18n";
import { TeamRoleAvatar } from "./TeamRoleAvatar";
import { normalizeTeamLeaderText } from "./teamChatTimeline";

type Props = {
  proposal: TeamPlanProposalState;
  onApprove: (feedback?: string) => void;
  onReject: (feedback?: string) => void;
  hideSummary?: boolean;
  onHeightMayChange?: () => void;
};

function sanitizeCriteria(criteria?: readonly string[]): string[] {
  if (!criteria || criteria.length === 0) {
    return [];
  }
  return criteria.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function TeamPlanReviewPanel({
  proposal,
  onApprove,
  onReject,
  hideSummary = false,
  onHeightMayChange,
}: Props) {
  const { t } = useI18n();
  const [showPreflight, setShowPreflight] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [feedback, setFeedback] = useState("");
  const decided = !proposal.awaitingApproval;
  const needsClarification =
    proposal.preflightVerdict === "needs_clarification";
  const summary = normalizeTeamLeaderText(proposal.summary);
  const decisionLabel =
    proposal.decision === "approved"
      ? t("team.plan.decisionApproved")
      : proposal.decision === "rejected"
        ? t("team.plan.decisionRejected")
        : "";

  useLayoutEffect(() => {
    onHeightMayChange?.();
  }, [
    onHeightMayChange,
    showPreflight,
    showTasks,
    hideSummary,
    summary,
    proposal.proposalId,
    proposal.preflightVerdict,
    proposal.awaitingApproval,
    proposal.decision,
    proposal.tasks.length,
    Boolean(proposal.preflightSummary?.trim()),
  ]);

  return (
    <div
      aria-label={t("team.plan.aria")}
      className="ref-plan-review ref-team-plan-review"
      role="region"
    >
      <div className="ref-plan-review-head">
        <div className="ref-plan-review-head-left">
          <span className="ref-plan-review-label">{t("team.plan.label")}</span>
          {proposal.preflightVerdict ? (
            <span
              className={`ref-team-plan-verdict ref-team-plan-verdict--${proposal.preflightVerdict}`}
            >
              {proposal.preflightVerdict === "ok"
                ? t("team.plan.preflightOk")
                : t("team.plan.preflightNeedsClarification")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="ref-plan-review-body">
        {!hideSummary && summary ? (
          <div className="ref-plan-review-overview">
            <ChatMarkdown content={summary} />
          </div>
        ) : null}

        {proposal.preflightSummary?.trim() ? (
          <div className="ref-plan-review-full-toggle">
            <button
              aria-expanded={showPreflight}
              className="ref-plan-review-full-btn"
              onClick={() => setShowPreflight((v) => !v)}
              type="button"
            >
              {t("team.plan.preflightHeading")}
              <svg
                aria-hidden
                className={`ref-plan-review-chev ${showPreflight ? "is-open" : ""}`}
                fill="none"
                height="12"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="12"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>
            {showPreflight ? (
              <div className="ref-plan-review-md">
                <ChatMarkdown content={proposal.preflightSummary} />
              </div>
            ) : null}
          </div>
        ) : null}

        {!decided && needsClarification ? (
          <div className="ref-plan-review-overview">
            {t("team.plan.needsClarificationHint")}
          </div>
        ) : null}

        {proposal.tasks.length > 0 ? (
          <div className="ref-plan-review-todos">
            <button
              className="ref-plan-review-todos-head"
              onClick={() => setShowTasks((v) => !v)}
              type="button"
            >
              <span>
                {t("team.plan.tasks", { count: proposal.tasks.length })}
              </span>
              <svg
                aria-hidden
                className={`ref-plan-review-chev ${showTasks ? "is-open" : ""}`}
                fill="none"
                height="12"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="12"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>
            {showTasks ? (
              <div className="ref-plan-review-todos-list">
                {proposal.tasks.map((task, idx) => {
                  const criteria = sanitizeCriteria(task.acceptanceCriteria);
                  return (
                    <div
                      className="ref-team-plan-task"
                      key={`${task.expert}-${idx}`}
                    >
                      <TeamRoleAvatar
                        assignmentKey={task.expert}
                        roleType={task.roleType}
                      />
                      <div className="ref-team-plan-task-body">
                        <div className="ref-team-plan-task-head">
                          <span className="ref-team-plan-task-name">
                            {task.expertName}
                          </span>
                          <span className="ref-team-plan-task-role">
                            {task.expert}
                          </span>
                        </div>
                        <div className="ref-team-plan-task-desc">
                          {task.task}
                        </div>
                        {criteria.length > 0 ? (
                          <ul className="ref-team-plan-task-criteria">
                            {criteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {decided ? null : (
          <label className="ref-team-plan-feedback">
            <span className="ref-team-plan-feedback-label">
              {t("team.plan.feedbackLabel")}
            </span>
            <textarea
              className="ref-team-plan-feedback-input"
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t("team.plan.feedbackPlaceholder")}
              rows={2}
              value={feedback}
            />
          </label>
        )}
      </div>

      <div className="ref-plan-review-foot ref-team-plan-review-foot">
        {decided ? (
          <div className="ref-plan-review-built">{decisionLabel}</div>
        ) : (
          <>
            <button
              className="ref-team-plan-btn ref-team-plan-btn--ghost"
              onClick={() => onReject(feedback.trim() || undefined)}
              type="button"
            >
              {needsClarification
                ? t("team.plan.rejectForClarification")
                : t("team.plan.reject")}
            </button>
            <button
              className="ref-plan-review-build ref-team-plan-btn--primary"
              disabled={needsClarification}
              onClick={() => onApprove(feedback.trim() || undefined)}
              title={
                needsClarification
                  ? t("team.plan.approveDisabledReason")
                  : undefined
              }
              type="button"
            >
              {needsClarification
                ? t("team.plan.approveBlocked")
                : t("team.plan.approve")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
