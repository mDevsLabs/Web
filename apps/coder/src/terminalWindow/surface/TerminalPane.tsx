import { memo } from "react";
import type { TFunction } from "../../i18n";
import { TerminalPortsPanel } from "../TerminalPortsPanel";
import { TerminalSftpPanel } from "../TerminalSftpPanel";
import type {
  TerminalAppSettings,
  TerminalProfile,
} from "../terminalSettings";
import { TerminalSessionToolbar } from "./TerminalSessionToolbar";
import { MemoTerminalTabView } from "./TerminalTabView";
import { getProfileThemeColors } from "./terminalThemeUtils";
import type {
  SessionInfo,
  ShellBridge,
  TerminalContextMenuState,
  TerminalRuntimeControls,
  TerminalSessionAuthPrompt,
  XTermThemeColors,
} from "./types";

export type TerminalPaneProps = {
  session: SessionInfo;
  sessionProfile: TerminalProfile | null;
  isActive: boolean;
  paneActive: boolean;
  settingsOpen: boolean;
  splitEnabled: boolean;
  toolbarPinned: boolean;
  toolbarRevealed: boolean;
  sftpPanelOpen: boolean;
  sftpPanelPath: string | undefined;
  portsPanelOpen: boolean;
  exitCode: number | null | undefined;
  terminalSettings: TerminalAppSettings;
  themeColors: XTermThemeColors;
  shell: ShellBridge;
  t: TFunction;
  onSetActive(sessionId: string): void;
  onCloseSplit(): void;
  onCloseSession(sessionId: string): void;
  onReconnectSession(sessionId: string): void;
  onOpenPortsPanel(sessionId: string): void;
  onClosePortsPanel(sessionId: string): void;
  onOpenSftpPanel(sessionId: string): void;
  onCloseSftpPanel(sessionId: string): void;
  onUpdateSftpPanelPath(sessionId: string, nextPath: string): void;
  onOpenProfileSettings(profile: TerminalProfile | null, tab: "ports"): void;
  onToggleToolbarPinned(): void;
  onRevealToolbar(): void;
  onHideToolbar(): void;
  onAuthPrompt(sessionId: string, prompt: TerminalSessionAuthPrompt): void;
  onHandleExit(sessionId: string, code: number | null): void;
  onRequestContextMenu(payload: TerminalContextMenuState): void;
  registerRuntime(
    sessionId: string,
    runtime: TerminalRuntimeControls | null
  ): void;
};

export const TerminalPane = memo(function TerminalPane({
  session,
  sessionProfile,
  isActive,
  paneActive,
  settingsOpen,
  splitEnabled,
  toolbarPinned,
  toolbarRevealed,
  sftpPanelOpen,
  sftpPanelPath,
  portsPanelOpen,
  exitCode,
  terminalSettings,
  themeColors,
  shell,
  t,
  onSetActive,
  onCloseSplit,
  onCloseSession,
  onReconnectSession,
  onOpenPortsPanel,
  onClosePortsPanel,
  onOpenSftpPanel,
  onCloseSftpPanel,
  onUpdateSftpPanelPath,
  onOpenProfileSettings,
  onToggleToolbarPinned,
  onRevealToolbar,
  onHideToolbar,
  onAuthPrompt,
  onHandleExit,
  onRequestContextMenu,
  registerRuntime,
}: TerminalPaneProps) {
  const showSshToolbar = paneActive && sessionProfile?.kind === "ssh";
  const renderSftpPanel = sessionProfile?.kind === "ssh" && sftpPanelOpen;
  const renderPortsPanel = sessionProfile?.kind === "ssh" && portsPanelOpen;

  return (
    <div
      aria-hidden={!paneActive}
      className={`ref-uterm-pane ${paneActive ? "is-active" : ""} ${isActive ? "is-focused" : ""}`}
      onMouseDown={() => onSetActive(session.id)}
      onMouseEnter={showSshToolbar ? onRevealToolbar : undefined}
      onMouseLeave={showSshToolbar ? onHideToolbar : undefined}
    >
      {paneActive && splitEnabled ? (
        <div className="ref-uterm-pane-controls">
          <button
            className="ref-uterm-pane-control"
            onClick={onCloseSplit}
            type="button"
          >
            {t("app.universalTerminalPane.unsplit")}
          </button>
          <button
            className="ref-uterm-pane-control"
            onClick={() => void onCloseSession(session.id)}
            type="button"
          >
            {t("app.universalTerminalPane.close")}
          </button>
        </div>
      ) : null}
      {showSshToolbar ? (
        <TerminalSessionToolbar
          onMouseEnter={onRevealToolbar}
          onMouseLeave={onHideToolbar}
          onOpenPorts={() => onOpenPortsPanel(session.id)}
          onOpenSftp={() => onOpenSftpPanel(session.id)}
          onPinToggle={onToggleToolbarPinned}
          onReconnect={() => void onReconnectSession(session.id)}
          pinned={toolbarPinned}
          profile={sessionProfile}
          session={session}
          t={t}
          visible={toolbarPinned || toolbarRevealed}
        />
      ) : null}
      <MemoTerminalTabView
        active={!settingsOpen && paneActive && isActive}
        appSettings={terminalSettings}
        onAuthPrompt={onAuthPrompt}
        onDisconnect={() => void onCloseSession(session.id)}
        onExit={(code) => onHandleExit(session.id, code)}
        onReconnect={() => void onReconnectSession(session.id)}
        onRequestContextMenu={onRequestContextMenu}
        profile={sessionProfile}
        registerRuntime={registerRuntime}
        sessionCwd={session.cwd}
        sessionId={session.id}
        shell={shell}
        t={t}
        theme={getProfileThemeColors(sessionProfile, themeColors)}
      />
      {renderPortsPanel ? (
        <TerminalPortsPanel
          onClose={() => onClosePortsPanel(session.id)}
          onCopy={(text) =>
            void window.maiShell?.invoke("clipboard:writeText", text)
          }
          onOpenSettings={() => onOpenProfileSettings(sessionProfile, "ports")}
          profile={sessionProfile}
          t={t}
        />
      ) : null}
      {renderSftpPanel ? (
        <TerminalSftpPanel
          onClose={() => onCloseSftpPanel(session.id)}
          onPathChange={(nextPath) =>
            onUpdateSftpPanelPath(session.id, nextPath)
          }
          path={sftpPanelPath}
          profile={sessionProfile}
          shell={shell}
          t={t}
          visible={sftpPanelOpen}
        />
      ) : null}
      {exitCode === undefined ? null : (
        <div className="ref-uterm-pane-exitbadge">
          {t("app.universalTerminalSessionExited", {
            code: exitCode === null ? "?" : String(exitCode),
          })}
        </div>
      )}
    </div>
  );
});
