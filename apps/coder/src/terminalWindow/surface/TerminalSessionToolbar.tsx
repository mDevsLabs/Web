import { memo } from "react";
import type { TFunction } from "../../i18n";
import {
  IconFolderOpen,
  IconPin,
  IconPlug,
  IconRefresh,
} from "../../icons";
import type { TerminalProfile } from "../terminalSettings";
import { formatTerminalToolbarTarget } from "./terminalThemeUtils";
import type { SessionInfo } from "./types";

export type TerminalSessionToolbarProps = {
  t: TFunction;
  session: SessionInfo;
  profile: TerminalProfile | null;
  visible: boolean;
  pinned: boolean;
  onPinToggle(): void;
  onReconnect(): void;
  onOpenSftp(): void;
  onOpenPorts(): void;
  onMouseEnter(): void;
  onMouseLeave(): void;
};

export const TerminalSessionToolbar = memo(function TerminalSessionToolbar({
  t,
  session,
  profile,
  visible,
  pinned,
  onPinToggle,
  onReconnect,
  onOpenSftp,
  onOpenPorts,
  onMouseEnter,
  onMouseLeave,
}: TerminalSessionToolbarProps) {
  const target = formatTerminalToolbarTarget(profile);

  return (
    <div
      className={`ref-uterm-toolbar-wrap ${visible ? "is-visible" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="ref-uterm-toolbar">
        <div className="ref-uterm-toolbar-main">
          <span
            aria-hidden="true"
            className={`ref-uterm-toolbar-status ${session.alive ? "is-live" : "is-dead"}`}
          />
          <strong className="ref-uterm-toolbar-target">{target}</strong>
        </div>

        <div className="ref-uterm-toolbar-actions">
          <button
            className="ref-uterm-toolbar-btn"
            onClick={onReconnect}
            type="button"
          >
            <IconRefresh className="ref-uterm-toolbar-btn-icon" />
            <span>{t("app.universalTerminalToolbarReconnect")}</span>
          </button>
          {session.alive ? (
            <button
              className="ref-uterm-toolbar-btn"
              onClick={onOpenSftp}
              type="button"
            >
              <IconFolderOpen className="ref-uterm-toolbar-btn-icon" />
              <span>{t("app.universalTerminalToolbarSftp")}</span>
            </button>
          ) : null}
          {session.alive ? (
            <button
              className="ref-uterm-toolbar-btn"
              onClick={onOpenPorts}
              type="button"
            >
              <IconPlug className="ref-uterm-toolbar-btn-icon" />
              <span>{t("app.universalTerminalToolbarPorts")}</span>
            </button>
          ) : null}
          <button
            className="ref-uterm-toolbar-btn"
            onClick={onPinToggle}
            type="button"
          >
            <IconPin className="ref-uterm-toolbar-btn-icon" />
            <span>
              {pinned
                ? t("app.universalTerminalToolbarUnpin")
                : t("app.universalTerminalToolbarPin")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});
