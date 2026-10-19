import { useState } from "react";
import { useI18n } from "./i18n";

type Props = {
  workspaceOpen: boolean;
  onCancel: () => void;
  onConfirm: (scope: "user" | "project") => void;
};

export function SkillScopeDialog({
  workspaceOpen,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useI18n();
  const [scope, setScope] = useState<"user" | "project">("user");

  const canContinue =
    scope === "user" || (scope === "project" && workspaceOpen);

  return (
    <div
      aria-label={t("skillCreator.scopeAria")}
      className="ref-skill-scope"
      role="dialog"
    >
      <div className="ref-skill-scope-head">
        <span className="ref-skill-scope-title">
          {t("skillCreator.scopeTitle")}
        </span>
      </div>
      <p className="ref-skill-scope-desc">{t("skillCreator.scopeDesc")}</p>
      <div className="ref-skill-scope-options" role="radiogroup">
        <button
          aria-checked={scope === "user"}
          className={`ref-skill-scope-opt ${scope === "user" ? "is-active" : ""}`}
          onClick={() => setScope("user")}
          role="radio"
          type="button"
        >
          <span className="ref-skill-scope-opt-label">
            {t("skillCreator.scopeAllProjects")}
          </span>
          <span className="ref-skill-scope-opt-hint">
            {t("skillCreator.scopeAllHint")}
          </span>
        </button>
        <button
          aria-checked={scope === "project"}
          className={`ref-skill-scope-opt ${scope === "project" ? "is-active" : ""}`}
          disabled={!workspaceOpen}
          onClick={() => workspaceOpen && setScope("project")}
          role="radio"
          title={
            workspaceOpen ? undefined : t("skillCreator.scopeProjectNeedWs")
          }
          type="button"
        >
          <span className="ref-skill-scope-opt-label">
            {t("skillCreator.scopeThisProject")}
          </span>
          <span className="ref-skill-scope-opt-hint">
            {t("skillCreator.scopeProjectHint")}
          </span>
        </button>
      </div>
      <div className="ref-skill-scope-foot">
        <button
          className="ref-skill-scope-btn ref-skill-scope-btn--ghost"
          onClick={onCancel}
          type="button"
        >
          {t("common.cancel")}
        </button>
        <button
          className="ref-skill-scope-btn ref-skill-scope-btn--primary"
          disabled={!canContinue}
          onClick={() => {
            if (canContinue) {
              onConfirm(scope);
            }
          }}
          type="button"
        >
          {t("common.continue")}
        </button>
      </div>
    </div>
  );
}
