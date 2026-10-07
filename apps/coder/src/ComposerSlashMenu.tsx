import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  computeClampedPopoverLayout,
  POPOVER_VIEW_MARGIN,
} from "./anchorPopoverLayout";
import type { CaretRectSnapshot } from "./caretRectSnapshot";
import type { SlashMenuRowItem } from "./composerSlashCommands";
import { useI18n } from "./i18n";

function SlashCommandLabel({ label, query }: { label: string; query: string }) {
  const name = label.startsWith("/") ? label.slice(1) : label;
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  let matchLen = 0;
  if (q.length > 0) {
    for (let i = 0; i < Math.min(q.length, n.length); i++) {
      if (n[i] === q[i]) {
        matchLen++;
      } else {
        break;
      }
    }
  }
  return (
    <span className="ref-slash-menu-label">
      <span className="ref-slash-menu-slash">/</span>
      {matchLen > 0 ? (
        <>
          <span className="ref-slash-menu-match">
            {name.slice(0, matchLen)}
          </span>
          <span className="ref-slash-menu-name-rest">
            {name.slice(matchLen)}
          </span>
        </>
      ) : (
        <span className="ref-slash-menu-name-rest">{name}</span>
      )}
    </span>
  );
}

type Props = {
  open: boolean;
  query: string;
  items: SlashMenuRowItem[];
  highlightIndex: number;
  caretRect: CaretRectSnapshot | null;
  onHighlight: (index: number) => void;
  onSelect: (item: SlashMenuRowItem) => void;
  onClose: () => void;
};

export function ComposerSlashMenu({
  open,
  query,
  items,
  highlightIndex,
  caretRect,
  onHighlight,
  onSelect,
  onClose,
}: Props) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    /* 与下方 render 一致：未展示菜单时不挂监听，避免 menuRef 为空时误把全屏点击都当成「点外侧」 */
    if (!open || !caretRect) {
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
  }, [open, caretRect, onClose]);

  useLayoutEffect(() => {
    if (!open || items.length === 0) {
      return;
    }
    const root = menuRef.current;
    if (!root) {
      return;
    }
    const safeHi = Math.min(Math.max(0, highlightIndex), items.length - 1);
    const row = root.querySelector<HTMLElement>(
      `[data-slash-menu-idx="${safeHi}"]`
    );
    row?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [open, items, highlightIndex]);

  if (!open || !caretRect) {
    return null;
  }

  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  const menuWidth = Math.min(380, vw - 2 * POPOVER_VIEW_MARGIN);
  const rowH = 52;
  const estHeight = Math.min(
    Math.max(items.length * rowH + 8, items.length ? 48 : 44),
    vh * 0.45
  );

  const anchorRect = new DOMRect(
    caretRect.left,
    caretRect.top,
    caretRect.width,
    caretRect.height
  );
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
    zIndex: 20_001,
  };
  if (layout.top !== undefined) {
    posStyle.top = layout.top;
  }
  if (layout.bottom !== undefined) {
    posStyle.bottom = layout.bottom;
  }

  if (items.length === 0) {
    return createPortal(
      <div
        className="ref-slash-menu ref-slash-menu--empty"
        onMouseDown={(e) => e.preventDefault()}
        ref={menuRef}
        role="status"
        style={posStyle}
      >
        <div className="ref-slash-menu-empty">{t("slashCmd.noMatch")}</div>
      </div>,
      document.body
    );
  }

  const safeHi = Math.min(highlightIndex, items.length - 1);

  return createPortal(
    <div
      aria-label={t("slashCmd.menuAria")}
      className="ref-slash-menu"
      onMouseDown={(e) => e.preventDefault()}
      ref={menuRef}
      role="listbox"
      style={posStyle}
    >
      {items.map((it, i) => (
        <button
          aria-selected={i === highlightIndex}
          className={`ref-slash-menu-row ${i === safeHi ? "is-active" : ""}`}
          data-slash-menu-idx={i}
          key={it.id}
          onClick={() => onSelect(it)}
          onMouseEnter={() => onHighlight(i)}
          role="option"
          type="button"
        >
          <div className="ref-slash-menu-row-main">
            <SlashCommandLabel label={it.label} query={query} />
            {i === safeHi ? (
              <kbd aria-hidden className="ref-slash-menu-kbd">
                ↵
              </kbd>
            ) : null}
          </div>
          <div className="ref-slash-menu-desc">{it.description}</div>
        </button>
      ))}
    </div>,
    document.body
  );
}
