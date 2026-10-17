import { type KeyboardEvent, memo } from "react";
import { AgentChatPanel, type AgentChatPanelProps } from "../AgentChatPanel";
import { DevProfiler } from "../devProfiler";
import type { TFunction } from "../i18n";
import { IconDoc, IconGitSCM, IconGlobe, IconTeam } from "../icons";
import { AgentWorkspaceLauncher } from "./AgentWorkspaceLauncher";
import type { WorkspaceLauncherTool } from "./workspaceLaunchers";

export type AgentRightSidebarView =
  | "git"
  | "plan"
  | "file"
  | "team"
  | "browser"
  | "agents";

export type AgentAgentCenterColumnProps = {
  t: TFunction;
  hasConversation: boolean;
  workspace: string | null;
  workspaceBasename: string;
  currentThreadTitle: string;
  onPlanNewIdea: (e: KeyboardEvent) => void;
  hasAgentPlanSidebarContent: boolean;
  agentRightSidebarOpen: boolean;
  agentRightSidebarView: AgentRightSidebarView;
  toggleAgentRightSidebarView: (view: AgentRightSidebarView) => void;
  onOpenWorkspaceFolder: (path: string) => void;
  onOpenBrowserWindow: () => void;
  onLaunchWorkspaceWithTool: (tool: WorkspaceLauncherTool) => void;
  chatPanelProps: Omit<AgentChatPanelProps, "layout">;
};

function truncateHeaderTitle(input: string, maxCodePoints = 18): string {
  const chars = Array.from(input.trim());
  return chars.length <= maxCodePoints
    ? input.trim()
    : `${chars.slice(0, Math.max(1, maxCodePoints - 1)).join("")}…`;
}

/** Agent 布局中间列：上下文条 + 右侧栏切换 + 对话面板；memo 以便在 Git 等兄弟域重渲染时跳过本列 reconciliation */
export const AgentAgentCenterColumn = memo(
  function AgentAgentCenterColumn({
    t,
    hasConversation,
    workspace,
    workspaceBasename,
    currentThreadTitle,
    onPlanNewIdea,
    hasAgentPlanSidebarContent,
    agentRightSidebarOpen,
    agentRightSidebarView,
    toggleAgentRightSidebarView,
    onOpenWorkspaceFolder,
    onOpenBrowserWindow,
    onLaunchWorkspaceWithTool,
    chatPanelProps,
  }: AgentAgentCenterColumnProps) {
    const threadMessagesPending =
      chatPanelProps.currentId != null &&
      chatPanelProps.messagesThreadId !== chatPanelProps.currentId;
    const headerTitle = truncateHeaderTitle(currentThreadTitle);

    if (import.meta.env.DEV) {
      console.log(
        `[perf] AgentAgentCenterColumn render: currentId=${chatPanelProps.currentId ?? "null"} msgsThread=${chatPanelProps.messagesThreadId ?? "null"}, hasConv=${hasConversation}`
      );
    }

    return (
      <main
        aria-label={t("app.commandCenter")}
        className={`ref-center ref-center--agent-layout ${
          hasConversation || threadMessagesPending
            ? "ref-center--chat"
            : "ref-center--empty-agent"
        }`}
        onKeyDown={onPlanNewIdea}
      >
        <div className="ref-context-block ref-context-block--agent">
          <div className="ref-context-line">
            <div className="ref-agent-context-pill">
              <span
                className="ref-agent-context-heading"
                title={currentThreadTitle}
              >
                {headerTitle}
              </span>
              <button
                aria-label={
                  workspace
                    ? `${t("ws.openFolder")} ${workspace}`
                    : t("app.noWorkspace")
                }
                className="ref-agent-context-workspace"
                data-tooltip={
                  workspace ? `${t("ws.openFolder")}  ${workspace}` : undefined
                }
                disabled={!workspace}
                onClick={() => {
                  if (workspace) {
                    onOpenWorkspaceFolder(workspace);
                  }
                }}
                type="button"
              >
                {workspace ? workspaceBasename : t("app.noWorkspace")}
              </button>
            </div>
          </div>
        </div>

        <div
          aria-label={t("app.rightSidebarViews")}
          className="ref-agent-rail-toggle-group"
        >
          {hasAgentPlanSidebarContent ? (
            <button
              aria-controls="agent-right-sidebar"
              aria-label={t("app.tabPlan")}
              aria-pressed={
                agentRightSidebarOpen && agentRightSidebarView === "plan"
              }
              className={`ref-agent-rail-toggle ${agentRightSidebarOpen && agentRightSidebarView === "plan" ? "is-open" : ""}`}
              onClick={() => toggleAgentRightSidebarView("plan")}
              title={t("app.tabPlan")}
              type="button"
            >
              <IconDoc />
            </button>
          ) : null}
          <AgentWorkspaceLauncher
            onLaunchTool={onLaunchWorkspaceWithTool}
            t={t}
            workspace={workspace}
          />
          <button
            aria-controls="agent-right-sidebar"
            aria-label={t("agent.session.title")}
            aria-pressed={
              agentRightSidebarOpen && agentRightSidebarView === "agents"
            }
            className={`ref-agent-rail-toggle ${agentRightSidebarOpen && agentRightSidebarView === "agents" ? "is-open" : ""}`}
            onClick={() => toggleAgentRightSidebarView("agents")}
            title={t("agent.session.title")}
            type="button"
          >
            <IconTeam />
          </button>
          <button
            aria-label={t("app.tabBrowser")}
            aria-pressed={false}
            className="ref-agent-rail-toggle"
            onClick={onOpenBrowserWindow}
            title={t("app.tabBrowser")}
            type="button"
          >
            <IconGlobe />
          </button>
          <button
            aria-controls="agent-right-sidebar"
            aria-label={t("app.tabGit")}
            aria-pressed={
              agentRightSidebarOpen && agentRightSidebarView === "git"
            }
            className={`ref-agent-rail-toggle ${agentRightSidebarOpen && agentRightSidebarView === "git" ? "is-open" : ""}`}
            onClick={() => toggleAgentRightSidebarView("git")}
            title={t("app.tabGit")}
            type="button"
          >
            <IconGitSCM />
          </button>
        </div>

        <DevProfiler id="AgentChatPanel[agent-center]">
          <AgentChatPanel layout="agent-center" {...chatPanelProps} />
        </DevProfiler>
      </main>
    );
  },
  (prev, next) => {
    // 自定义比较：只关注真正影响渲染的关键 props
    return (
      prev.hasConversation === next.hasConversation &&
      prev.workspace === next.workspace &&
      prev.workspaceBasename === next.workspaceBasename &&
      prev.currentThreadTitle === next.currentThreadTitle &&
      prev.hasAgentPlanSidebarContent === next.hasAgentPlanSidebarContent &&
      prev.agentRightSidebarOpen === next.agentRightSidebarOpen &&
      prev.agentRightSidebarView === next.agentRightSidebarView &&
      prev.onOpenWorkspaceFolder === next.onOpenWorkspaceFolder &&
      prev.chatPanelProps === next.chatPanelProps // 引用比较，由 useAgentChatPanelProps 的 useMemo 保证
    );
  }
);
