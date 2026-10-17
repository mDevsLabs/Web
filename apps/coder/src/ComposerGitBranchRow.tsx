import { forwardRef, useCallback } from "react";
import {
  AgentCommandPermissionDropdown,
  type CommandPermissionMode,
} from "./AgentCommandPermissionDropdown";
import {
  useAppShellChromeCore,
  useAppShellGitActions,
  useAppShellGitMeta,
  useAppShellSettings,
} from "./app/appShellContexts";
import { ComposerContextMeter } from "./ComposerContextMeter";
import type { ContextEstimate } from "./contextMeterFormat";
import {
  classifyGitUnavailableReason,
  type GitUnavailableReason,
  gitBranchTriggerTitle,
} from "./gitAvailability";
import { IconChevron, IconGitSCM } from "./icons";
import {
  getShellPermissionMode,
  shellPermissionModeToAgentPatch,
} from "./shellPermissionMode";

export type ComposerContextMeterState = {
  maxTokens: number;
  usedEstimate: ContextEstimate;
  /** 未在设置中填写上下文窗口，UI 使用默认 200K */
  isDefaultMax: boolean;
};

export type ComposerGitBranchRowProps = {
  /** 打开分支菜单前关闭 + / 模型浮层（与原先 App 内联行为一致） */
  onBeforeToggleGitBranchPicker?: () => void;
  /** 当前模型在设置中填写了上下文窗口时由 ChatComposer 传入 */
  contextMeter?: ComposerContextMeterState | null;
};

/**
 * 输入区 Git 分支行：订阅 Git Meta / Settings，不经过 App 的 sharedComposerProps，
 * 避免 fullStatus 等更新时整份 composer props 引用失效。
 */
export const ComposerGitBranchRow = forwardRef<
  HTMLButtonElement,
  ComposerGitBranchRowProps
>(function ComposerGitBranchRow(
  { onBeforeToggleGitBranchPicker, contextMeter },
  ref
) {
  const { shell, t } = useAppShellChromeCore();
  const { gitBranch, gitLines, gitStatusOk, gitBranchPickerOpen } =
    useAppShellGitMeta();
  const { setGitBranchPickerOpen } = useAppShellGitActions();
  const { agentCustomization, setAgentCustomization } = useAppShellSettings();

  const gitUnavailableReason: GitUnavailableReason = gitStatusOk
    ? "none"
    : classifyGitUnavailableReason(gitLines[0]);
  const commandPermissionMode: CommandPermissionMode =
    getShellPermissionMode(agentCustomization);

  const onChangeCommandPermissionMode = useCallback(
    async (mode: CommandPermissionMode) => {
      const patch = shellPermissionModeToAgentPatch(mode);
      setAgentCustomization((prev) => ({ ...prev, ...patch }));
      if (!shell) {
        return;
      }
      await shell.invoke("settings:set", { agent: patch });
    },
    [shell, setAgentCustomization]
  );

  return (
    <div className="ref-composer-git-branch-row">
      <span title={t("agent.commandPermission.settingsHint")}>
        <AgentCommandPermissionDropdown
          alwaysLabel={t("agent.commandPermission.always")}
          ariaLabel={t("agent.commandPermission.aria")}
          askEveryTimeLabel={t("agent.commandPermission.askEvery")}
          disabled={!shell}
          onChange={(mode) => void onChangeCommandPermissionMode(mode)}
          rulesLabel={t("agent.commandPermission.rules")}
          value={commandPermissionMode}
        />
      </span>
      <div className="ref-composer-git-branch-trailing">
        {contextMeter ? (
          <ComposerContextMeter
            isDefaultMax={contextMeter.isDefaultMax}
            maxTokens={contextMeter.maxTokens}
            t={t}
            usedEstimate={contextMeter.usedEstimate}
          />
        ) : null}
        <button
          aria-expanded={gitBranchPickerOpen}
          aria-haspopup="dialog"
          aria-label={`${t("app.tabGit")}: ${gitBranch}`}
          className="ref-composer-git-branch-trigger"
          disabled={!gitStatusOk}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBeforeToggleGitBranchPicker?.();
            if (!gitStatusOk) {
              return;
            }
            setGitBranchPickerOpen((o) => !o);
          }}
          ref={ref}
          title={gitBranchTriggerTitle(t, gitStatusOk, gitUnavailableReason)}
          type="button"
        >
          <IconGitSCM aria-hidden className="ref-composer-git-branch-ico" />
          <span className="ref-composer-git-branch-name">{gitBranch}</span>
          <IconChevron aria-hidden className="ref-composer-git-branch-chev" />
        </button>
      </div>
    </div>
  );
});
