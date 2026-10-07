import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  computeClampedPopoverLayout,
  POPOVER_VIEW_MARGIN,
} from "./anchorPopoverLayout";
import type { SlashCommandListRow } from "./composerSlashCommands";
import { useI18n } from "./i18n";

type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
  rows: SlashCommandListRow[];
  onClose: () => void;
};

export function SlashCommandsHelpPop({
  open,
  anchorRect,
  rows,
  onClose,
}: Props) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const node = e.target as Node;
      if (menuRef.current?.contains(node)) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open || !anchorRect) {
    return null;
  }

  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  const menuWidth = Math.min(420, vw - 2 * POPOVER_VIEW_MARGIN);
  const rowH = 48;
  const estHeight = Math.min(Math.max(rows.length * rowH + 56, 120), vh * 0.55);

  const layout = computeClampedPopoverLayout(anchorRect, {
    contentHeight: estHeight,
    menuWidth,
    viewportHeight: vh,
    viewportWidth: vw,
  });

  const posStyle: React.CSSProperties = {
    left: layout.left,
    maxHeight: layout.maxHeightPx,
    position: "fixed",
    width: layout.width,
    zIndex: 20_002,
  };
  if (layout.top !== undefined) {
    posStyle.top = layout.top;
  }
  if (layout.bottom !== undefined) {
    posStyle.bottom = layout.bottom;
  }

  return createPortal(
    <div
      aria-label={t("slashCmd.helpTitle")}
      className="ref-slash-menu ref-slash-help-menu"
      ref={menuRef}
      role="dialog"
      style={posStyle}
    >
      <div className="ref-slash-help-head">{t("slashCmd.helpTitle")}</div>
      <div className="ref-slash-help-list">
        {rows.length === 0 ? (
          <div className="ref-slash-help-empty">{t("slashCmd.helpEmpty")}</div>
        ) : (
          rows.map((r, i) => (
            <div className="ref-slash-help-row" key={`${r.label}-${i}`}>
              <div className="ref-slash-help-row-label">
                <code>{r.label}</code>
                {r.source === "builtin" ? (
                  <span className="ref-slash-help-badge">
                    {t("slashCmd.helpBuiltin")}
                  </span>
                ) : (
                  <span className="ref-slash-help-badge ref-slash-help-badge--user">
                    {t("slashCmd.helpUser")}
                  </span>
                )}
              </div>
              {r.description ? (
                <div className="ref-slash-help-row-desc">{r.description}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
