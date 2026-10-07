import "./monacoSetup";
import "./styles/editor-layout.css";
import Editor, { DiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { type MouseEventHandler, memo } from "react";
import { BrandLogo } from "./BrandLogo";
import { ChatMarkdown } from "./ChatMarkdown";
import { EditorFileBreadcrumb } from "./EditorFileBreadcrumb";
import {
  type EditorSettings,
  editorSettingsToMonacoOptions,
} from "./EditorSettingsPanel";
import {
  type EditorTab,
  EditorTabBar,
  type MarkdownTabView,
} from "./EditorTabBar";
import { languageFromFilePath } from "./fileTypeIcons";
import {
  EDITOR_TERMINAL_H_MAX_RATIO,
  EDITOR_TERMINAL_H_MIN,
  type EditorInlineDiffState,
  type EditorPtySession,
} from "./hooks/useEditorTabs";
import type { TeamSessionState } from "./hooks/useTeamSession";
import type { TFunction } from "./i18n";
import { IconCloseSmall, IconPlus, IconRefresh } from "./icons";
import type { ModelPickerItem } from "./ModelPickerDropdown";
import { PtyTerminalView } from "./PtyTerminalView";
import { TeamRoleWorkflowPanel } from "./TeamRoleWorkflowPanel";
import { VoidSelect } from "./VoidSelect";

export type EditorMainPanelProps = {
  t: TFunction;
  openTabs: EditorTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  showEditorPlanDocumentInCenter: boolean;
  showEditorTeamWorkflowInCenter: boolean;
  planFileRelPath: string | null;
  planFilePath: string | null;
  editorPlanBuildModelId: string;
  setEditorPlanBuildModelId: (value: string) => void;
  modelPickerItems: ModelPickerItem[];
  planReviewIsBuilt: boolean;
  awaitingReply: boolean;
  editorCenterPlanCanBuild: boolean;
  onPlanBuild: (modelId: string) => void;
  editorCenterPlanMarkdown: string;
  filePath: string;
  markdownPaneMode: MarkdownTabView | null;
  setMarkdownPaneMode: (mode: MarkdownTabView) => void;
  onLoadFile: () => void;
  onSaveFile: () => void;
  showPlanFileEditorChrome: boolean;
  editorPlanFileIsBuilt: boolean;
  onExecutePlanFromEditor: (modelId: string) => void;
  markdownPreviewContent: string;
  activeEditorInlineDiff: EditorInlineDiffState | null;
  monacoChromeTheme: string;
  monacoOriginalDocumentPath: string;
  monacoDocumentPath: string;
  editorValue: string;
  onEditorValueChange: (value: string) => void;
  onMonacoMount: (
    editor: MonacoEditorNS.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => void;
  onMonacoDiffMount: (
    diffEditor: MonacoEditorNS.IStandaloneDiffEditor,
    monaco: typeof import("monaco-editor")
  ) => void;
  editorSettings: EditorSettings;
  openWorkspacePicker: () => void;
  editorTerminalVisible: boolean;
  beginResizeEditorTerminal: MouseEventHandler<HTMLDivElement>;
  editorTerminalHeightPx: number;
  editorTerminalSessions: EditorPtySession[];
  activeEditorTerminalId: string | null;
  setActiveEditorTerminalId: (id: string) => void;
  closeEditorTerminalSession: (id: string) => void;
  appendEditorTerminal: () => void;
  closeEditorTerminalPanel: () => void;
  onEditorTerminalSessionExit: (id: string) => void;
  teamSession: TeamSessionState | null;
  selectedTeamTaskId: string | null;
  onSelectTeamTask: (taskId: string) => void;
  workspaceRoot: string | null;
  onOpenTeamAgentFile: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  revertedPaths: ReadonlySet<string>;
  revertedChangeKeys: ReadonlySet<string>;
};

export const EditorMainPanel = memo(function EditorMainPanel({
  t,
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  showEditorPlanDocumentInCenter,
  showEditorTeamWorkflowInCenter,
  planFileRelPath,
  planFilePath,
  editorPlanBuildModelId,
  setEditorPlanBuildModelId,
  modelPickerItems,
  planReviewIsBuilt,
  awaitingReply,
  editorCenterPlanCanBuild,
  onPlanBuild,
  editorCenterPlanMarkdown,
  filePath,
  markdownPaneMode,
  setMarkdownPaneMode,
  onLoadFile,
  onSaveFile,
  showPlanFileEditorChrome,
  editorPlanFileIsBuilt,
  onExecutePlanFromEditor,
  markdownPreviewContent,
  activeEditorInlineDiff,
  monacoChromeTheme,
  monacoOriginalDocumentPath,
  monacoDocumentPath,
  editorValue,
  onEditorValueChange,
  onMonacoMount,
  onMonacoDiffMount,
  editorSettings,
  openWorkspacePicker,
  editorTerminalVisible,
  beginResizeEditorTerminal,
  editorTerminalHeightPx,
  editorTerminalSessions,
  activeEditorTerminalId,
  setActiveEditorTerminalId,
  closeEditorTerminalSession,
  appendEditorTerminal,
  closeEditorTerminalPanel,
  onEditorTerminalSessionExit,
  teamSession,
  selectedTeamTaskId,
  onSelectTeamTask,
  workspaceRoot,
  onOpenTeamAgentFile,
  revertedPaths,
  revertedChangeKeys,
}: EditorMainPanelProps) {
  return (
    <main
      aria-label={t("app.editorWorkspaceMainAria")}
      className="ref-center ref-center--editor-workspace ref-center--editor-shell"
    >
      <div className="ref-editor-center-split">
        <div className="ref-editor-split-top">
          <EditorTabBar
            activeTabId={activeTabId}
            onClose={onCloseTab}
            onSelect={onSelectTab}
            tabs={openTabs}
          />
          {showEditorTeamWorkflowInCenter ? (
            <div className="ref-editor-canvas ref-editor-canvas--team-workflow">
              <TeamRoleWorkflowPanel
                allowAgentFileActions
                layout="editor-center"
                onOpenAgentFile={onOpenTeamAgentFile}
                onSelectTask={onSelectTeamTask}
                revertedChangeKeys={revertedChangeKeys}
                revertedPaths={revertedPaths}
                selectedTaskId={selectedTeamTaskId}
                session={teamSession}
                t={t}
                workspaceRoot={workspaceRoot}
              />
            </div>
          ) : showEditorPlanDocumentInCenter ? (
            <>
              <div className="ref-editor-bc-toolbar-row">
                <div className="ref-editor-bc-toolbar-inner">
                  <div className="ref-editor-plan-draft-meta">
                    <span className="ref-editor-plan-draft-label">
                      {t("plan.review.label")}
                    </span>
                    <span
                      className="ref-editor-plan-draft-path"
                      title={planFileRelPath ?? planFilePath ?? undefined}
                    >
                      {planFileRelPath ??
                        planFilePath ??
                        t("app.planSidebarWaiting")}
                    </span>
                  </div>
                  <div className="ref-editor-bc-actions">
                    <div className="ref-editor-plan-chrome">
                      <VoidSelect
                        ariaLabel={t("plan.review.model")}
                        disabled={planReviewIsBuilt || awaitingReply}
                        onChange={setEditorPlanBuildModelId}
                        options={[
                          {
                            disabled: true,
                            label: t("plan.review.pickModel"),
                            value: "",
                          },
                          ...modelPickerItems.map((model) => ({
                            label: model.label,
                            value: model.id,
                          })),
                        ]}
                        value={editorPlanBuildModelId}
                        variant="compact"
                      />
                      {planReviewIsBuilt ? (
                        <span className="ref-editor-plan-built" role="status">
                          {t("app.planEditorBuilt")}
                        </span>
                      ) : awaitingReply ? (
                        <span className="ref-editor-plan-built" role="status">
                          {t("app.planSidebarStreaming")}
                        </span>
                      ) : (
                        <button
                          className="ref-editor-plan-build-btn"
                          disabled={!editorCenterPlanCanBuild}
                          onClick={() => onPlanBuild(editorPlanBuildModelId)}
                          type="button"
                        >
                          {t("plan.review.build")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ref-editor-canvas">
                <div className="ref-editor-pane">
                  <div className="ref-editor-plan-preview-scroll">
                    <div className="ref-editor-plan-preview-surface">
                      <div className="ref-agent-plan-doc-markdown ref-agent-plan-preview-markdown">
                        <ChatMarkdown content={editorCenterPlanMarkdown} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : filePath ? (
            <>
              <div className="ref-editor-bc-toolbar-row">
                <div className="ref-editor-bc-toolbar-inner">
                  <EditorFileBreadcrumb filePath={filePath} />
                  <div className="ref-editor-bc-actions">
                    {markdownPaneMode == null ? null : (
                      <div
                        aria-label={t("app.editorMarkdownModeAria")}
                        className="ref-editor-md-mode-toggle"
                        role="group"
                      >
                        <button
                          className={`ref-editor-md-mode-btn ${markdownPaneMode === "source" ? "is-active" : ""}`}
                          onClick={() => setMarkdownPaneMode("source")}
                          type="button"
                        >
                          {t("app.editorMarkdownSource")}
                        </button>
                        <button
                          className={`ref-editor-md-mode-btn ${markdownPaneMode === "preview" ? "is-active" : ""}`}
                          onClick={() => setMarkdownPaneMode("preview")}
                          type="button"
                        >
                          {t("app.editorMarkdownPreview")}
                        </button>
                      </div>
                    )}
                    <button
                      aria-label={t("app.reloadFileAria")}
                      className="ref-icon-tile"
                      onClick={onLoadFile}
                      type="button"
                    >
                      <IconRefresh />
                    </button>
                    <button
                      className="ref-editor-save"
                      disabled
                      onClick={onSaveFile}
                      title={t("app.editorReadOnlySaveHint")}
                      type="button"
                    >
                      {t("common.save")}
                    </button>
                    {showPlanFileEditorChrome ? (
                      <div className="ref-editor-plan-chrome">
                        <VoidSelect
                          ariaLabel={t("plan.review.model")}
                          disabled={editorPlanFileIsBuilt}
                          onChange={setEditorPlanBuildModelId}
                          options={[
                            {
                              disabled: true,
                              label: t("plan.review.pickModel"),
                              value: "",
                            },
                            ...modelPickerItems.map((model) => ({
                              label: model.label,
                              value: model.id,
                            })),
                          ]}
                          value={editorPlanBuildModelId}
                          variant="compact"
                        />
                        {editorPlanFileIsBuilt ? (
                          <span className="ref-editor-plan-built" role="status">
                            {t("app.planEditorBuilt")}
                          </span>
                        ) : (
                          <button
                            className="ref-editor-plan-build-btn"
                            disabled={
                              awaitingReply ||
                              !editorPlanBuildModelId.trim() ||
                              modelPickerItems.length === 0
                            }
                            onClick={() =>
                              onExecutePlanFromEditor(editorPlanBuildModelId)
                            }
                            type="button"
                          >
                            {t("plan.review.build")}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="ref-editor-canvas">
                <div
                  className={`ref-editor-pane${markdownPaneMode === "preview" ? " ref-editor-pane--md-preview" : ""}`}
                >
                  {markdownPaneMode === "preview" ? (
                    <div
                      aria-label={t("app.editorMarkdownPreview")}
                      className="ref-editor-md-preview-scroll"
                      role="document"
                    >
                      <ChatMarkdown content={markdownPreviewContent} />
                    </div>
                  ) : (
                    <div className="ref-monaco-fill">
                      {activeEditorInlineDiff ? (
                        <DiffEditor
                          height="100%"
                          key={`diff:${filePath}`}
                          language={languageFromFilePath(filePath)}
                          modified={editorValue}
                          modifiedModelPath={monacoDocumentPath || filePath}
                          onMount={onMonacoDiffMount}
                          options={{
                            ...editorSettingsToMonacoOptions(editorSettings),
                            enableSplitViewResizing: false,
                            originalEditable: false,
                            renderSideBySide: false,
                            scrollbar: {
                              horizontalScrollbarSize: 8,
                              useShadows: false,
                              verticalScrollbarSize: 8,
                            },
                          }}
                          original={activeEditorInlineDiff.originalContent}
                          originalModelPath={monacoOriginalDocumentPath}
                          theme={monacoChromeTheme}
                        />
                      ) : (
                        <Editor
                          height="100%"
                          key={filePath}
                          language={languageFromFilePath(filePath)}
                          onChange={(value) => onEditorValueChange(value ?? "")}
                          onMount={onMonacoMount}
                          options={{
                            ...editorSettingsToMonacoOptions(editorSettings),
                            scrollbar: {
                              horizontalScrollbarSize: 8,
                              useShadows: false,
                              verticalScrollbarSize: 8,
                            },
                          }}
                          path={monacoDocumentPath || filePath}
                          theme={monacoChromeTheme}
                          value={editorValue}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="ref-editor-empty-state">
              <div className="ref-editor-empty-card">
                <BrandLogo className="ref-editor-empty-logo" size={28} />
                <div className="ref-editor-empty-copy">
                  <strong className="ref-editor-empty-title">
                    {t("app.editorEmptyTitle")}
                  </strong>
                  <p className="ref-editor-empty-description">
                    {t("app.editorEmptyDescription")}
                  </p>
                </div>
                <button
                  className="ref-open-workspace ref-open-workspace--inline"
                  onClick={openWorkspacePicker}
                  type="button"
                >
                  {t("app.openWorkspace")}
                </button>
              </div>
            </div>
          )}
        </div>
        {editorTerminalVisible ? (
          <>
            <div
              aria-label={t("app.resizeEditorTerminalAria")}
              aria-orientation="horizontal"
              className="ref-editor-terminal-resize-handle"
              onMouseDown={beginResizeEditorTerminal}
              role="separator"
              title={t("app.resizeEditorTerminalTitle")}
            />
            <div
              className="ref-editor-split-bottom"
              style={{
                flex: `0 0 ${editorTerminalHeightPx}px`,
                maxHeight: `${Math.floor(window.innerHeight * EDITOR_TERMINAL_H_MAX_RATIO)}px`,
                minHeight: EDITOR_TERMINAL_H_MIN,
              }}
            >
              <div className="ref-editor-panel-terminal-tabs">
                <div
                  aria-label={t("app.terminalTab")}
                  className="ref-editor-terminal-tabs-scroll"
                  role="tablist"
                >
                  {editorTerminalSessions.map((session) => {
                    const isActive = session.id === activeEditorTerminalId;
                    return (
                      <div
                        className={`ref-editor-terminal-tab ${isActive ? "is-active" : ""}`}
                        key={session.id}
                        role="presentation"
                      >
                        <button
                          aria-selected={isActive}
                          className="ref-editor-terminal-tab-main"
                          onClick={() => setActiveEditorTerminalId(session.id)}
                          role="tab"
                          type="button"
                        >
                          {session.title}
                        </button>
                        <button
                          aria-label={t("app.closeTerminalTab")}
                          className="ref-editor-terminal-tab-close"
                          onClick={(event) => {
                            event.stopPropagation();
                            closeEditorTerminalSession(session.id);
                          }}
                          type="button"
                        >
                          <IconCloseSmall />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <span aria-hidden className="ref-editor-panel-tab-spacer" />
                <button
                  aria-label={t("app.menuNewTerminal")}
                  className="ref-editor-terminal-icon-btn"
                  onClick={appendEditorTerminal}
                  title={t("app.newTerminalTitle")}
                  type="button"
                >
                  <IconPlus />
                </button>
                <button
                  aria-label={t("app.closeTerminalPanel")}
                  className="ref-editor-terminal-icon-btn"
                  onClick={closeEditorTerminalPanel}
                  title={t("app.closeTerminalPanel")}
                  type="button"
                >
                  <IconCloseSmall />
                </button>
              </div>
              <div className="ref-editor-terminal-stack">
                {editorTerminalSessions.map((session) => (
                  <div
                    className={`ref-editor-terminal-pane ${session.id === activeEditorTerminalId ? "is-active" : ""}`}
                    key={session.id}
                  >
                    <PtyTerminalView
                      active={session.id === activeEditorTerminalId}
                      compactChrome
                      onSessionExit={() =>
                        onEditorTerminalSessionExit(session.id)
                      }
                      sessionId={session.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
});
