import { memo, type RefObject, useCallback, useEffect } from "react";
import {
  useAppShellChromeCore,
  useAppShellGitActions,
  useAppShellGitFiles,
  useAppShellGitMeta,
  useAppShellWorkspace,
} from "./app/appShellContexts";
import { FileTypeIcon } from "./fileTypeIcons";
import { EditorGitScmPathList } from "./GitScmVirtualLists";
import {
  classifyGitUnavailableReason,
  type GitUnavailableReason,
} from "./gitAvailability";
import { GitUnavailableState } from "./gitBadge";
import { useI18n } from "./i18n";
import {
  IconArrowUpRight,
  IconChevron,
  IconExplorer,
  IconGitSCM,
  IconNewFile,
  IconNewFolder,
  IconPlugin,
  IconRefresh,
  IconSearch,
} from "./icons";
import type { SettingsNavId } from "./SettingsPage";
import {
  WorkspaceExplorer,
  type WorkspaceExplorerActions,
} from "./WorkspaceExplorer";

type Shell = NonNullable<Window["maiShell"]>;
type SearchResult = { rel: string; fileName: string; dir: string };

/** 资源管理器 Git 刷新：仅订阅 Git Actions（稳定引用），fullStatus 大对象更新时不重渲。 */
const EditorExplorerGitRefreshButton = memo(
  function EditorExplorerGitRefreshButton() {
    const { t } = useAppShellChromeCore();
    const { refreshGit } = useAppShellGitActions();
    return (
      <button
        aria-label={t("app.explorerRefreshAria")}
        className="ref-editor-sidebar-action"
        onClick={refreshGit}
        title={t("common.refresh")}
        type="button"
      >
        <IconRefresh />
      </button>
    );
  }
);

/** 活动栏 Git 标签：只刷新轻状态，预览由 Git 面板缺口检测后后台补齐。 */
const EditorGitTabButton = memo(function EditorGitTabButton({
  isActive,
  onActivate,
}: {
  isActive: boolean;
  onActivate: () => void;
}) {
  const { t } = useAppShellChromeCore();
  const { refreshGit } = useAppShellGitActions();
  return (
    <button
      aria-label={t("app.tabGit")}
      aria-pressed={isActive}
      className={`ref-editor-sidebar-tab ${isActive ? "is-active" : ""}`}
      onClick={() => {
        onActivate();
        void refreshGit();
      }}
      title={t("app.tabGit")}
      type="button"
    >
      <IconGitSCM />
    </button>
  );
});

/** 仅挂载于 Git 视图时订阅 Git context，与 explorer/search 重渲解耦。 */
const EditorLeftSidebarGitPane = memo(function EditorLeftSidebarGitPane({
  hasShellAndWorkspace,
  workspaceBasename,
  editorSidebarSelectedRel,
  onExplorerOpenFile,
  setWorkspacePickerOpen,
}: {
  hasShellAndWorkspace: boolean;
  workspaceBasename: string;
  editorSidebarSelectedRel: string;
  onExplorerOpenFile: (rel: string) => void;
  setWorkspacePickerOpen: (v: boolean) => void;
}) {
  const { t } = useAppShellChromeCore();
  const { workspace } = useAppShellWorkspace();
  const { refreshGit } = useAppShellGitActions();
  const { gitLines, gitStatusOk, diffLoading } = useAppShellGitMeta();
  const { gitChangedPaths, gitPathStatus, diffPreviews, loadGitDiffPreviews } =
    useAppShellGitFiles();

  const gitUnavailableReason: GitUnavailableReason = gitStatusOk
    ? "none"
    : classifyGitUnavailableReason(gitLines[0]);
  const hasMissingGitPreviews = gitChangedPaths.some(
    (path) => diffPreviews[path] == null
  );

  useEffect(() => {
    if (
      !hasShellAndWorkspace ||
      !gitStatusOk ||
      gitChangedPaths.length === 0 ||
      diffLoading ||
      !hasMissingGitPreviews
    ) {
      return;
    }
    void loadGitDiffPreviews();
  }, [
    hasShellAndWorkspace,
    workspace,
    gitStatusOk,
    gitChangedPaths,
    diffLoading,
    hasMissingGitPreviews,
    loadGitDiffPreviews,
  ]);

  return (
    <>
      <div className="ref-editor-sidebar-section-bar">
        <div className="ref-editor-sidebar-section-title">
          <span className="ref-editor-sidebar-section-name">
            {t("app.tabGit")}
          </span>
        </div>
        {hasShellAndWorkspace ? (
          <div className="ref-editor-sidebar-section-actions">
            <button
              aria-label={t("app.explorerRefreshAria")}
              className="ref-editor-sidebar-action"
              onClick={() => void refreshGit()}
              title={t("common.refresh")}
              type="button"
            >
              <IconRefresh />
            </button>
          </div>
        ) : null}
      </div>
      {!hasShellAndWorkspace ||
      gitUnavailableReason !== "none" ||
      gitChangedPaths.length === 0 ? (
        <div className="ref-editor-sidebar-scroll ref-editor-sidebar-scroll--list">
          <div className="ref-editor-sidebar-file-list">
            {hasShellAndWorkspace ? (
              gitUnavailableReason === "none" ? (
                <div className="ref-editor-sidebar-empty">
                  <p className="ref-editor-sidebar-empty-copy">
                    {t("app.gitNoChanges")}
                  </p>
                </div>
              ) : (
                <div className="ref-editor-sidebar-empty">
                  <GitUnavailableState
                    detail={gitLines[0] ?? ""}
                    reason={gitUnavailableReason}
                    t={t}
                  />
                </div>
              )
            ) : (
              <div className="ref-editor-sidebar-empty">
                <p className="ref-editor-sidebar-empty-copy">
                  {t("app.explorerPlaceholder")}
                </p>
                <button
                  className="ref-open-workspace ref-open-workspace--inline"
                  onClick={() => setWorkspacePickerOpen(true)}
                  type="button"
                >
                  {t("app.openWorkspace")}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EditorGitScmPathList
          editorSidebarSelectedRel={editorSidebarSelectedRel.replace(
            /\\/g,
            "/"
          )}
          gitPathStatus={gitPathStatus}
          onExplorerOpenFile={onExplorerOpenFile}
          paths={gitChangedPaths}
          t={t}
          workspaceBasename={workspaceBasename}
        />
      )}
    </>
  );
});

/** 仅订阅 Git Files，使资源管理器装饰与左侧栏其它区（search/git tab）在 fullStatus 时解耦 */
const EditorWorkspaceExplorerGate = memo(function EditorWorkspaceExplorerGate({
  shell,
  workspace,
  editorSidebarSelectedRel,
  workspaceExplorerActions,
  onExplorerOpenFile,
}: {
  shell: Shell;
  workspace: string;
  editorSidebarSelectedRel: string;
  workspaceExplorerActions: WorkspaceExplorerActions | null;
  onExplorerOpenFile: (rel: string) => void;
}) {
  const { gitPathStatus } = useAppShellGitFiles();
  const { treeEpoch } = useAppShellGitMeta();
  return (
    <WorkspaceExplorer
      directoryIconMode="hidden"
      explorerActions={workspaceExplorerActions}
      indentBase={0}
      indentStep={8}
      key={workspace}
      onOpenFile={onExplorerOpenFile}
      pathStatus={gitPathStatus}
      selectedRel={editorSidebarSelectedRel}
      shell={shell}
      treeEpoch={treeEpoch}
    />
  );
});

interface EditorLeftSidebarProps {
  editorExplorerCollapsed: boolean;
  editorExplorerScrollRef: RefObject<HTMLDivElement | null>;
  editorLeftSidebarView: "explorer" | "search" | "git";
  editorSidebarSearchInputRef: RefObject<HTMLInputElement | null>;
  editorSidebarSearchQuery: string;
  editorSidebarSearchResults: SearchResult[];
  editorSidebarSelectedRel: string;
  editorSidebarWorkspaceLabel: string;
  fileMenuNewFile: () => void;
  ipcOk: string;
  normalizedEditorSidebarSearchQuery: string;
  onExplorerOpenFile: (rel: string) => void;
  openSettingsPage: (nav: SettingsNavId) => void;
  revealWorkspaceInOs: (path: string) => void;
  setEditorLeftSidebarView: (v: "explorer" | "search" | "git") => void;
  setEditorSidebarSearchQuery: (q: string) => void;
  setWorkspacePickerOpen: (v: boolean) => void;
  shell: Shell | undefined;
  toggleEditorExplorerCollapsed: () => void;
  workspace: string | null;
  workspaceBasename: string;
  workspaceExplorerActions: WorkspaceExplorerActions | null;
}

export const EditorLeftSidebar = memo(function EditorLeftSidebar({
  shell,
  workspace,
  workspaceBasename,
  ipcOk,
  editorLeftSidebarView,
  setEditorLeftSidebarView,
  editorExplorerCollapsed,
  toggleEditorExplorerCollapsed,
  editorSidebarWorkspaceLabel,
  editorSidebarSelectedRel,
  editorExplorerScrollRef,
  workspaceExplorerActions,
  editorSidebarSearchQuery,
  setEditorSidebarSearchQuery,
  normalizedEditorSidebarSearchQuery,
  editorSidebarSearchResults,
  editorSidebarSearchInputRef,
  fileMenuNewFile,
  revealWorkspaceInOs,
  onExplorerOpenFile,
  setWorkspacePickerOpen,
  openSettingsPage,
}: EditorLeftSidebarProps) {
  const { t } = useI18n();
  const hasShellAndWorkspace = Boolean(shell && workspace);
  const activateGitView = useCallback(() => {
    setEditorLeftSidebarView("git");
  }, [setEditorLeftSidebarView]);

  return (
    <div className="ref-left-editor-nest">
      <div
        aria-label={t("app.rightSidebarViews")}
        className="ref-editor-activity-bar"
      >
        <button
          aria-label={t("app.tabExplorer")}
          aria-pressed={editorLeftSidebarView === "explorer"}
          className={`ref-editor-sidebar-tab ${editorLeftSidebarView === "explorer" ? "is-active" : ""}`}
          onClick={() => setEditorLeftSidebarView("explorer")}
          title={t("app.tabExplorer")}
          type="button"
        >
          <IconExplorer />
        </button>
        <button
          aria-label={t("app.tabSearch")}
          aria-pressed={editorLeftSidebarView === "search"}
          className={`ref-editor-sidebar-tab ${editorLeftSidebarView === "search" ? "is-active" : ""}`}
          onClick={() => setEditorLeftSidebarView("search")}
          title={t("app.tabSearch")}
          type="button"
        >
          <IconSearch />
        </button>
        <EditorGitTabButton
          isActive={editorLeftSidebarView === "git"}
          onActivate={activateGitView}
        />
        <div aria-hidden className="ref-editor-activity-spacer" />
        <button
          aria-label={t("settings.nav.plugins")}
          className="ref-editor-sidebar-tab"
          onClick={() => openSettingsPage("plugins")}
          title={t("settings.nav.plugins")}
          type="button"
        >
          <IconPlugin />
        </button>
        <button
          aria-label={t("app.openWorkspace")}
          className="ref-editor-sidebar-tab"
          onClick={() => setWorkspacePickerOpen(true)}
          title={t("app.openWorkspace")}
          type="button"
        >
          <IconChevron />
        </button>
      </div>

      <div className="ref-editor-sidebar-pane">
        {editorLeftSidebarView === "explorer" ? (
          <>
            <div className="ref-editor-sidebar-section-bar">
              <button
                aria-expanded={!editorExplorerCollapsed}
                className="ref-editor-sidebar-section-toggle"
                onClick={(event) => {
                  event.currentTarget.blur();
                  toggleEditorExplorerCollapsed();
                }}
                type="button"
              >
                <div className="ref-editor-sidebar-section-title">
                  <IconChevron className="ref-editor-sidebar-section-chevron" />
                  <span className="ref-editor-sidebar-section-name">
                    {editorSidebarWorkspaceLabel}
                  </span>
                </div>
              </button>
              {hasShellAndWorkspace ? (
                <div className="ref-editor-sidebar-section-actions">
                  <button
                    aria-label={t("app.fileMenu.newFile")}
                    className="ref-editor-sidebar-action"
                    onClick={fileMenuNewFile}
                    title={t("app.fileMenu.newFile")}
                    type="button"
                  >
                    <IconNewFile />
                  </button>
                  <button
                    aria-label={t("app.openWorkspace")}
                    className="ref-editor-sidebar-action"
                    onClick={() => setWorkspacePickerOpen(true)}
                    title={t("app.openWorkspace")}
                    type="button"
                  >
                    <IconNewFolder />
                  </button>
                  <EditorExplorerGitRefreshButton />
                  <button
                    aria-label={t("app.workspaceMenuOpenInExplorer")}
                    className="ref-editor-sidebar-action"
                    onClick={() => revealWorkspaceInOs(workspace!)}
                    title={t("app.workspaceMenuOpenInExplorer")}
                    type="button"
                  >
                    <IconArrowUpRight />
                  </button>
                </div>
              ) : null}
            </div>
            <div
              className={`ref-editor-sidebar-scroll ref-editor-sidebar-scroll--explorer ${
                editorExplorerCollapsed ? "is-collapsed" : ""
              }`}
              ref={editorExplorerScrollRef}
            >
              {hasShellAndWorkspace ? (
                <EditorWorkspaceExplorerGate
                  editorSidebarSelectedRel={editorSidebarSelectedRel}
                  onExplorerOpenFile={onExplorerOpenFile}
                  shell={shell!}
                  workspace={workspace!}
                  workspaceExplorerActions={workspaceExplorerActions}
                />
              ) : (
                <div className="ref-editor-sidebar-empty">
                  <p className="ref-editor-sidebar-empty-copy">
                    {t("app.explorerPlaceholder")}
                  </p>
                  <button
                    className="ref-open-workspace ref-open-workspace--inline"
                    onClick={() => setWorkspacePickerOpen(true)}
                    type="button"
                  >
                    {t("app.openWorkspace")}
                  </button>
                  <div className="ref-ipc-hint">{ipcOk}</div>
                </div>
              )}
            </div>
          </>
        ) : null}

        {editorLeftSidebarView === "search" ? (
          <>
            <div className="ref-editor-sidebar-section-bar">
              <div className="ref-editor-sidebar-section-title">
                <span className="ref-editor-sidebar-section-name">
                  {t("app.tabSearch")}
                </span>
              </div>
            </div>
            <div className="ref-editor-sidebar-search-field">
              <IconSearch className="ref-editor-sidebar-search-icon" />
              <input
                aria-label={t("app.tabSearch")}
                className="ref-editor-sidebar-search-input"
                onChange={(e) => setEditorSidebarSearchQuery(e.target.value)}
                placeholder={t("app.editorSidebarSearchPlaceholder")}
                ref={editorSidebarSearchInputRef}
                type="search"
                value={editorSidebarSearchQuery}
              />
            </div>
            <div className="ref-editor-sidebar-scroll ref-editor-sidebar-scroll--list">
              <div className="ref-editor-sidebar-file-list">
                {hasShellAndWorkspace ? (
                  normalizedEditorSidebarSearchQuery ? (
                    editorSidebarSearchResults.length === 0 ? (
                      <div className="ref-editor-sidebar-empty">
                        <p className="ref-editor-sidebar-empty-copy">
                          {t("app.editorSidebarSearchEmpty")}
                        </p>
                      </div>
                    ) : (
                      editorSidebarSearchResults.map((result) => (
                        <button
                          className={`ref-editor-sidebar-file-row ${editorSidebarSelectedRel === result.rel ? "is-active" : ""}`}
                          key={result.rel}
                          onClick={() => onExplorerOpenFile(result.rel)}
                          title={result.rel}
                          type="button"
                        >
                          <span
                            aria-hidden
                            className="ref-editor-sidebar-file-icon"
                          >
                            <FileTypeIcon
                              fileName={result.fileName}
                              isDirectory={false}
                            />
                          </span>
                          <span className="ref-editor-sidebar-file-main">
                            <span className="ref-editor-sidebar-file-name">
                              {result.fileName}
                            </span>
                            <span className="ref-editor-sidebar-file-path">
                              {result.dir || workspaceBasename}
                            </span>
                          </span>
                        </button>
                      ))
                    )
                  ) : (
                    <div className="ref-editor-sidebar-empty">
                      <p className="ref-editor-sidebar-empty-copy">
                        {t("app.editorSidebarSearchHint")}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="ref-editor-sidebar-empty">
                    <p className="ref-editor-sidebar-empty-copy">
                      {t("app.explorerPlaceholder")}
                    </p>
                    <button
                      className="ref-open-workspace ref-open-workspace--inline"
                      onClick={() => setWorkspacePickerOpen(true)}
                      type="button"
                    >
                      {t("app.openWorkspace")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {editorLeftSidebarView === "git" ? (
          <EditorLeftSidebarGitPane
            editorSidebarSelectedRel={editorSidebarSelectedRel}
            hasShellAndWorkspace={hasShellAndWorkspace}
            onExplorerOpenFile={onExplorerOpenFile}
            setWorkspacePickerOpen={setWorkspacePickerOpen}
            workspaceBasename={workspaceBasename}
          />
        ) : null}
      </div>
    </div>
  );
});
