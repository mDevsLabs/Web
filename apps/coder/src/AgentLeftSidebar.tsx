import { memo, type ReactNode, type RefObject } from "react";
import { formatTokenCountShort } from "./contextMeterFormat";
import type { TFunction } from "./i18n";
import {
  IconChevron,
  IconDotsHorizontal,
  IconExplorer,
  IconNewItem,
  IconPlugin,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTerminal,
} from "./icons";
import type { ThreadInfo } from "./threadTypes";

export type AgentSidebarWorkspace = {
  path: string;
  name: string;
  parent: string;
  isCurrent: boolean;
  isCollapsed: boolean;
  threadCount: number;
  todayThreads: ThreadInfo[];
  archivedThreads: ThreadInfo[];
};

export type AgentLeftSidebarProps = {
  t: TFunction;
  agentSidebarWorkspaces: AgentSidebarWorkspace[];
  renderThreadItem: (
    thread: ThreadInfo,
    threadListWorkspace: string
  ) => ReactNode;
  editingWorkspacePath: string | null;
  editingWorkspaceNameDraft: string;
  workspaceNameInputRef: RefObject<HTMLInputElement | null>;
  onWorkspaceNameDraftChange: (value: string) => void;
  commitWorkspaceAliasEdit: () => void;
  cancelWorkspaceAliasEdit: () => void;
  handleWorkspacePrimaryAction: (path: string) => void;
  workspaceMenuPath: string | null;
  closeWorkspaceMenu: () => void;
  openWorkspaceMenu: (path: string, anchor: HTMLButtonElement) => void;
  onNewThread: () => void;
  onNewThreadForWorkspace: (path: string) => void;
  openWorkspacePicker: () => void;
  openQuickOpen: () => void;
  openPluginSettings: () => void;
  openGeneralSettings: () => void;
  openSkillsSettings?: () => void;
  openUniversalTerminal?: () => void;
  maiAccount?: import("./ipcTypes").MaiAccountState;
  onOpenMaiAccount?: () => void;
};

export const AgentLeftSidebar = memo(function AgentLeftSidebar({
  t,
  agentSidebarWorkspaces,
  renderThreadItem,
  editingWorkspacePath,
  editingWorkspaceNameDraft,
  workspaceNameInputRef,
  onWorkspaceNameDraftChange,
  commitWorkspaceAliasEdit,
  cancelWorkspaceAliasEdit,
  handleWorkspacePrimaryAction,
  workspaceMenuPath,
  closeWorkspaceMenu,
  openWorkspaceMenu,
  onNewThread,
  onNewThreadForWorkspace,
  openWorkspacePicker,
  openQuickOpen,
  openPluginSettings,
  openGeneralSettings,
  openSkillsSettings,
  openUniversalTerminal,
  maiAccount,
  onOpenMaiAccount,
}: AgentLeftSidebarProps) {
  return (
    <div className="ref-left-agent-nest">
      <div className="ref-left-scroll">
        <div className="ref-project-block ref-project-block--agent">
          <nav
            aria-label={t("app.projectAndAgent")}
            className="ref-agent-nav-list"
          >
            <button
              className="ref-agent-nav-item"
              onClick={onNewThread}
              type="button"
            >
              <IconPlus className="ref-agent-nav-item-icon" />
              <span>{t("app.newAgent")}</span>
            </button>
            <button
              className="ref-agent-nav-item"
              onClick={openQuickOpen}
              type="button"
            >
              <IconSearch className="ref-agent-nav-item-icon" />
              <span>{t("common.search")}</span>
            </button>
            {openSkillsSettings ? (
              <button
                className="ref-agent-nav-item"
                onClick={openSkillsSettings}
                type="button"
              >
                <IconSparkles className="ref-agent-nav-item-icon" />
                <span>{t("app.skills")}</span>
              </button>
            ) : null}
            <button
              className="ref-agent-nav-item"
              onClick={openPluginSettings}
              type="button"
            >
              <IconPlugin className="ref-agent-nav-item-icon" />
              <span>{t("settings.nav.plugins")}</span>
            </button>
            {openUniversalTerminal ? (
              <button
                className="ref-agent-nav-item"
                onClick={openUniversalTerminal}
                type="button"
              >
                <IconTerminal className="ref-agent-nav-item-icon" />
                <span>{t("app.universalTerminal")}</span>
              </button>
            ) : null}
          </nav>

          <div className="ref-agent-sidebar-section">
            <div className="ref-agent-sidebar-section-head">
              <span className="ref-agent-sidebar-section-title">
                {t("app.sidebarProjects")}
              </span>
              <div className="ref-agent-sidebar-section-actions">
                <button
                  aria-label={t("app.openWorkspace")}
                  className="ref-agent-sidebar-icon-btn"
                  onClick={openWorkspacePicker}
                  title={t("app.openWorkspace")}
                  type="button"
                >
                  <IconExplorer />
                </button>
                <button
                  aria-label={t("common.search")}
                  className="ref-agent-sidebar-icon-btn"
                  onClick={openQuickOpen}
                  title={t("common.search")}
                  type="button"
                >
                  <IconSearch />
                </button>
                <button
                  aria-label={t("app.newAgent")}
                  className="ref-agent-sidebar-icon-btn"
                  onClick={onNewThread}
                  title={t("app.newAgent")}
                  type="button"
                >
                  <IconNewItem />
                </button>
              </div>
            </div>

            <div className="ref-agent-workspace-stack">
              {agentSidebarWorkspaces.length === 0 ? (
                <div className="ref-agent-empty-workspace" role="status">
                  <span aria-hidden className="ref-agent-empty-workspace-icon">
                    <IconExplorer />
                  </span>
                  <div className="ref-agent-empty-workspace-copy">
                    <span className="ref-agent-empty-workspace-title">
                      {t("app.openWorkspace")}
                    </span>
                    <p className="ref-agent-empty-workspace-body">
                      {t("app.explorerPlaceholder")}
                    </p>
                  </div>
                  <button
                    className="ref-agent-empty-workspace-btn"
                    onClick={openWorkspacePicker}
                    type="button"
                  >
                    <IconExplorer />
                    <span>{t("app.openWorkspace")}</span>
                  </button>
                </div>
              ) : (
                agentSidebarWorkspaces.map((ws) => {
                  const allThreads = [
                    ...ws.todayThreads,
                    ...ws.archivedThreads,
                  ];
                  const hasThreads = allThreads.length > 0;
                  const showThreads = !ws.isCollapsed;
                  const isEditingWorkspace = editingWorkspacePath === ws.path;
                  return (
                    <div
                      className={`ref-agent-workspace-group ${ws.isCurrent ? "is-active" : ""} ${
                        ws.isCollapsed ? "is-collapsed" : ""
                      } ${workspaceMenuPath === ws.path ? "is-menu-open" : ""}`}
                      key={ws.path}
                    >
                      <div
                        className={`ref-agent-workspace-row-shell ${ws.isCurrent ? "is-active" : ""}`}
                      >
                        {isEditingWorkspace ? (
                          <div
                            className={`ref-agent-workspace-row is-editing ${ws.isCurrent ? "is-active" : ""}`}
                          >
                            <span
                              aria-hidden
                              className={`ref-agent-workspace-disclosure ${
                                showThreads ? "is-open" : ""
                              } is-visible`}
                            >
                              <IconChevron className="ref-agent-workspace-disclosure-icon" />
                            </span>
                            <span
                              aria-hidden
                              className="ref-agent-workspace-row-icon"
                            >
                              <IconExplorer />
                            </span>
                            <span className="ref-agent-workspace-row-copy">
                              <input
                                aria-label={t(
                                  "app.workspaceMenuEditNamePrompt"
                                )}
                                className="ref-agent-workspace-title-input"
                                onBlur={commitWorkspaceAliasEdit}
                                onChange={(e) =>
                                  onWorkspaceNameDraftChange(e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitWorkspaceAliasEdit();
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelWorkspaceAliasEdit();
                                  }
                                }}
                                ref={workspaceNameInputRef}
                                type="text"
                                value={editingWorkspaceNameDraft}
                              />
                            </span>
                            {ws.threadCount > 0 ? (
                              <span className="ref-agent-workspace-row-badge">
                                {ws.threadCount}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            aria-expanded={!ws.isCollapsed}
                            className={`ref-agent-workspace-row ${ws.isCurrent ? "is-active" : ""}`}
                            onClick={() =>
                              handleWorkspacePrimaryAction(ws.path)
                            }
                            type="button"
                          >
                            <span
                              aria-hidden
                              className={`ref-agent-workspace-disclosure ${
                                showThreads ? "is-open" : ""
                              } is-visible`}
                            >
                              <IconChevron className="ref-agent-workspace-disclosure-icon" />
                            </span>
                            <span
                              aria-hidden
                              className="ref-agent-workspace-row-icon"
                            >
                              <IconExplorer />
                            </span>
                            <span className="ref-agent-workspace-row-copy">
                              <span
                                className="ref-agent-workspace-row-label"
                                title={ws.path}
                              >
                                {ws.name}
                              </span>
                            </span>
                            {ws.threadCount > 0 ? (
                              <span className="ref-agent-workspace-row-badge">
                                {ws.threadCount}
                              </span>
                            ) : null}
                          </button>
                        )}

                        <div className="ref-agent-workspace-actions">
                          <button
                            aria-label={t("app.newAgent")}
                            className="ref-agent-workspace-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNewThreadForWorkspace(ws.path);
                            }}
                            title={t("app.newAgent")}
                            type="button"
                          >
                            <IconPlus />
                          </button>
                          <button
                            aria-expanded={workspaceMenuPath === ws.path}
                            aria-haspopup="menu"
                            aria-label={t("app.editorChatMoreAria")}
                            className={`ref-agent-workspace-action-btn ${
                              workspaceMenuPath === ws.path ? "is-active" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const anchor = e.currentTarget;
                              if (workspaceMenuPath === ws.path) {
                                closeWorkspaceMenu();
                              } else {
                                openWorkspaceMenu(ws.path, anchor);
                              }
                            }}
                            title={t("app.editorChatMoreAria")}
                            type="button"
                          >
                            <IconDotsHorizontal />
                          </button>
                        </div>
                      </div>

                      <div
                        className={`ref-collapse-grid ${showThreads ? "is-open" : ""}`}
                      >
                        <div className="ref-collapse-inner">
                          {hasThreads ? (
                            <div
                              aria-hidden={!showThreads}
                              className="ref-agent-thread-list"
                            >
                              {allThreads.map((th) =>
                                renderThreadItem(th, ws.path)
                              )}
                            </div>
                          ) : (
                            <div
                              aria-hidden={!showThreads}
                              className="ref-agent-workspace-empty"
                            >
                              {t("app.noThreads")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="ref-left-footer ref-left-footer--agent"
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {onOpenMaiAccount ? (
          <button
            className="ref-agent-settings-link"
            onClick={onOpenMaiAccount}
            style={{
              alignItems: "center",
              background: maiAccount?.jwtToken
                ? "rgba(59, 130, 246, 0.08)"
                : "transparent",
              border: maiAccount?.jwtToken
                ? "1px solid rgba(59, 130, 246, 0.2)"
                : "1px solid transparent",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              gap: 8,
              padding: "6px 8px",
              textAlign: "left",
              width: "100%",
            }}
            type="button"
          >
            {maiAccount?.user?.avatarUrl ? (
              <img
                alt="Avatar"
                src={maiAccount.user.avatarUrl}
                style={{
                  borderRadius: "50%",
                  height: 22,
                  objectFit: "cover",
                  width: 22,
                }}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: "50%",
                  color: "#fff",
                  display: "flex",
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  height: 22,
                  justifyContent: "center",
                  width: 22,
                }}
              >
                {maiAccount?.user?.username
                  ? maiAccount.user.username.charAt(0).toUpperCase()
                  : "m"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {maiAccount?.user?.username || t("mai.account")}
                </span>
                {maiAccount?.user?.tier ? (
                  <span
                    style={{
                      background: "rgba(59, 130, 246, 0.2)",
                      borderRadius: 4,
                      color: "#60a5fa",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {maiAccount.user.tier}
                  </span>
                ) : null}
              </div>
              {maiAccount?.usage ? (
                <div style={{ marginTop: 4 }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      height: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "#3b82f6",
                        borderRadius: 2,
                        height: "100%",
                        width: `${Math.min(100, Math.round((maiAccount.usage.tokensUsed / (maiAccount.usage.limit || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      alignItems: "center",
                      color: "var(--fg-muted, #a1a1aa)",
                      display: "flex",
                      fontSize: 10,
                      justifyContent: "space-between",
                      marginTop: 2,
                    }}
                  >
                    <span>
                      {formatTokenCountShort(maiAccount.usage.tokensUsed)} /{" "}
                      {formatTokenCountShort(maiAccount.usage.limit)}
                    </span>
                    <span>
                      {Math.min(
                        100,
                        Math.round(
                          (maiAccount.usage.tokensUsed /
                            (maiAccount.usage.limit || 1)) *
                            100
                        )
                      )}
                      %
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </button>
        ) : null}
        <button
          className="ref-agent-settings-link"
          onClick={openGeneralSettings}
          type="button"
        >
          <IconSettings className="ref-agent-settings-link-icon" />
          <span>{t("app.settings")}</span>
        </button>
      </div>
    </div>
  );
});
