import type * as React from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { memo } from "react";

export type TerminalTabButtonProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  meta?: string;
  exited?: boolean;
  onSelect(): void;
  onClose(): void;
  onContextMenu?(event: ReactMouseEvent<HTMLDivElement>): void;
  onDragStart?(event: React.DragEvent<HTMLDivElement>): void;
  onDragOver?(event: React.DragEvent<HTMLDivElement>): void;
  onDrop?(event: React.DragEvent<HTMLDivElement>): void;
};

export const TerminalTabButton = memo(function TerminalTabButton({
  active,
  icon,
  label,
  meta,
  exited,
  onSelect,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: TerminalTabButtonProps) {
  return (
    <div
      aria-selected={active}
      className={`ref-uterm-tab ${active ? "is-active" : ""} ${exited ? "is-exited" : ""}`}
      draggable={Boolean(onDragStart)}
      onContextMenu={
        onContextMenu
          ? (event) => {
              event.preventDefault();
              onContextMenu(event);
            }
          : undefined
      }
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      role="tab"
    >
      <button
        className="ref-uterm-tab-select"
        onClick={onSelect}
        title={meta || label}
        type="button"
      >
        {icon}
        <span className="ref-uterm-tab-label">{label}</span>
      </button>
      <button
        aria-label={label}
        className="ref-uterm-tab-close"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
});
