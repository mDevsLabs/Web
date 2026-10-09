import {
  type ComponentProps,
  type Dispatch,
  type KeyboardEvent,
  memo,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { AgentChatPanel, type AgentChatPanelProps } from "../AgentChatPanel";
import {
  AgentLeftSidebar,
  type AgentLeftSidebarProps,
} from "../AgentLeftSidebar";
import { AgentRightSidebar } from "../AgentRightSidebar";
import type { ComposerMode } from "../ComposerPlusMenu";
import { DevProfiler } from "../devProfiler";
import { EditorLeftSidebar } from "../EditorLeftSidebar";
import type { TFunction } from "../i18n";
import {
  IconCloseSmall,
  IconDotsHorizontal,
  IconHistory,
  IconPlus,
  IconSearch,
} from "../icons";
import type { ThreadInfo } from "../threadTypes";
import type { ShellLayoutMode } from "./shellLayoutStorage";
import { threadRowTitle } from "./threadRowUi";

export type ShellLeftRailGroupProps = {
  layoutMode: ShellLayoutMode;
  leftSidebarOpen: boolean;
  t: TFunction;
  beginResizeLeft: (e: React.MouseEvent) => void;
  resetRailWidths: () => void;
  agentLeftSidebarProps: AgentLeftSidebarProps;
  editorLeftSidebarProps: ComponentProps<typeof EditorLeftSidebar>;
};

/**
 * 左侧栏 + 左分隔条；display:contents 使子节点仍参与 ref-body 的 grid 布局。
 * memo：流式输出时 agentLeftSidebarProps 通常不变，可跳过左侧整栏 reconcile。
 */
export const ShellLeftRailGroup = memo(function ShellLeftRailGroup({
  layoutMode,
  leftSidebarOpen,
  t,
  beginResizeLeft,
  resetRailWidths,
  agentLeftSidebarProps,
  editorLeftSidebarProps,
}: ShellLeftRailGroupProps) {
  return (
    <div className="ref-shell-left-rail-group" style={{ display: "contents" }}>
      <aside
        aria-label={t("app.projectAndAgent")}
        className={`ref-left ${leftSidebarOpen ? "" : "is-collapsed"} ${
          layoutMode === "editor"
            ? "ref-left--editor-embedded"
            : "ref-left--agent-layout"
        }`}
      >
        {layoutMode === "agent" ? (
          <AgentLeftSidebar {...agentLeftSidebarProps} />
        ) : (
          <EditorLeftSidebar {...editorLeftSidebarProps} />
        )}
      </aside>

      <div
        aria-label={t("app.resizeLeftAria")}
        aria-orientation="vertical"
        className={`ref-resize-handle ${leftSidebarOpen ? "" : "is-collapsed"}`}
        onDoubleClick={resetRailWidths}
        onMouseDown={leftSidebarOpen ? beginResizeLeft : undefined}
        role="separator"
        title={t("app.resizeLeftTitle")}
      />
    </div>
  );
});

export type ShellCenterRightGroupProps = {
  layoutMode: ShellLayoutMode;
  agentRightSidebarOpen: boolean;
  t: TFunction;
  /** 中间主栏：Agent 为 AgentAgentCenterColumn，Editor 为 Suspense+EditorMainPanel（由父组件懒加载） */
  centerMain: ReactNode;
  hasConversation: boolean;
  onPlanNewIdea: (e: KeyboardEvent) => void;
  agentChatPanelProps: Omit<AgentChatPanelProps, "layout">;
  agentRightSidebarProps: ComponentProps<typeof AgentRightSidebar>;
  beginResizeRight: (e: React.MouseEvent) => void;
  resetRailWidths: () => void;
  threadsChrono: ThreadInfo[];
  currentId: string | null;
  onSelectThread: (
    id: string,
    threadListWorkspace?: string | null
  ) => void | Promise<void>;
  confirmDeleteId: string | null;
  onDeleteThread: (
    e: React.MouseEvent,
    id: string,
    threadListWorkspace?: string | null
  ) => void | Promise<void>;
  editorThreadHistoryOpen: boolean;
  setEditorThreadHistoryOpen: Dispatch<SetStateAction<boolean>>;
  editorChatMoreOpen: boolean;
  setEditorChatMoreOpen: Dispatch<SetStateAction<boolean>>;
  editorHistoryMenuRef: RefObject<HTMLDivElement | null>;
  editorMoreMenuRef: RefObject<HTMLDivElement | null>;
  threadSearch: string;
  setThreadSearch: Dispatch<SetStateAction<string>>;
  todayThreads: ThreadInfo[];
  archivedThreads: ThreadInfo[];
  renderThreadItem: (
    th: ThreadInfo,
    threadListWorkspace?: string | null
  ) => ReactNode;
  setComposerModePersist: (mode: ComposerMode) => void;
  onNewThread: () => void | Promise<void>;
  setWorkspaceToolsOpen: Dispatch<SetStateAction<boolean>>;
  handleCloseEditorChatMore: () => void;
  handleOpenSettingsGeneral: () => void;
};

/**
 * 中间主栏 + 右分隔条 + 右侧栏；display:contents 保持五列 grid。
 * 与左侧解耦：仅此处随消息流式、diff 等高频 props 变化而重渲。
 */
export const ShellCenterRightGroup = memo(function ShellCenterRightGroup({
  layoutMode,
  agentRightSidebarOpen,
  t,
  centerMain,
  hasConversation,
  onPlanNewIdea,
  agentChatPanelProps,
  agentRightSidebarProps,
  beginResizeRight,
  resetRailWidths,
  threadsChrono,
  currentId,
  onSelectThread,
  confirmDeleteId,
  onDeleteThread,
  editorThreadHistoryOpen,
  setEditorThreadHistoryOpen,
  editorChatMoreOpen,
  setEditorChatMoreOpen,
  editorHistoryMenuRef,
  editorMoreMenuRef,
  threadSearch,
  setThreadSearch,
  todayThreads,
  archivedThreads,
  renderThreadItem,
  setComposerModePersist,
  onNewThread,
  setWorkspaceToolsOpen,
  handleCloseEditorChatMore,
  handleOpenSettingsGeneral,
}: ShellCenterRightGroupProps) {
  return (
    <div
      className="ref-shell-center-right-group"
      style={{ display: "contents" }}
    >
      {centerMain}

      <div
        aria-label={t("app.resizeRightAria")}
        aria-orientation="vertical"
        className={`ref-resize-handle ${
          layoutMode === "agent" && !agentRightSidebarOpen ? "is-collapsed" : ""
        }`}
        onDoubleClick={resetRailWidths}
        onMouseDown={
          layoutMode === "agent" && !agentRightSidebarOpen
            ? undefined
            : beginResizeRight
        }
        role="separator"
        title={t("app.resizeRightTitle")}
      />

      {layoutMode === "agent" ? (
        <AgentRightSidebar {...agentRightSidebarProps} />
      ) : (
        <aside
          aria-label={t("app.editorAgentChatRail")}
          className={`ref-right ref-right--editor-chat ref-right--editor-shell ${hasConversation ? "ref-right--editor-chat--active" : ""}`}
          onKeyDown={onPlanNewIdea}
        >
          <div className="ref-editor-chat-panel">
            <div className="ref-editor-chat-tab-rail">
              <nav
                aria-label={t("app.editorChatTabListAria")}
                className="ref-editor-chat-tabs-scroll"
              >
                {threadsChrono.map((th) => {
                  const active = th.id === currentId;
                  return (
                    <div
                      className={`ref-editor-chat-tab-shell ${active ? "is-active" : ""}`}
                      key={th.id}
                    >
                      <button
                        aria-current={active ? "true" : undefined}
                        className="ref-editor-chat-tab-main"
                        onClick={() => {
                          setEditorThreadHistoryOpen(false);
                          void onSelectThread(th.id);
                        }}
                        title={threadRowTitle(t, th)}
                        type="button"
                      >
                        <span className="ref-editor-chat-tab-label">
                          {threadRowTitle(t, th)}
                        </span>
                      </button>
                      <button
                        aria-label={
                          confirmDeleteId === th.id
                            ? t("common.confirmDelete")
                            : t("common.deleteThread")
                        }
                        className={`ref-editor-chat-tab-close ${
                          confirmDeleteId === th.id
                            ? "ref-editor-chat-tab-close--confirm"
                            : ""
                        }`}
                        onClick={(e) => void onDeleteThread(e, th.id)}
                        title={
                          confirmDeleteId === th.id
                            ? t("common.confirmDelete")
                            : t("common.deleteThread")
                        }
                        type="button"
                      >
                        {confirmDeleteId === th.id ? (
                          <span className="ref-editor-chat-tab-close-confirm-label">
                            {t("common.confirm")}
                          </span>
                        ) : (
                          <IconCloseSmall className="ref-editor-chat-tab-close-svg" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </nav>
              <div className="ref-editor-chat-tab-actions">
                <button
                  aria-label={t("app.newAgent")}
                  className="ref-editor-chat-icon-btn"
                  onClick={() => {
                    setEditorThreadHistoryOpen(false);
                    setEditorChatMoreOpen(false);
                    void onNewThread();
                  }}
                  title={t("app.newAgent")}
                  type="button"
                >
                  <IconPlus className="ref-editor-chat-icon-btn-svg" />
                </button>
                <div
                  className="ref-editor-chat-menu-wrap"
                  ref={editorHistoryMenuRef}
                >
                  <button
                    aria-expanded={editorThreadHistoryOpen}
                    aria-haspopup="dialog"
                    aria-label={t("app.editorChatHistoryAria")}
                    className={`ref-editor-chat-icon-btn ${editorThreadHistoryOpen ? "is-active" : ""}`}
                    onClick={() => {
                      setEditorChatMoreOpen(false);
                      setEditorThreadHistoryOpen((o) => !o);
                    }}
                    title={t("app.editorChatHistoryAria")}
                    type="button"
                  >
                    <IconHistory className="ref-editor-chat-icon-btn-svg" />
                  </button>
                  {editorThreadHistoryOpen ? (
                    <div
                      className="ref-editor-chat-dropdown ref-editor-chat-dropdown--history"
                      role="dialog"
                    >
                      <label className="ref-editor-chat-history-search">
                        <IconSearch
                          aria-hidden
                          className="ref-editor-chat-history-search-ico"
                        />
                        <input
                          aria-label={t("app.editorChatSearchThreads")}
                          className="ref-editor-chat-history-input"
                          onChange={(e) => setThreadSearch(e.target.value)}
                          placeholder={t("app.editorChatSearchThreads")}
                          type="search"
                          value={threadSearch}
                        />
                      </label>
                      <div className="ref-editor-chat-history-section-label">
                        {t("app.today")}
                      </div>
                      <div className="ref-editor-chat-history-list">
                        {todayThreads.map((th) => renderThreadItem(th))}
                      </div>
                      {archivedThreads.length > 0 ? (
                        <>
                          <div className="ref-editor-chat-history-section-label ref-editor-chat-history-section-label--arch">
                            {t("app.archived")}
                          </div>
                          <div className="ref-editor-chat-history-list">
                            {archivedThreads.map((th) => renderThreadItem(th))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div
                  className="ref-editor-chat-menu-wrap"
                  ref={editorMoreMenuRef}
                >
                  <button
                    aria-expanded={editorChatMoreOpen}
                    aria-haspopup="menu"
                    aria-label={t("app.editorChatMoreAria")}
                    className={`ref-editor-chat-icon-btn ${editorChatMoreOpen ? "is-active" : ""}`}
                    onClick={() => {
                      setEditorThreadHistoryOpen(false);
                      setEditorChatMoreOpen((o) => !o);
                    }}
                    title={t("app.editorChatMoreAria")}
                    type="button"
                  >
                    <IconDotsHorizontal className="ref-editor-chat-icon-btn-svg" />
                  </button>
                  {editorChatMoreOpen ? (
                    <div
                      className="ref-editor-chat-dropdown ref-editor-chat-dropdown--more"
                      role="menu"
                    >
                      <button
                        className="ref-editor-chat-more-item"
                        onClick={() => {
                          setEditorChatMoreOpen(false);
                          setComposerModePersist("plan");
                          void onNewThread();
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {t("app.planNewIdea")}
                      </button>
                      <button
                        className="ref-editor-chat-more-item"
                        onClick={() => {
                          setEditorChatMoreOpen(false);
                          setWorkspaceToolsOpen(true);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {t("app.quickTerminal")}
                      </button>
                      <button
                        className="ref-editor-chat-more-item"
                        onClick={() => {
                          handleCloseEditorChatMore();
                          handleOpenSettingsGeneral();
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {t("app.settings")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <DevProfiler id="AgentChatPanel[editor-rail]">
              <AgentChatPanel layout="editor-rail" {...agentChatPanelProps} />
            </DevProfiler>
          </div>
        </aside>
      )}
    </div>
  );
});
