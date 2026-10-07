import { useState } from "react";
import type { AgentRuleScope } from "./agentSettingsTypes";
import { useI18n } from "./i18n";

type Props = {
  onCancel: () => void;
  onConfirm: (ruleScope: AgentRuleScope, globPattern?: string) => void;
};

export function RuleWizardDialog({ onCancel, onConfirm }: Props) {
  const { t } = useI18n();
  const [scope, setScope] = useState<AgentRuleScope>("always");
  const [globPattern, setGlobPattern] = useState("");

  return (
    <div
      aria-label={t("ruleWizard.aria")}
      className="ref-skill-scope"
      role="dialog"
    >
      <div className="ref-skill-scope-head">
        <span className="ref-skill-scope-title">{t("ruleWizard.title")}</span>
      </div>
      <p className="ref-skill-scope-desc">{t("ruleWizard.desc")}</p>
      <div className="ref-skill-scope-options" role="radiogroup">
        <button
          aria-checked={scope === "always"}
          className={`ref-skill-scope-opt ${scope === "always" ? "is-active" : ""}`}
          onClick={() => setScope("always")}
          role="radio"
          type="button"
        >
          <span className="ref-skill-scope-opt-label">
            {t("ruleWizard.always")}
          </span>
          <span className="ref-skill-scope-opt-hint">
            {t("ruleWizard.alwaysHint")}
          </span>
        </button>
        <button
          aria-checked={scope === "glob"}
          className={`ref-skill-scope-opt ${scope === "glob" ? "is-active" : ""}`}
          onClick={() => setScope("glob")}
          role="radio"
          type="button"
        >
          <span className="ref-skill-scope-opt-label">
            {t("ruleWizard.glob")}
          </span>
          <span className="ref-skill-scope-opt-hint">
            {t("ruleWizard.globHint")}
          </span>
        </button>
        <button
          aria-checked={scope === "manual"}
          className={`ref-skill-scope-opt ${scope === "manual" ? "is-active" : ""}`}
          onClick={() => setScope("manual")}
          role="radio"
          type="button"
        >
          <span className="ref-skill-scope-opt-label">
            {t("ruleWizard.manual")}
          </span>
          <span className="ref-skill-scope-opt-hint">
            {t("ruleWizard.manualHint")}
          </span>
        </button>
      </div>
      {scope === "glob" ? (
        <label
          className="ref-settings-field ref-settings-field--compact"
          style={{ marginTop: 12 }}
        >
          <span>{t("ruleWizard.globPattern")}</span>
          <input
            autoComplete="off"
            onChange={(e) => setGlobPattern(e.target.value)}
            placeholder="**/*.ts"
            value={globPattern}
          />
        </label>
      ) : null}
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
          onClick={() =>
            onConfirm(scope, scope === "glob" ? globPattern : undefined)
          }
          type="button"
        >
          {t("ruleWizard.confirm")}
        </button>
      </div>
    </div>
  );
}
