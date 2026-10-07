import { useLayoutEffect } from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import type { TeamPlanRevisionState } from "./hooks/useTeamSession";
import { useI18n } from "./i18n";
import { TeamRoleAvatar } from "./TeamRoleAvatar";

type Props = {
  revision: TeamPlanRevisionState;
  onHeightMayChange?: () => void;
};

export function TeamPlanRevisionCard({ revision, onHeightMayChange }: Props) {
  const { t } = useI18n();

  useLayoutEffect(() => {
    onHeightMayChange?.();
  }, [
    onHeightMayChange,
    revision.revisionId,
    revision.tasks.length,
    revision.summary,
    revision.reason,
  ]);

  return (
    <div
      aria-label={t("team.plan.aria")}
      className="ref-plan-review ref-team-plan-review"
      role="region"
    >
      <div className="ref-plan-review-head">
        <div className="ref-plan-review-head-left">
          <span className="ref-plan-review-label">
            {t("team.plan.revisionLabel")}
          </span>
        </div>
      </div>
      <div className="ref-plan-review-body">
        {revision.summary ? (
          <div className="ref-plan-review-overview">
            <ChatMarkdown content={revision.summary} />
          </div>
        ) : null}
        <div className="ref-plan-review-overview">
          <strong>{t("team.plan.revisionReason")}</strong>
          <div style={{ marginTop: 6 }}>{revision.reason}</div>
        </div>
        <div className="ref-plan-review-overview">
          <strong>{t("team.plan.revisionDelta")}</strong>
          <div style={{ marginTop: 6 }}>
            {t("team.plan.revisionCounts", {
              added: revision.addedTaskIds.length,
              kept: revision.keptTaskIds.length,
              removed: revision.removedTaskIds.length,
            })}
          </div>
        </div>
        {revision.tasks.length > 0 ? (
          <div className="ref-plan-review-todos">
            <div className="ref-plan-review-todos-head">
              <span>
                {t("team.plan.tasks", { count: revision.tasks.length })}
              </span>
            </div>
            <div className="ref-plan-review-todos-list">
              {revision.tasks.map((task) => (
                <div className="ref-team-plan-task" key={task.id}>
                  <TeamRoleAvatar
                    assignmentKey={task.expertAssignmentKey ?? task.expertId}
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
                    <div className="ref-team-plan-task-desc">{task.task}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
