import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAppShell, useAppShellT, useAppWorkspace } from "./AppContext";
import { BrandLogo } from "./BrandLogo";
import { useClickOutside } from "./hooks/useClickOutside";
import { IconChevron, IconSearch, IconSettings } from "./icons";
import { MenubarFileMenu } from "./MenubarFileMenu";
import { MenubarWindowMenu } from "./MenubarWindowMenu";
import {
  quickOpenPrimaryShortcutLabel,
  saveShortcutLabel,
} from "./quickOpenPalette";
import type { SettingsNavId } from "./SettingsPage";

export interface AppMenubarProps {
  canCloseFolder: boolean;
  canEditCopy: boolean;
  canEditCut: boolean;
  canEditorClose: boolean;
  canEditPaste: boolean;
  canEditSelectAll: boolean;
  // Edit menu
  canEditUndoRedo: boolean;
  canGoBackThread: boolean;
  canGoForwardThread: boolean;
  canGoNextThread: boolean;
  canGoPrevThread: boolean;
  canSave: boolean;
  canToggleDiffPanel: boolean;
  // View menu
  canToggleTerminal: boolean;
  executeEditAction: (
    kind: "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll"
  ) => Promise<void>;
  // File menu
  folderRecents: string[];
  goThreadBack: () => Promise<void>;
  goThreadForward: () => Promise<void>;
  goToNextThread: () => Promise<void>;
  goToPreviousThread: () => Promise<void>;
  layoutMode: "agent" | "editor";
  maiAccount?: import("./ipcTypes").MaiAccountState;
  onCloseEditor: () => void;
  onCloseFolder: () => void;
  onCloseWindow: () => void;
  onMinimize: () => void;
  onNewEditorWindow: () => void;
  onNewFile: () => void;
  onNewWindow: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onOpenMaiAccount?: () => void;
  onOpenRecentPath: (path: string) => void;
  onQuit: () => void;
  onRevert: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onToggleMaximize: () => void;
  openQuickOpen: (seed?: string) => void;
  // Settings
  openSettingsPage: (nav: SettingsNavId) => void;
  resetUiZoom: () => void;
  // Terminal menu
  spawnEditorTerminal: () => void;
  toggleDiffPanelVisibility: () => void;
  toggleFullscreen: () => Promise<void>;
  toggleSidebarVisibility: () => void;
  toggleTerminalVisibility: () => void;
  // Window menu
  windowMaximized: boolean;
  zoomInUi: () => void;
  zoomOutUi: () => void;
}

/**
 * Extracted menubar — owns its own open/close states for each menu dropdown,
 * so the parent App does NOT re-render when menus toggle.
 */
export const AppMenubar = memo(function AppMenubar(props: AppMenubarProps) {
  const shell = useAppShell();
  const workspace = useAppWorkspace();
  const t = useAppShellT();
  const {
    layoutMode,
    folderRecents,
    canSave,
    canEditorClose,
    canCloseFolder,
    onNewFile,
    onNewWindow,
    onNewEditorWindow,
    onOpenFile,
    onOpenFolder,
    onOpenRecentPath,
    onSave,
    onSaveAs,
    onRevert,
    onCloseEditor,
    onCloseFolder,
    onQuit,
    canEditUndoRedo,
    canEditCut,
    canEditCopy,
    canEditPaste,
    canEditSelectAll,
    executeEditAction,
    canToggleTerminal,
    canToggleDiffPanel,
    canGoPrevThread,
    canGoNextThread,
    canGoBackThread,
    canGoForwardThread,
    toggleSidebarVisibility,
    toggleTerminalVisibility,
    toggleDiffPanelVisibility,
    openQuickOpen,
    goToPreviousThread,
    goToNextThread,
    goThreadBack,
    goThreadForward,
    zoomInUi,
    zoomOutUi,
    resetUiZoom,
    toggleFullscreen,
    windowMaximized,
    onMinimize,
    onToggleMaximize,
    onCloseWindow,
    spawnEditorTerminal,
    openSettingsPage,
    maiAccount,
    onOpenMaiAccount,
  } = props;

  // ── Menu open/close state (local to this component) ──
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [windowMenuOpen, setWindowMenuOpen] = useState(false);
  const [terminalMenuOpen, setTerminalMenuOpen] = useState(false);

  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const windowMenuRef = useRef<HTMLDivElement>(null);
  const terminalMenuRef = useRef<HTMLDivElement>(null);

  const closeFile = useCallback(() => setFileMenuOpen(false), []);
  const closeEdit = useCallback(() => setEditMenuOpen(false), []);
  const closeView = useCallback(() => setViewMenuOpen(false), []);
  const closeWindow = useCallback(() => setWindowMenuOpen(false), []);
  const closeTerminal = useCallback(() => setTerminalMenuOpen(false), []);

  useClickOutside(fileMenuRef, fileMenuOpen, closeFile);
  useClickOutside(editMenuRef, editMenuOpen, closeEdit);
  useClickOutside(viewMenuRef, viewMenuOpen, closeView);
  useClickOutside(windowMenuRef, windowMenuOpen, closeWindow);
  useClickOutside(terminalMenuRef, terminalMenuOpen, closeTerminal);

  // Refresh windowMaximized when window menu opens (was an effect in App)
  const [localWindowMaximized, setLocalWindowMaximized] =
    useState(windowMaximized);
  useEffect(() => {
    setLocalWindowMaximized(windowMaximized);
  }, [windowMaximized]);
  useEffect(() => {
    if (!windowMenuOpen || !shell) return;
    let cancelled = false;
    void shell.invoke("app:windowGetState").then((r) => {
      if (cancelled) return;
      const o = r as { ok?: boolean; maximized?: boolean };
      if (o?.ok && typeof o.maximized === "boolean") {
        setLocalWindowMaximized(o.maximized);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [windowMenuOpen, shell]);

  const closeAllExcept = (
    keep: "file" | "edit" | "view" | "window" | "terminal"
  ) => {
    if (keep !== "file") setFileMenuOpen(false);
    if (keep !== "edit") setEditMenuOpen(false);
    if (keep !== "view") setViewMenuOpen(false);
    if (keep !== "window") setWindowMenuOpen(false);
    if (keep !== "terminal") setTerminalMenuOpen(false);
  };

  return (
    <header
      className={`ref-menubar ${layoutMode === "agent" ? "ref-menubar--agent" : ""}`}
    >
      <div className="ref-menubar-left">
        <div className="ref-brand-block-simple">
          <BrandLogo className="ref-brand-logo" size={22} />
        </div>
        <nav aria-label={t("app.menu")} className="ref-menu-nav">
          {/* ── File ── */}
          <div className="ref-menu-dropdown-wrap" ref={fileMenuRef}>
            <button
              aria-expanded={fileMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${fileMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                closeAllExcept("file");
                setFileMenuOpen((o) => !o);
              }}
              type="button"
            >
              {t("app.menuFile")}
            </button>
            {fileMenuOpen ? (
              <MenubarFileMenu
                canCloseFolder={canCloseFolder}
                canEditorClose={canEditorClose}
                canSave={canSave}
                folderRecents={folderRecents}
                hasWorkspace={!!workspace}
                isDesktopShell={!!shell}
                onClose={closeFile}
                onCloseEditor={onCloseEditor}
                onCloseFolder={onCloseFolder}
                onNewEditorWindow={onNewEditorWindow}
                onNewFile={onNewFile}
                onNewWindow={onNewWindow}
                onOpenFile={onOpenFile}
                onOpenFolder={onOpenFolder}
                onOpenRecentPath={onOpenRecentPath}
                onQuit={onQuit}
                onRevert={onRevert}
                onSave={onSave}
                onSaveAs={onSaveAs}
                shortcutSave={saveShortcutLabel()}
              />
            ) : null}
          </div>

          {/* ── Edit ── */}
          <div className="ref-menu-dropdown-wrap" ref={editMenuRef}>
            <button
              aria-expanded={editMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${editMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                closeAllExcept("edit");
                setEditMenuOpen((o) => !o);
              }}
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
                    setEditMenuOpen(false);
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
                    setEditMenuOpen(false);
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
                    setEditMenuOpen(false);
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
                    setEditMenuOpen(false);
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
                    setEditMenuOpen(false);
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
                    setEditMenuOpen(false);
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

          {/* ── View ── */}
          <div className="ref-menu-dropdown-wrap" ref={viewMenuRef}>
            <button
              aria-expanded={viewMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${viewMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                closeAllExcept("view");
                setViewMenuOpen((o) => !o);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
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
                    setViewMenuOpen(false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span>{t("app.view.toggleFullscreen")}</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* ── Window ── */}
          <div className="ref-menu-dropdown-wrap" ref={windowMenuRef}>
            <button
              aria-expanded={windowMenuOpen}
              aria-haspopup="menu"
              className={`ref-menu-item${windowMenuOpen ? " is-active" : ""}`}
              onClick={() => {
                closeAllExcept("window");
                setWindowMenuOpen((o) => !o);
              }}
              type="button"
            >
              {t("app.menuWindow")}
            </button>
            {windowMenuOpen ? (
              <MenubarWindowMenu
                isDesktopShell={!!shell}
                onClose={closeWindow}
                onCloseWindow={onCloseWindow}
                onMinimize={onMinimize}
                onNewWindow={onNewWindow}
                onToggleMaximize={onToggleMaximize}
                windowMaximized={localWindowMaximized}
              />
            ) : null}
          </div>

          <button className="ref-menu-item" type="button">
            {t("app.menuHelp")}
          </button>

          {/* ── Terminal (editor mode only) ── */}
          {layoutMode === "editor" && workspace ? (
            <div className="ref-menu-dropdown-wrap" ref={terminalMenuRef}>
              <button
                aria-expanded={terminalMenuOpen}
                aria-haspopup="menu"
                className={`ref-menu-item${terminalMenuOpen ? " is-active" : ""}`}
                onClick={() => {
                  closeAllExcept("terminal");
                  setTerminalMenuOpen((o) => !o);
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
                    onClick={spawnEditorTerminal}
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
        <button
          aria-label={t("app.settingsAria")}
          className="ref-icon-tile ref-settings-btn"
          onClick={() => openSettingsPage("general")}
          title={t("app.settings")}
          type="button"
        >
          <IconSettings />
        </button>
      </div>
    </header>
  );
});
