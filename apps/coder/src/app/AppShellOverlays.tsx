import {
  Activity,
  type ComponentProps,
  type Dispatch,
  lazy,
  memo,
  type RefObject,
  type SetStateAction,
  Suspense,
  useCallback,
} from "react";
import type { AgentSidebarWorkspace } from "../AgentLeftSidebar";
import { BrandLogo } from "../BrandLogo";
import { ComposerAtMenu } from "../ComposerAtMenu";
import {
  type ComposerMode,
  type ComposerPlusMcpItem,
  ComposerPlusMenu,
  type ComposerPlusSkillItem,
} from "../ComposerPlusMenu";
import { ComposerSkillMenu } from "../ComposerSkillMenu";
import { ComposerSlashMenu } from "../ComposerSlashMenu";
import type { CaretRectSnapshot } from "../caretRectSnapshot";
import type { AtMenuItem } from "../composerAtMention";
import { GitBranchPickerDropdown } from "../GitBranchPickerDropdown";
import type { StreamingToast } from "../hooks/useStreamingChat";
import type { TFunction } from "../i18n";
import { IconArrowUpRight, IconCheck, IconPencil, IconTrash } from "../icons";
import type { ThinkingLevel } from "../ipcTypes";
import {
  ModelPickerDropdown,
  type ModelPickerItem,
} from "../ModelPickerDropdown";
import { OpenWorkspaceModal } from "../OpenWorkspaceModal";
import { QuickOpenPalette } from "../quickOpenPalette";
import type { SettingsPageProps } from "../SettingsPage";
import { useAppShellGitActions, useAppShellGitMeta } from "./appShellContexts";
import type { ShellLayoutMode } from "./shellLayoutStorage";

const DrawerPtyTerminal = lazy(() =>
  import("../DrawerPtyTerminal").then((m) => ({ default: m.DrawerPtyTerminal }))
);
const SettingsPage = lazy(() =>
  import("../SettingsPage").then((m) => ({ default: m.SettingsPage }))
);

/** 分支选择器：内部订阅 Git Meta/Actions，避免父组件因 pathStatus/diff 等大对象更新而带动整层 overlays props 失效 */
function GitBranchPickerOverlaySection({
  shell,
  composerGitBranchAnchorRef,
  showTransientToast,
}: {
  shell: Window["maiShell"] | undefined;
  composerGitBranchAnchorRef: RefObject<HTMLElement | null>;
  showTransientToast: (ok: boolean, text: string, durationMs?: number) => void;
}) {
  const {
    gitBranchPickerOpen,
    gitStatusOk,
    gitBranchList,
    gitBranchListCurrent,
    gitBranch,
  } = useAppShellGitMeta();
  const { refreshGit, onGitBranchListFresh, setGitBranchPickerOpen } =
    useAppShellGitActions();
  const handleCloseGitBranchPicker = useCallback(
    () => setGitBranchPickerOpen(false),
    [setGitBranchPickerOpen]
  );
  return (
    <GitBranchPickerDropdown
      anchorRef={composerGitBranchAnchorRef}
      branches={gitBranchList}
      displayBranch={gitBranch}
      listCurrent={gitBranchListCurrent}
      onAfterGitChange={() => void refreshGit()}
      onBranchListFresh={onGitBranchListFresh}
      onClose={handleCloseGitBranchPicker}
      onNotify={showTransientToast}
      open={gitBranchPickerOpen}
      repoReady={gitStatusOk}
      shell={shell ?? null}
    />
  );
}

export type AppShellOverlaysProps = {
  t: TFunction;
  shell: Window["maiShell"] | undefined;
  workspace: string | null;
  homePath: string;
  workspaceFileList: string[];
  homeRecents: string[];
  filePath: string;
  searchWorkspaceSymbolsFn:
    | ((
        query: string
      ) => Promise<
        { name: string; path: string; line: number; kind: string }[]
      >)
    | undefined;
  applyWorkspacePath: (path: string) => void | Promise<void>;
  openWorkspaceByPath: (path: string) => void | Promise<void | boolean>;
  /** 工作区浮动菜单 */
  workspaceMenuRef: RefObject<HTMLDivElement | null>;
  activeWorkspaceMenuItem: AgentSidebarWorkspace | null;
  workspaceMenuPosition: { top: number; left: number } | null;
  revealWorkspaceInOs: (path: string) => void | Promise<void>;
  beginWorkspaceAliasEdit: (path: string) => void;
  removeWorkspaceFromSidebar: (path: string) => void;
  /** 终端抽屉 */
  workspaceToolsOpen: boolean;
  handleCloseWorkspaceTools: () => void;
  /** 打开工作区 */
  workspacePickerOpen: boolean;
  handleCloseWorkspacePicker: () => void;
  setWorkspacePickerOpen: Dispatch<SetStateAction<boolean>>;
  /** Quick open */
  quickOpenOpen: boolean;
  handleCloseQuickOpen: () => void;
  quickOpenRecentFiles: string[];
  quickOpenSeed: string;
  onExplorerOpenFile: (
    rel: string,
    a?: number,
    b?: number
  ) => void | Promise<void>;
  handleOpenSettingsGeneral: () => void;
  focusSearchSidebarFromQuickOpen: (q: string) => void;
  goToLineInEditor: (line: number) => void;
  /** 设置全屏 */
  settingsPageOpen: boolean;
  settingsOpenPending: boolean;
  closeSettingsPage: () => void | Promise<void>;
  settingsPageProps: SettingsPageProps;
  /** 布局切换遮罩 */
  layoutSwitchPending: boolean;
  layoutSwitchTarget: ShellLayoutMode | null;
  /** Composer 相关浮层 */
  plusMenuOpen: boolean;
  handleClosePlusMenu: () => void;
  plusMenuAnchorRefForDropdown: RefObject<HTMLElement | null>;
  composerMode: ComposerMode;
  setComposerModePersist: (mode: ComposerMode) => void;
  onComposerPickImages: () => Promise<void> | void;
  composerPlusSkills: ComposerPlusSkillItem[];
  onComposerInsertSkill: (slug: string, name: string) => Promise<void> | void;
  handleOpenSettingsRules: () => void;
  composerPlusMcpServers: ComposerPlusMcpItem[];
  onComposerToggleMcpServer: (
    id: string,
    nextEnabled: boolean
  ) => Promise<void> | void;
  handleOpenSettingsTools: () => void;
  composerGitBranchAnchorRef: RefObject<HTMLElement | null>;
  showTransientToast: (ok: boolean, text: string, durationMs?: number) => void;
  modelPickerOpen: boolean;
  handleCloseModelPicker: () => void;
  modelPickerAnchorRefForDropdown: RefObject<HTMLElement | null>;
  modelPickerItems: ModelPickerItem[];
  defaultModel: string;
  onPickDefaultModel: (id: string) => void;
  handleOpenSettingsModels: () => void;
  thinkingByModelId: Record<string, ThinkingLevel>;
  setThinkingByModelId: Dispatch<SetStateAction<Record<string, ThinkingLevel>>>;
  atMenuOpen: boolean;
  atMenuItems: AtMenuItem[];
  atMenuFileSearchLoading?: boolean;
  atMenuHighlight: number;
  atCaretRect: CaretRectSnapshot | null;
  setAtMenuHighlight: (i: number) => void;
  applyAtSelection: (item: AtMenuItem) => void;
  closeAtMenu: () => void;
  skillMenuOpen: boolean;
  skillQuery: string;
  skillMenuItems: ComponentProps<typeof ComposerSkillMenu>["items"];
  skillMenuHighlight: number;
  skillCaretRect: CaretRectSnapshot | null;
  setSkillMenuHighlight: (i: number) => void;
  applySkillSelection: ComponentProps<typeof ComposerSkillMenu>["onSelect"];
  closeSkillMenu: () => void;
  slashMenuOpen: boolean;
  slashQuery: string;
  slashMenuItems: ComponentProps<typeof ComposerSlashMenu>["items"];
  slashMenuHighlight: number;
  slashCaretRect: CaretRectSnapshot | null;
  setSlashMenuHighlight: (i: number) => void;
  applySlashSelection: ComponentProps<typeof ComposerSlashMenu>["onSelect"];
  closeSlashMenu: () => void;
  /** Toast */
  saveToastVisible: boolean;
  saveToastKey: number;
  subAgentBgToast: StreamingToast;
  composerAttachErr: string | null;
  onSubAgentToastClick?: (threadId: string, agentId: string) => void;
};

/**
 * 模态、抽屉、Composer 浮层与轻提示；memo 后与主工作区解耦，
 * 流式输出仅改聊天区时若各 overlay 的 props 引用稳定可跳过本 subtree。
 */
export const AppShellOverlays = memo(function AppShellOverlays({
  t,
  shell,
  workspace,
  homePath,
  workspaceFileList,
  homeRecents,
  filePath,
  searchWorkspaceSymbolsFn,
  applyWorkspacePath,
  openWorkspaceByPath,
  workspaceMenuRef,
  activeWorkspaceMenuItem,
  workspaceMenuPosition,
  revealWorkspaceInOs,
  beginWorkspaceAliasEdit,
  removeWorkspaceFromSidebar,
  workspaceToolsOpen,
  handleCloseWorkspaceTools,
  workspacePickerOpen,
  handleCloseWorkspacePicker,
  setWorkspacePickerOpen,
  quickOpenOpen,
  handleCloseQuickOpen,
  quickOpenRecentFiles,
  quickOpenSeed,
  onExplorerOpenFile,
  handleOpenSettingsGeneral,
  focusSearchSidebarFromQuickOpen,
  goToLineInEditor,
  settingsPageOpen,
  settingsOpenPending,
  closeSettingsPage,
  settingsPageProps,
  layoutSwitchPending,
  layoutSwitchTarget,
  plusMenuOpen,
  handleClosePlusMenu,
  plusMenuAnchorRefForDropdown,
  composerMode,
  setComposerModePersist,
  onComposerPickImages,
  composerPlusSkills,
  onComposerInsertSkill,
  handleOpenSettingsRules,
  composerPlusMcpServers,
  onComposerToggleMcpServer,
  handleOpenSettingsTools,
  composerGitBranchAnchorRef,
  showTransientToast,
  modelPickerOpen,
  handleCloseModelPicker,
  modelPickerAnchorRefForDropdown,
  modelPickerItems,
  defaultModel,
  onPickDefaultModel,
  handleOpenSettingsModels,
  thinkingByModelId,
  setThinkingByModelId,
  atMenuOpen,
  atMenuItems,
  atMenuFileSearchLoading = false,
  atMenuHighlight,
  atCaretRect,
  setAtMenuHighlight,
  applyAtSelection,
  closeAtMenu,
  skillMenuOpen,
  skillQuery,
  skillMenuItems,
  skillMenuHighlight,
  skillCaretRect,
  setSkillMenuHighlight,
  applySkillSelection,
  closeSkillMenu,
  slashMenuOpen,
  slashQuery,
  slashMenuItems,
  slashMenuHighlight,
  slashCaretRect,
  setSlashMenuHighlight,
  applySlashSelection,
  closeSlashMenu,
  saveToastVisible,
  saveToastKey,
  subAgentBgToast,
  composerAttachErr,
  onSubAgentToastClick,
}: AppShellOverlaysProps) {
  return (
    <>
      {activeWorkspaceMenuItem && workspaceMenuPosition ? (
        <div
          className="ref-agent-workspace-menu ref-agent-workspace-menu--floating"
          ref={workspaceMenuRef}
          role="menu"
          style={{
            left: workspaceMenuPosition.left,
            top: workspaceMenuPosition.top,
            transform: "translateX(-100%)",
          }}
        >
          <button
            className="ref-agent-workspace-menu-item"
            onClick={() =>
              void revealWorkspaceInOs(activeWorkspaceMenuItem.path)
            }
            role="menuitem"
            type="button"
          >
            <span aria-hidden className="ref-agent-workspace-menu-item-icon">
              <IconArrowUpRight />
            </span>
            <span className="ref-agent-workspace-menu-item-copy">
              <span className="ref-agent-workspace-menu-item-label">
                {t("app.workspaceMenuOpenInExplorer")}
              </span>
            </span>
          </button>
          <button
            className="ref-agent-workspace-menu-item"
            onClick={() =>
              beginWorkspaceAliasEdit(activeWorkspaceMenuItem.path)
            }
            role="menuitem"
            type="button"
          >
            <span aria-hidden className="ref-agent-workspace-menu-item-icon">
              <IconPencil />
            </span>
            <span className="ref-agent-workspace-menu-item-copy">
              <span className="ref-agent-workspace-menu-item-label">
                {t("app.workspaceMenuEditName")}
              </span>
            </span>
          </button>
          <button
            className="ref-agent-workspace-menu-item is-destructive"
            onClick={() =>
              removeWorkspaceFromSidebar(activeWorkspaceMenuItem.path)
            }
            role="menuitem"
            type="button"
          >
            <span aria-hidden className="ref-agent-workspace-menu-item-icon">
              <IconTrash />
            </span>
            <span className="ref-agent-workspace-menu-item-copy">
              <span className="ref-agent-workspace-menu-item-label">
                {t("app.workspaceMenuRemove")}
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {workspaceToolsOpen ? (
        <section className="ref-drawer ref-drawer--terminal-only">
          <div className="ref-drawer-head">
            <span className="ref-drawer-title">{t("app.terminalDrawer")}</span>
            <button
              className="ref-drawer-close"
              onClick={handleCloseWorkspaceTools}
              type="button"
            >
              {t("app.terminalCollapse")}
            </button>
          </div>
          <div className="ref-drawer-terminal">
            <Suspense
              fallback={<div className="ref-drawer-terminal-loading" />}
            >
              <DrawerPtyTerminal placeholder={t("app.terminalStarting")} />
            </Suspense>
          </div>
        </section>
      ) : null}

      <OpenWorkspaceModal
        homePath={homePath}
        onClose={handleCloseWorkspacePicker}
        onWorkspaceOpened={(p) => void applyWorkspacePath(p)}
        open={workspacePickerOpen}
        shell={shell}
      />

      <QuickOpenPalette
        activeFilePath={filePath.trim()}
        homeRecentFolders={homeRecents}
        initialQuery={quickOpenSeed}
        onClose={handleCloseQuickOpen}
        onFocusSearchSidebar={(q) => focusSearchSidebarFromQuickOpen(q)}
        onGoToLine={goToLineInEditor}
        onOpenFile={(rel, a, b) => void onExplorerOpenFile(rel, a, b)}
        onOpenSettings={handleOpenSettingsGeneral}
        onOpenWorkspaceFolder={(p) => void openWorkspaceByPath(p)}
        onOpenWorkspacePicker={() => setWorkspacePickerOpen(true)}
        open={quickOpenOpen}
        recentFilePaths={quickOpenRecentFiles}
        searchWorkspaceSymbols={shell ? searchWorkspaceSymbolsFn : undefined}
        t={t}
        workspaceFiles={workspaceFileList}
        workspaceOpen={!!workspace}
      />

      <Activity
        mode={settingsPageOpen || settingsOpenPending ? "visible" : "hidden"}
      >
        <div
          className="ref-settings-backdrop"
          onClick={() => void closeSettingsPage()}
          role="presentation"
        >
          <div
            className="ref-settings-mount"
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense
              fallback={
                <div
                  aria-live="polite"
                  className="ref-settings-open-loading"
                  role="status"
                >
                  <span
                    aria-hidden
                    className="ref-settings-open-loading-spinner"
                  />
                  <span>{t("common.loading")}</span>
                </div>
              }
            >
              <SettingsPage {...settingsPageProps} />
            </Suspense>
          </div>
        </div>
      </Activity>

      {layoutSwitchPending && layoutSwitchTarget === "editor" ? (
        <div
          aria-live="polite"
          className="ref-layout-switch-loading"
          role="status"
        >
          <div className="ref-layout-switch-loading-card">
            <BrandLogo className="ref-layout-switch-loading-logo" size={34} />
            <div className="ref-layout-switch-loading-copy">
              <strong>{t("app.switchingToEditor")}</strong>
              <span>{t("app.switchingToEditorHint")}</span>
            </div>
            <span aria-hidden className="ref-layout-switch-loading-spinner" />
          </div>
        </div>
      ) : null}

      <ComposerPlusMenu
        anchorRef={plusMenuAnchorRefForDropdown}
        mcpServers={composerPlusMcpServers}
        mode={composerMode}
        onClose={handleClosePlusMenu}
        onInsertSkill={onComposerInsertSkill}
        onOpenMcpSettings={handleOpenSettingsTools}
        onOpenSkillSettings={handleOpenSettingsRules}
        onPickImages={onComposerPickImages}
        onSelectMode={setComposerModePersist}
        onToggleMcpServer={onComposerToggleMcpServer}
        open={plusMenuOpen}
        skills={composerPlusSkills}
      />

      <GitBranchPickerOverlaySection
        composerGitBranchAnchorRef={composerGitBranchAnchorRef}
        shell={shell}
        showTransientToast={showTransientToast}
      />

      <ModelPickerDropdown
        anchorRef={modelPickerAnchorRefForDropdown}
        getThinkingLevel={(id) => thinkingByModelId[id] ?? "medium"}
        items={modelPickerItems}
        onAddModels={handleOpenSettingsModels}
        onClose={handleCloseModelPicker}
        onNavigateToSettings={handleOpenSettingsModels}
        onSelectModel={(id) => void onPickDefaultModel(id)}
        onThinkingLevelChange={(modelId, v) => {
          setThinkingByModelId((prev) => ({ ...prev, [modelId]: v }));
          if (shell) {
            void shell.invoke("settings:set", {
              models: { thinkingByModelId: { [modelId]: v } },
            });
          }
        }}
        open={modelPickerOpen}
        selectedId={defaultModel}
      />

      <ComposerAtMenu
        caretRect={atCaretRect}
        fileSearchLoading={atMenuFileSearchLoading}
        highlightIndex={atMenuHighlight}
        items={atMenuItems}
        onClose={closeAtMenu}
        onHighlight={setAtMenuHighlight}
        onSelect={applyAtSelection}
        open={atMenuOpen}
      />

      <ComposerSlashMenu
        caretRect={slashCaretRect}
        highlightIndex={slashMenuHighlight}
        items={slashMenuItems}
        onClose={closeSlashMenu}
        onHighlight={setSlashMenuHighlight}
        onSelect={applySlashSelection}
        open={slashMenuOpen}
        query={slashQuery}
      />

      <ComposerSkillMenu
        caretRect={skillCaretRect}
        highlightIndex={skillMenuHighlight}
        items={skillMenuItems}
        onClose={closeSkillMenu}
        onHighlight={setSkillMenuHighlight}
        onSelect={applySkillSelection}
        open={skillMenuOpen}
        query={skillQuery}
      />

      {saveToastVisible ? (
        <div
          className="ref-save-toast"
          key={saveToastKey}
          style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
        >
          Saved <IconCheck />
        </div>
      ) : null}
      {subAgentBgToast ? (
        subAgentBgToast.threadId &&
        subAgentBgToast.agentId &&
        onSubAgentToastClick ? (
          <button
            className={`ref-sub-agent-bg-toast ${subAgentBgToast.ok ? "is-ok" : "is-err"}`}
            key={subAgentBgToast.key}
            onClick={() =>
              onSubAgentToastClick(
                subAgentBgToast.threadId!,
                subAgentBgToast.agentId!
              )
            }
            role="status"
            type="button"
          >
            {subAgentBgToast.text}
          </button>
        ) : (
          <div
            className={`ref-sub-agent-bg-toast ${subAgentBgToast.ok ? "is-ok" : "is-err"}`}
            key={subAgentBgToast.key}
            role="status"
          >
            {subAgentBgToast.text}
          </div>
        )
      ) : null}
      {composerAttachErr ? (
        <div className="ref-sub-agent-bg-toast is-err" role="alert">
          {composerAttachErr}
        </div>
      ) : null}
    </>
  );
});
