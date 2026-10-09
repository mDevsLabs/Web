import { useEffect, useState } from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import { useI18n } from "./i18n";
import type { ModelPickerItem } from "./ModelPickerDropdown";
import type { ParsedPlan, PlanTodoItem } from "./planParser";
import { VoidSelect } from "./VoidSelect";

type Props = {
  plan: ParsedPlan;
  planFileDisplayPath: string | null;
  initialBuildModelId: string;
  modelItems: ModelPickerItem[];
  /** 当前会话已对该计划文件成功执行 Build */
  planBuilt?: boolean;
  buildDisabled?: boolean;
  onBuild: (modelId: string) => void;
  onClose: () => void;
  onTodoToggle: (id: string) => void;
};

function TodoCheckbox({ checked }: { checked: boolean }) {
  return (
    <svg aria-hidden fill="none" height="16" viewBox="0 0 16 16" width="16">
      <rect
        fill={checked ? "#e8a848" : "none"}
        height="14"
        rx="3"
        stroke={checked ? "#e8a848" : "#555"}
        strokeWidth="1.5"
        width="14"
        x="1"
        y="1"
      />
      {checked ? (
        <path
          d="M4.5 8l2.5 2.5 4.5-5"
          stroke="#1a1a1a"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      ) : null}
    </svg>
  );
}

function TodoItem({
  todo,
  onToggle,
}: {
  todo: PlanTodoItem;
  onToggle: () => void;
}) {
  const done = todo.status === "completed";
  return (
    <button
      className={`ref-plan-todo ${done ? "is-done" : ""}`}
      onClick={onToggle}
      type="button"
    >
      <TodoCheckbox checked={done} />
      <span className="ref-plan-todo-text">{todo.content}</span>
    </button>
  );
}

export function PlanReviewPanel({
  plan,
  planFileDisplayPath,
  initialBuildModelId,
  modelItems,
  planBuilt = false,
  buildDisabled = false,
  onBuild,
  onClose,
  onTodoToggle,
}: Props) {
  const { t } = useI18n();
  const [showTodos, setShowTodos] = useState(true);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [buildModelId, setBuildModelId] = useState(initialBuildModelId);
  const doneCount = plan.todos.filter((t) => t.status === "completed").length;

  useEffect(() => {
    setBuildModelId(initialBuildModelId);
  }, [initialBuildModelId, plan.name]);

  return (
    <div
      aria-label={t("plan.review.aria")}
      className="ref-plan-review"
      role="region"
    >
      <div className="ref-plan-review-head">
        <div className="ref-plan-review-head-left">
          <span className="ref-plan-review-label">
            {t("plan.review.label")}
          </span>
          <button
            aria-label={t("common.close")}
            className="ref-plan-review-close"
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="ref-plan-review-head-model">
          <label
            className="ref-plan-review-model-label"
            htmlFor="ref-plan-build-model"
          >
            {t("plan.review.model")}
          </label>
          <VoidSelect
            ariaLabel={t("plan.review.model")}
            disabled={planBuilt || modelItems.length === 0}
            id="ref-plan-build-model"
            onChange={setBuildModelId}
            options={[
              { disabled: true, label: t("plan.review.pickModel"), value: "" },
              ...modelItems.map((m) => ({ label: m.label, value: m.id })),
            ]}
            value={buildModelId}
            variant="compact"
          />
        </div>
      </div>

      <div className="ref-plan-review-body">
        <div className="ref-plan-review-title">{plan.name}</div>
        {plan.overview ? (
          <p className="ref-plan-review-overview">{plan.overview}</p>
        ) : null}

        {planFileDisplayPath ? (
          <div className="ref-plan-review-file">
            <svg
              aria-hidden
              fill="none"
              height="12"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="12"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="ref-plan-review-file-path">
              {planFileDisplayPath}
            </span>
          </div>
        ) : null}

        <div className="ref-plan-review-full-toggle">
          <button
            aria-expanded={showFullPlan}
            className="ref-plan-review-full-btn"
            onClick={() => setShowFullPlan((v) => !v)}
            type="button"
          >
            {showFullPlan
              ? t("plan.review.fullHide")
              : t("plan.review.fullShow")}
            <svg
              aria-hidden
              className={`ref-plan-review-chev ${showFullPlan ? "is-open" : ""}`}
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
          {showFullPlan ? (
            <div className="ref-plan-review-md">
              <ChatMarkdown content={plan.body} />
            </div>
          ) : null}
        </div>

        {plan.todos.length > 0 ? (
          <div className="ref-plan-review-todos">
            <button
              className="ref-plan-review-todos-head"
              onClick={() => setShowTodos((v) => !v)}
              type="button"
            >
              <span>
                {t("plan.review.todo", {
                  done: doneCount,
                  total: plan.todos.length,
                })}
              </span>
              <svg
                aria-hidden
                className={`ref-plan-review-chev ${showTodos ? "is-open" : ""}`}
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
            {showTodos ? (
              <div className="ref-plan-review-todos-list">
                {plan.todos.map((item) => (
                  <TodoItem
                    key={item.id}
                    onToggle={() => onTodoToggle(item.id)}
                    todo={item}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="ref-plan-review-foot">
        {planBuilt ? (
          <div className="ref-plan-review-built" role="status">
            {t("app.planEditorBuilt")}
          </div>
        ) : (
          <button
            className="ref-plan-review-build"
            disabled={
              buildDisabled || !buildModelId.trim() || modelItems.length === 0
            }
            onClick={() => onBuild(buildModelId)}
            type="button"
          >
            {t("plan.review.build")}
            <kbd className="ref-kbd">Ctrl+&#x21B5;</kbd>
          </button>
        )}
      </div>
    </div>
  );
}
