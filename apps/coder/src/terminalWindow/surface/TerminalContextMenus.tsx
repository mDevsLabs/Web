import type { CSSProperties } from "react";
import { memo } from "react";
import type { TFunction } from "../../i18n";
import type {
  TerminalRuntimeControls,
} from "./types";

export type TerminalViewportContextMenuProps = {
  style: CSSProperties | undefined;
  contextRuntime: TerminalRuntimeControls | null;
  onCopy(): void;
  onPaste(): void;
  onSelectAll(): void;
  t: TFunction;
};

export const TerminalViewportContextMenu = memo(
  function TerminalViewportContextMenu({
    style,
    contextRuntime,
    onCopy,
    onPaste,
    onSelectAll,
    t,
  }: TerminalViewportContextMenuProps) {
    return (
      <div
        className="ref-uterm-dropdown ref-uterm-context-menu"
        role="menu"
        style={style}
      >
        <button
          className="ref-uterm-dropdown-item"
          disabled={!contextRuntime?.hasSelection()}
          onClick={onCopy}
          role="menuitem"
          type="button"
        >
          {t("app.edit.copy")}
        </button>
        <button
          className="ref-uterm-dropdown-item"
          onClick={onPaste}
          role="menuitem"
          type="button"
        >
          {t("app.edit.paste")}
        </button>
        <div className="ref-uterm-dropdown-sep" role="separator" />
        <button
          className="ref-uterm-dropdown-item"
          onClick={onSelectAll}
          role="menuitem"
          type="button"
        >
          {t("app.edit.selectAll")}
        </button>
      </div>
    );
  }
);

export type TerminalTabHeaderContextMenuProps = {
  style: CSSProperties | undefined;
  sessionId: string;
  defaultProfileId: string;
  sessionProfileId?: string;
  onClose(): void;
  onCreateSession(profileId: string): void;
  onDuplicateSession(sessionId: string): void;
  onSplitSession(sessionId: string, orientation: "horizontal" | "vertical"): void;
  onCloseSession(sessionId: string): void;
  t: TFunction;
};

export const TerminalTabHeaderContextMenu = memo(
  function TerminalTabHeaderContextMenu({
    style,
    sessionId,
    defaultProfileId,
    sessionProfileId,
    onClose,
    onCreateSession,
    onDuplicateSession,
    onSplitSession,
    onCloseSession,
    t,
  }: TerminalTabHeaderContextMenuProps) {
    return (
      <div
        aria-label={t("app.universalTerminalTabHeader.contextMenuLabel")}
        className="ref-uterm-dropdown ref-uterm-context-menu ref-uterm-tabstrip-context-menu"
        role="menu"
        style={style}
      >
        <button
          className="ref-uterm-dropdown-item"
          onClick={() => {
            const pid = sessionProfileId ?? defaultProfileId;
            onClose();
            onCreateSession(pid);
          }}
          role="menuitem"
          type="button"
        >
          {t("app.universalTerminalTabHeader.newTerminal")}
        </button>
        <button
          className="ref-uterm-dropdown-item"
          onClick={() => {
            onClose();
            onDuplicateSession(sessionId);
          }}
          role="menuitem"
          type="button"
        >
          {t("app.universalTerminalTabHeader.duplicateTerminal")}
        </button>
        <div className="ref-uterm-dropdown-sep" role="separator" />
        <button
          className="ref-uterm-dropdown-item"
          onClick={() => {
            onClose();
            onSplitSession(sessionId, "horizontal");
          }}
          role="menuitem"
          type="button"
        >
          {t("app.universalTerminalTabHeader.splitRight")}
        </button>
        <button
          className="ref-uterm-dropdown-item"
          onClick={() => {
            onClose();
            onSplitSession(sessionId, "vertical");
          }}
          role="menuitem"
          type="button"
        >
          {t("app.universalTerminalTabHeader.splitDown")}
        </button>
        <div className="ref-uterm-dropdown-sep" role="separator" />
        <button
          className="ref-uterm-dropdown-item"
          onClick={() => {
            onClose();
            onCloseSession(sessionId);
          }}
          role="menuitem"
          type="button"
        >
          {t("app.universalTerminalCloseTab")}
        </button>
      </div>
    );
  }
);
