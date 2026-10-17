import { memo, type RefObject, useState } from "react";
import { AboutDialog } from "../AboutDialog";
import { BrandLogo } from "../BrandLogo";
import type { MenubarMenuId } from "../hooks/useMenubarMenuReducer";
import type { TFunction } from "../i18n";
import { IconChevron, IconSearch, IconSettings } from "../icons";
import { MenubarFileMenu } from "../MenubarFileMenu";
import { MenubarWindowMenu } from "../MenubarWindowMenu";
import {
  quickOpenPrimaryShortcutLabel,
  saveShortcutLabel,
} from "../quickOpenPalette";
import type { ShellLayoutMode } from "./shellLayoutStorage";

export type AppShellMenubarProps = {
  layoutMode: ShellLayoutMode;
  hasAgentLayout: boolean;
  hasEditorLayout: boolean;
  t: TFunction;
  shell: Window["maiShell"] | undefined;
  workspace: string | null;
  folderRecents: string[];
  activeTabId: string | null;
  windowMaximized: boolean;
  fileMenuRef: RefObject<HTMLDivElement | null>;
  editMenuRef: RefObject<HTMLDivElement | null>;
  viewMenuRef: RefObject<HTMLDivElement | null>;
  windowMenuRef: RefObject<HTMLDivElement | null>;
  terminalMenuRef: RefObject<HTMLDivElement | null>;
  helpMenuRef: RefObject<HTMLDivElement | null>;
  fileMenuOpen: boolean;
  editMenuOpen: boolean;
  viewMenuOpen: boolean;
  windowMenuOpen: boolean;
  terminalMenuOpen: boolean;
  helpMenuOpen: boolean;
  handleToggleFileMenu: () => void;
  handleToggleEditMenu: () => void;
  setMenubarMenu: (menu: MenubarMenuId, open: boolean) => void;
  toggleMenubarMenu: (menu: MenubarMenuId) => void;
  fileMenuNewFile: () => void | Promise<void>;
  fileMenuNewWindow: () => void | Promise<void>;
  fileMenuNewEditorWindow: () => void | Promise<void>;
  fileMenuOpenFile: () => void | Promise<void>;
  fileMenuOpenFolder: () => void | Promise<void>;
  openWorkspaceByPath: (path: string) => void | Promise<void | boolean>;
  onSaveFile: () => void | Promise<void>;
  fileMenuSaveAs: () => void | Promise<void>;
  fileMenuRevertFile: () => void | Promise<void>;
  fileMenuCloseEditor: () => void;
  closeWorkspaceFolder: () => void | Promise<void>;
  fileMenuQuit: () => void | Promise<void>;
  canEditUndoRedo: boolean;
  canEditCut: boolean;
  canEditCopy: boolean;
  canEditPaste: boolean;
  canEditSelectAll: boolean;
  executeEditAction: (
    action: "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll"
  ) => void | Promise<void>;
  toggleSidebarVisibility: () => void;
  canToggleTerminal: boolean;
  toggleTerminalVisibility: () => void;
  canToggleDiffPanel: boolean;
  toggleDiffPanelVisibility: () => void;
  openQuickOpen: (seed: string) => void;
  canGoPrevThread: boolean;
  goToPreviousThread: () => void | Promise<void>;
  canGoNextThread: boolean;
  goToNextThread: () => void | Promise<void>;
  canGoBackThread: boolean;
  goThreadBack: () => void | Promise<void>;
  canGoForwardThread: boolean;
  goThreadForward: () => void | Promise<void>;
  zoomInUi: () => void;
  zoomOutUi: () => void;
  resetUiZoom: () => void;
  toggleFullscreen: () => void | Promise<void>;
  windowMenuMinimize: () => void | Promise<void>;
  windowMenuToggleMaximize: () => void | Promise<void>;
  windowMenuCloseWindow: () => void | Promise<void>;
  spawnEditorTerminal: () => void;
  onReturnToAgentLayout: () => void;
  onEnterEditorLayout: () => void;
  handleOpenSettingsGeneral: () => void;
  handleOpenAutoUpdate: () => void;
  maiAccount?: import("../ipcTypes").MaiAccountState;
  onOpenMaiAccount?: () => void;
};

/**
 * 顶栏独立 memo：流式输出等高频更新通常不改变菜单相关 props，可跳过整块 menubar 的 reconciliation。
 */
export const AppShellMenubar = memo(function AppShellMenubar({
  layoutMode,
  hasAgentLayout,
  hasEditorLayout,
  t,
  shell,
  workspace,
  folderRecents,
  activeTabId,
  windowMaximized,
  fileMenuRef,
  editMenuRef,
  viewMenuRef,
  windowMenuRef,
  terminalMenuRef,
  helpMenuRef,
  fileMenuOpen,
  editMenuOpen,
  viewMenuOpen,
  windowMenuOpen,
  terminalMenuOpen,
  helpMenuOpen,
  handleToggleFileMenu,
  handleToggleEditMenu,
  setMenubarMenu,
  toggleMenubarMenu,
  fileMenuNewFile,
  fileMenuNewWindow,
  fileMenuNewEditorWindow,
  fileMenuOpenFile,
  fileMenuOpenFolder,
  openWorkspaceByPath,
  onSaveFile,
  fileMenuSaveAs,
  fileMenuRevertFile,
  fileMenuCloseEditor,
  closeWorkspaceFolder,
  fileMenuQuit,
  canEditUndoRedo,
  canEditCut,
  canEditCopy,
  canEditPaste,
  canEditSelectAll,
  executeEditAction,
  toggleSidebarVisibility,
  canToggleTerminal,
  toggleTerminalVisibility,
  canToggleDiffPanel,
  toggleDiffPanelVisibility,
  openQuickOpen,
  canGoPrevThread,
  goToPreviousThread,
  canGoNextThread,
  goToNextThread,
  canGoBackThread,
  goThreadBack,
  canGoForwardThread,
  goThreadForward,
  zoomInUi,
  zoomOutUi,
  resetUiZoom,
  toggleFullscreen,
  windowMenuMinimize,
  windowMenuToggleMaximize,
  windowMenuCloseWindow,
  spawnEditorTerminal,
  onReturnToAgentLayout,
  onEnterEditorLayout,
  handleOpenSettingsGeneral,
  handleOpenAutoUpdate,
  maiAccount,
  onOpenMaiAccount,
}: AppShellMenubarProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const agentLayoutLabel = hasAgentLayout
    ? t("app.openAgentLayout")
    : t("app.createAgentLayout");
  const agentLayoutAriaLabel = hasAgentLayout
    ? t("app.openAgentLayoutAria")
    : t("app.createAgentLayoutAria");
  const editorLayoutLabel = hasEditorLayout
    ? t("app.openEditorLayout")
    : t("app.createEditorLayout");
  const editorLayoutAriaLabel = hasEditorLayout
    ? t("app.openEditorLayoutAria")
    : t("app.createEditorLayoutAria");
  return (
    <header
      className={`ref-menubar ${layoutMode === "agent" ? "ref-menubar--agent" : ""}`}
    >
      <div className="ref-menubar-left">
        <div className="ref-brand-block-simple">
          <BrandLogo className="ref-brand-logo" size={22} />
        </div>
        <nav aria-label={t("app.menu")} className="ref-menu-nav">
          <div className="ref-menu-dropdown-wrap" ref={fileMenuRef}>
            <button
              aria-expanded={fileMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${fileMenuOpen ? " is-active" : ""}`}
              onClick={handleToggleFileMenu}
              type="button"
            >
              {t("app.menuFile")}
            </button>
            {fileMenuOpen ? (
              <MenubarFileMenu
                canCloseFolder={!!shell && !!workspace}
                canEditorClose={!!activeTabId}
                canSave={false}
                folderRecents={folderRecents}
                hasWorkspace={!!workspace}
                isDesktopShell={!!shell}
                onClose={() => setMenubarMenu("file", false)}
                onCloseEditor={() => fileMenuCloseEditor()}
                onCloseFolder={() => void closeWorkspaceFolder()}
                onNewEditorWindow={() => void fileMenuNewEditorWindow()}
                onNewFile={() => void fileMenuNewFile()}
                onNewWindow={() => void fileMenuNewWindow()}
                onOpenFile={() => void fileMenuOpenFile()}
                onOpenFolder={() => void fileMenuOpenFolder()}
                onOpenRecentPath={(p) => void openWorkspaceByPath(p)}
                onQuit={() => void fileMenuQuit()}
                onRevert={() => void fileMenuRevertFile()}
                onSave={() => void onSaveFile()}
                onSaveAs={() => void fileMenuSaveAs()}
                shortcutSave={saveShortcutLabel()}
              />
            ) : null}
          </div>
          <div className="ref-menu-dropdown-wrap" ref={editMenuRef}>
            <button
              aria-expanded={editMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${editMenuOpen ? " is-active" : ""}`}
              onClick={handleToggleEditMenu}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
            >
              {t("app.menuEdit")}
            </button>
            {editMenuOpen ? (
              <div
                aria-label={t("app.menuEdit")}
                className="ref-menu-dropdown"
                role="menu"
              >
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditUndoRedo}
                  onClick={() => {
                    void executeEditAction("undo");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.undo")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+Z</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditUndoRedo}
                  onClick={() => {
                    void executeEditAction("redo");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.redo")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+Shift+Z</kbd>
                </button>
                <div className="ref-menu-dropdown-sep" role="separator" />
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditCut}
                  onClick={() => {
                    void executeEditAction("cut");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.cut")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+X</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditCopy}
                  onClick={() => {
                    void executeEditAction("copy");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.copy")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+C</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditPaste}
                  onClick={() => {
                    void executeEditAction("paste");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.paste")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+V</kbd>
                </button>
                <div className="ref-menu-dropdown-sep" role="separator" />
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canEditSelectAll}
                  onClick={() => {
                    void executeEditAction("selectAll");
                    setMenubarMenu("edit", false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.edit.selectAll")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+A</kbd>
                </button>
              </div>
            ) : null}
          </div>
          <div className="ref-menu-dropdown-wrap" ref={viewMenuRef}>
            <button
              aria-expanded={viewMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${viewMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                toggleMenubarMenu("view");
              }}
              type="button"
            >
              {t("app.menuView")}
            </button>
            {viewMenuOpen ? (
              <div
                aria-label={t("app.menuView")}
                className="ref-menu-dropdown"
                role="menu"
              >
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    toggleSidebarVisibility();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.toggleSidebar")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+B</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canToggleTerminal}
                  onClick={() => {
                    toggleTerminalVisibility();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.toggleTerminal")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+J</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canToggleDiffPanel}
                  onClick={() => {
                    toggleDiffPanelVisibility();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.toggleDiffPanel")}</span>
                  <kbd className="ref-menu-kbd">Alt+Ctrl+B</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    openQuickOpen("");
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.find")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+F</kbd>
                </button>
                <div className="ref-menu-dropdown-sep" role="separator" />
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canGoPrevThread}
                  onClick={() => {
                    void goToPreviousThread();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.previousThread")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+Shift+[</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canGoNextThread}
                  onClick={() => {
                    void goToNextThread();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.nextThread")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+Shift+]</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canGoBackThread}
                  onClick={() => {
                    void goThreadBack();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.back")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+[</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  disabled={!canGoForwardThread}
                  onClick={() => {
                    void goThreadForward();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.forward")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+]</kbd>
                </button>
                <div className="ref-menu-dropdown-sep" role="separator" />
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    zoomInUi();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.zoomIn")}</span>
                  <kbd className="ref-menu-kbd">Ctrl++</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    zoomOutUi();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.zoomOut")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+-</kbd>
                </button>
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    resetUiZoom();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.actualSize")}</span>
                  <kbd className="ref-menu-kbd">Ctrl+0</kbd>
                </button>
                <div className="ref-menu-dropdown-sep" role="separator" />
                <button
                  className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
                  onClick={() => {
                    void toggleFullscreen();
                    setMenubarMenu("view", false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.toggleFullscreen")}</span>
                </button>
              </div>
            ) : null}
          </div>
          <div className="ref-menu-dropdown-wrap" ref={windowMenuRef}>
            <button
              aria-expanded={windowMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${windowMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                toggleMenubarMenu("window");
              }}
              type="button"
            >
              {t("app.menuWindow")}
            </button>
            {windowMenuOpen ? (
              <MenubarWindowMenu
                isDesktopShell={!!shell}
                onClose={() => setMenubarMenu("window", false)}
                onCloseWindow={() => void windowMenuCloseWindow()}
                onMinimize={() => void windowMenuMinimize()}
                onNewWindow={() => void fileMenuNewWindow()}
                onToggleMaximize={() => void windowMenuToggleMaximize()}
                windowMaximized={windowMaximized}
              />
            ) : null}
          </div>
          <div className="ref-menu-dropdown-wrap" ref={helpMenuRef}>
            <button
              aria-expanded={helpMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${helpMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                toggleMenubarMenu("help");
              }}
              type="button"
            >
              {t("app.menuHelp")}
            </button>
            {helpMenuOpen ? (
              <HelpMenuDropdown
                onClose={() => setMenubarMenu("help", false)}
                onOpenAbout={() => {
                  setMenubarMenu("help", false);
                  setAboutOpen(true);
                }}
                onOpenAutoUpdate={() => {
                  setMenubarMenu("help", false);
                  handleOpenAutoUpdate();
                }}
                shell={shell}
                t={t}
              />
            ) : null}
          </div>
          {layoutMode === "editor" && workspace ? (
            <div className="ref-menu-dropdown-wrap" ref={terminalMenuRef}>
              <button
                aria-expanded={terminalMenuOpen}
                aria-haspopup="menu"
                className={`ref-menu-item${terminalMenuOpen ? " is-active" : ""}`}
                onClick={() => {
                  toggleMenubarMenu("terminal");
                }}
                type="button"
              >
                {t("app.menuTerminal")}
                <IconChevron className="ref-menu-chevron" />
              </button>
              {terminalMenuOpen ? (
                <div className="ref-menu-dropdown" role="menu">
                  <button
                    className="ref-menu-dropdown-item"
                    onClick={() => spawnEditorTerminal()}
                    role="menuitem"
                    type="button"
                  >
                    {t("app.menuNewTerminal")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
      </div>
      <div
        className={`ref-menubar-center ${layoutMode === "agent" ? "ref-menubar-center--hidden" : ""}`}
      >
        {layoutMode === "agent" ? null : (
          <button
            aria-label={t("quickOpen.menubarAria")}
            className="ref-global-search-btn"
            onClick={() => openQuickOpen("")}
            title={t("quickOpen.placeholder")}
            type="button"
          >
            <IconSearch className="ref-global-search-icon" />
            <span className="ref-global-search-text">
              {t("quickOpen.menubarSummary")}
            </span>
            <kbd className="ref-global-search-kbd">
              {quickOpenPrimaryShortcutLabel()}
            </kbd>
          </button>
        )}
      </div>
      <div className="ref-menubar-right">
        {onOpenMaiAccount ? (
          <button
            className="ref-menubar-account-btn"
            onClick={onOpenMaiAccount}
            style={{
              alignItems: "center",
              background: maiAccount?.jwtToken
                ? "rgba(59, 130, 246, 0.12)"
                : "rgba(255, 255, 255, 0.05)",
              border: maiAccount?.jwtToken
                ? "1px solid rgba(59, 130, 246, 0.25)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 7,
              color: "var(--fg-default, #fff)",
              cursor: "pointer",
              display: "inline-flex",
              fontSize: 12,
              fontWeight: 500,
              gap: 7,
              height: 26,
              padding: "3px 9px",
              transition: "all 0.15s ease",
            }}
            title={
              maiAccount?.jwtToken
                ? `${maiAccount.user?.username || "mAI Coder"} (${maiAccount.user?.tier || "Free"})`
                : t("mai.login")
            }
            type="button"
          >
            {maiAccount?.user?.avatarUrl ? (
              <img
                alt="Avatar"
                src={maiAccount.user.avatarUrl}
                style={{
                  borderRadius: "50%",
                  height: 16,
                  objectFit: "cover",
                  width: 16,
                }}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  background: maiAccount?.jwtToken
                    ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                    : "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  color: "#fff",
                  display: "flex",
                  fontSize: 9,
                  fontWeight: 700,
                  height: 16,
                  justifyContent: "center",
                  width: 16,
                }}
              >
                {maiAccount?.user?.username
                  ? maiAccount.user.username.charAt(0).toUpperCase()
                  : "m"}
              </div>
            )}
            <span
              style={{
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {maiAccount?.user?.username ||
                (maiAccount?.jwtToken ? "mAI" : t("mai.login"))}
            </span>
            {maiAccount?.usage ? (
              <span
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  borderRadius: 4,
                  color: "#60a5fa",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 5px",
                }}
              >
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
            ) : null}
          </button>
        ) : null}
        {layoutMode === "editor" ? (
          <button
            aria-label={agentLayoutAriaLabel}
            className="ref-menubar-layout-switch-btn"
            onClick={onReturnToAgentLayout}
            title={agentLayoutLabel}
            type="button"
          >
            {agentLayoutLabel}
          </button>
        ) : (
          <button
            aria-label={editorLayoutAriaLabel}
            className="ref-menubar-layout-switch-btn"
            onClick={onEnterEditorLayout}
            title={editorLayoutLabel}
            type="button"
          >
            {editorLayoutLabel}
          </button>
        )}
        <button
          aria-label={t("app.settingsAria")}
          className="ref-icon-tile ref-settings-btn"
          onClick={handleOpenSettingsGeneral}
          title={t("app.settings")}
          type="button"
        >
          <IconSettings />
        </button>
      </div>
      <AboutDialog
        onClose={() => setAboutOpen(false)}
        open={aboutOpen}
        shell={shell}
        t={t}
      />
    </header>
  );
});

const HELP_DOC_URL = "https://github.com/mDevsLabs/Coder#readme";
const HELP_ISSUES_URL = "https://github.com/mDevsLabs/Coder/issues/new";
const HELP_RELEASES_URL = "https://github.com/mDevsLabs/Coder/releases";

type HelpMenuDropdownProps = {
  t: TFunction;
  shell: Window["maiShell"] | undefined;
  onClose: () => void;
  onOpenAutoUpdate: () => void;
  onOpenAbout: () => void;
};

function HelpMenuDropdown({
  t,
  shell,
  onClose,
  onOpenAutoUpdate,
  onOpenAbout,
}: HelpMenuDropdownProps) {
  const openExternal = (url: string) => {
    if (shell) {
      void shell.invoke("shell:openExternalUrl", url).catch(() => {});
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      aria-label={t("app.menuHelp")}
      className="ref-menu-dropdown"
      role="menu"
    >
      <button
        className="ref-menu-dropdown-item"
        onClick={() => {
          openExternal(HELP_DOC_URL);
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        {t("app.help.documentation")}
      </button>
      <button
        className="ref-menu-dropdown-item"
        onClick={() => {
          openExternal(HELP_RELEASES_URL);
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        {t("app.help.releases")}
      </button>
      <button
        className="ref-menu-dropdown-item"
        onClick={() => {
          openExternal(HELP_ISSUES_URL);
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        {t("app.help.reportIssue")}
      </button>
      <div className="ref-menu-dropdown-sep" role="separator" />
      <button
        className="ref-menu-dropdown-item"
        onClick={onOpenAutoUpdate}
        role="menuitem"
        type="button"
      >
        {t("app.help.checkForUpdates")}
      </button>
      <div className="ref-menu-dropdown-sep" role="separator" />
      <button
        className="ref-menu-dropdown-item"
        onClick={onOpenAbout}
        role="menuitem"
        type="button"
      >
        {t("app.help.about")}
      </button>
    </div>
  );
}
