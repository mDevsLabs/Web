import { useMemo } from "react";
import type {
  AgentCustomization,
  AgentToolPermissionRule,
  ShellPermissionMode,
  ToolPermissionBehavior,
} from "./agentSettingsTypes";
import { defaultAgentCustomization } from "./agentSettingsTypes";
import { useI18n } from "./i18n";
import {
  getShellPermissionMode,
  shellPermissionModeToAgentPatch,
} from "./shellPermissionMode";
import { VoidSelect } from "./VoidSelect";

function newToolPermRuleId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `tpr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

function removeToolPermissionRuleAt(
  list: AgentToolPermissionRule[],
  index: number
): AgentToolPermissionRule[] {
  const target = list[index];
  if (!target) return list;
  if (target.id) {
    return list.filter((r) => r.id !== target.id);
  }
  return list.filter((_, i) => i !== index);
}

type Props = {
  value: AgentCustomization;
  onChange: (next: AgentCustomization) => void;
};

export function SettingsAgentBehaviorPanel({ value, onChange }: Props) {
  const { t } = useI18n();
  const v = { ...defaultAgentCustomization(), ...value };

  const patch = (p: Partial<AgentCustomization>) => {
    onChange({ ...v, ...p });
  };

  const toolRuleBehaviorOptions = useMemo(
    () => [
      { label: t("agentBehavior.toolRuleAllow"), value: "allow" },
      { label: t("agentBehavior.toolRuleDeny"), value: "deny" },
      { label: t("agentBehavior.toolRuleAsk"), value: "ask" },
    ],
    [t]
  );

  return (
    <div className="ref-settings-panel ref-settings-panel--agent">
      <div className="ref-settings-agent-card ref-settings-agent-card--behavior">
        <div className="ref-settings-agent-card-title">
          {t("agentBehavior.executionTitle")}
        </div>
        <label
          className="ref-settings-field ref-settings-field--compact"
          style={{ marginBottom: 4, marginTop: 12 }}
        >
          <span>{t("agentBehavior.shellPermissionMode")}</span>
          <p
            className="ref-settings-agent-card-desc"
            style={{ margin: "4px 0 8px" }}
          >
            {t("agentBehavior.shellPermissionModeDesc")}
          </p>
          <VoidSelect
            ariaLabel={t("agentBehavior.shellPermissionMode")}
            onChange={(next) =>
              patch(
                shellPermissionModeToAgentPatch(next as ShellPermissionMode)
              )
            }
            options={[
              { label: t("agent.commandPermission.always"), value: "always" },
              { label: t("agent.commandPermission.rules"), value: "rules" },
              {
                label: t("agent.commandPermission.askEvery"),
                value: "ask_every_time",
              },
            ]}
            value={getShellPermissionMode(v)}
          />
        </label>
        {getShellPermissionMode(v) === "rules" ? (
          <div
            className="ref-settings-agent-card-row"
            style={{ marginTop: 12 }}
          >
            <div>
              <div className="ref-settings-agent-card-title">
                {t("agent.settings.skipSafeShell")}
              </div>
              <p className="ref-settings-agent-card-desc">
                {t("agentSettings.safetySkipDesc")}
              </p>
            </div>
            <button
              aria-checked={v.skipSafeShellCommandsConfirm !== false}
              className={`ref-settings-toggle ${v.skipSafeShellCommandsConfirm === false ? "" : "is-on"}`}
              onClick={() =>
                patch({
                  skipSafeShellCommandsConfirm:
                    v.skipSafeShellCommandsConfirm === false ? true : false,
                })
              }
              role="switch"
              type="button"
            >
              <span className="ref-settings-toggle-knob" />
            </button>
          </div>
        ) : null}
        <div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agent.settings.confirmWrites")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("agentSettings.safetyWritesDesc")}
            </p>
          </div>
          <button
            aria-checked={v.confirmWritesBeforeExecute === true}
            className={`ref-settings-toggle ${v.confirmWritesBeforeExecute === true ? "is-on" : ""}`}
            onClick={() =>
              patch({
                confirmWritesBeforeExecute:
                  v.confirmWritesBeforeExecute !== true,
              })
            }
            role="switch"
            type="button"
          >
            <span className="ref-settings-toggle-knob" />
          </button>
        </div>
        <div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agentSettings.backgroundForkTitle")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("agentSettings.backgroundForkDesc")}
            </p>
          </div>
          <button
            aria-checked={v.backgroundForkAgent === true}
            className={`ref-settings-toggle ${v.backgroundForkAgent === true ? "is-on" : ""}`}
            onClick={() =>
              patch({ backgroundForkAgent: v.backgroundForkAgent !== true })
            }
            role="switch"
            type="button"
          >
            <span className="ref-settings-toggle-knob" />
          </button>
        </div>
        <div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agentSettings.mistakeLimitTitle")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("agentSettings.mistakeLimitDesc")}
            </p>
          </div>
          <button
            aria-checked={v.mistakeLimitEnabled !== false}
            className={`ref-settings-toggle ${v.mistakeLimitEnabled === false ? "" : "is-on"}`}
            onClick={() =>
              patch({ mistakeLimitEnabled: v.mistakeLimitEnabled === false })
            }
            role="switch"
            type="button"
          >
            <span className="ref-settings-toggle-knob" />
          </button>
        </div>
        <div
          className="ref-settings-agent-card-row"
          style={{ alignItems: "center", marginTop: 12 }}
        >
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agentSettings.maxMistakesLabel")}
            </div>
          </div>
          <input
            className="ref-settings-agent-number"
            max={30}
            min={2}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (!Number.isFinite(n)) return;
              patch({ maxConsecutiveMistakes: Math.min(30, Math.max(2, n)) });
            }}
            type="number"
            value={v.maxConsecutiveMistakes ?? 5}
          />
        </div>
      </div>

      <div className="ref-settings-agent-card ref-settings-agent-card--behavior">
        <div className="ref-settings-agent-card-title">
          {t("agentBehavior.toolRulesTitle")}
        </div>
        <p className="ref-settings-agent-card-desc" style={{ marginTop: 8 }}>
          {t("agentBehavior.toolRulesDesc")}
        </p>
        {(v.toolPermissionRules ?? []).length === 0 ? (
          <p className="ref-settings-agent-empty" style={{ marginTop: 10 }}>
            {t("agentBehavior.toolRulesEmpty")}
          </p>
        ) : null}
        <ul
          className="ref-settings-agent-list ref-settings-tool-perm-rule-list"
          style={{ marginTop: 12 }}
        >
          {(v.toolPermissionRules ?? []).map((rule, idx) => (
            <li
              className="ref-settings-agent-item ref-settings-tool-perm-rule-item"
              key={rule.id ?? `tp-${idx}`}
            >
              <div className="ref-settings-tool-perm-rule-fields">
                <label
                  className="ref-settings-field ref-settings-field--compact"
                  style={{ flex: "0 1 200px", minWidth: 160 }}
                >
                  <span>{t("agentBehavior.toolRuleBehavior")}</span>
                  <VoidSelect
                    ariaLabel={t("agentBehavior.toolRuleBehavior")}
                    onChange={(next) => {
                      const list = [...(v.toolPermissionRules ?? [])];
                      list[idx] = {
                        ...rule,
                        behavior: next as ToolPermissionBehavior,
                      };
                      patch({ toolPermissionRules: list });
                    }}
                    options={toolRuleBehaviorOptions}
                    value={rule.behavior}
                  />
                </label>
                <label
                  className="ref-settings-field ref-settings-field--compact"
                  style={{ flex: 1, minWidth: 140 }}
                >
                  <span>{t("agentBehavior.toolRuleToolName")}</span>
                  <input
                    onChange={(e) => {
                      const next = [...(v.toolPermissionRules ?? [])];
                      next[idx] = { ...rule, toolName: e.target.value };
                      patch({ toolPermissionRules: next });
                    }}
                    placeholder="Bash"
                    type="text"
                    value={rule.toolName}
                  />
                </label>
              </div>
              <label
                className="ref-settings-field ref-settings-field--compact"
                style={{ marginTop: 8 }}
              >
                <span>{t("agentBehavior.toolRuleContent")}</span>
                <input
                  onChange={(e) => {
                    const next = [...(v.toolPermissionRules ?? [])];
                    next[idx] = {
                      ...rule,
                      ruleContent: e.target.value || undefined,
                    };
                    patch({ toolPermissionRules: next });
                  }}
                  placeholder={t("agentBehavior.toolRuleContentPh")}
                  type="text"
                  value={rule.ruleContent ?? ""}
                />
              </label>
              <div className="ref-settings-tool-perm-rule-footer">
                <button
                  className="ref-settings-tool-perm-rule-delete"
                  onClick={() => {
                    patch({
                      toolPermissionRules: removeToolPermissionRuleAt(
                        v.toolPermissionRules ?? [],
                        idx
                      ),
                    });
                  }}
                  type="button"
                >
                  <IconTrash className="ref-settings-tool-perm-rule-delete-ico" />
                  <span>{t("agentBehavior.toolRuleRemove")}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          className="ref-settings-agent-new-btn"
          onClick={() => {
            const row: AgentToolPermissionRule = {
              behavior: "allow",
              id: newToolPermRuleId(),
              ruleContent: "",
              toolName: "Bash",
            };
            patch({
              toolPermissionRules: [...(v.toolPermissionRules ?? []), row],
            });
          }}
          style={{ marginTop: 10 }}
          type="button"
        >
          {t("agentBehavior.toolRuleAdd")}
        </button>
        <div className="ref-settings-agent-card-row" style={{ marginTop: 16 }}>
          <div>
            <div className="ref-settings-agent-card-title">
              {t("agentBehavior.avoidPromptsTitle")}
            </div>
            <p className="ref-settings-agent-card-desc">
              {t("agentBehavior.avoidPromptsDesc")}
            </p>
          </div>
          <button
            aria-checked={v.shouldAvoidPermissionPrompts === true}
            className={`ref-settings-toggle ${v.shouldAvoidPermissionPrompts === true ? "is-on" : ""}`}
            onClick={() =>
              patch({
                shouldAvoidPermissionPrompts:
                  v.shouldAvoidPermissionPrompts !== true,
              })
            }
            role="switch"
            type="button"
          >
            <span className="ref-settings-toggle-knob" />
          </button>
        </div>
      </div>
    </div>
  );
}
