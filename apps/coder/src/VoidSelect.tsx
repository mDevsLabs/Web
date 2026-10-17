import type { CSSProperties, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  type ClampedPopoverLayout,
  computeClampedPopoverLayout,
} from "./anchorPopoverLayout";

export type VoidSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: VoidSelectOption[];
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
  /** 编辑器工具栏等较扁场景 */
  variant?: "default" | "compact";
};

const MENU_Z = 6000;

function IconChevDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VoidSelect({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  id: idProp,
  className,
  variant = "default",
}: Props) {
  const genId = useId();
  const triggerId = idProp ?? `void-select-${genId}`;
  const listId = `${triggerId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<ClampedPopoverLayout>({
    left: 0,
    maxHeightPx: 280,
    minHeightPx: 80,
    placement: "below",
    top: 80,
    width: 200,
  });

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );
  const displayLabel = selected?.label ?? value;

  const recompute = useCallback(() => {
    const tr = triggerRef.current;
    const menu = menuRef.current;
    if (!tr || !menu) {
      return;
    }
    const r = tr.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = Math.ceil(r.width);
    const natural = Math.min(
      480,
      Math.max(menu.scrollHeight, options.length * 36 + 8)
    );
    setLayout(
      computeClampedPopoverLayout(r, {
        contentHeight: natural,
        menuWidth,
        viewportHeight: vh,
        viewportWidth: vw,
      })
    );
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    recompute();
    const t = requestAnimationFrame(() => recompute());
    return () => cancelAnimationFrame(t);
  }, [open, recompute, value, options.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onScroll = () => recompute();
    const onResize = () => recompute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, recompute]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const rootClass =
    `ref-void-select ${variant === "compact" ? "ref-void-select--compact" : ""}${className ? ` ${className}` : ""}`.trim();

  const menuStyle: CSSProperties = {
    left: layout.left,
    maxHeight: layout.maxHeightPx,
    minHeight: Math.min(layout.minHeightPx, layout.maxHeightPx),
    overflow: "auto",
    position: "fixed",
    width: layout.width,
    zIndex: MENU_Z,
    ...(layout.placement === "below"
      ? { top: layout.top }
      : { bottom: layout.bottom }),
  };

  const menu = open ? (
    <div
      aria-labelledby={triggerId}
      className="ref-void-select-menu"
      id={listId}
      ref={menuRef}
      role="listbox"
      style={menuStyle}
    >
      {options.map((o) => {
        const isSel = o.value === value;
        return (
          <button
            aria-selected={isSel}
            className={`ref-void-select-option ${isSel ? "is-selected" : ""}`}
            disabled={o.disabled}
            key={o.value}
            onClick={() => {
              if (o.disabled) {
                return;
              }
              pick(o.value);
            }}
            role="option"
            type="button"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={rootClass}>
      <button
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`ref-void-select-trigger ${open ? "is-open" : ""}`}
        disabled={disabled}
        id={triggerId}
        onClick={() => {
          if (disabled) {
            return;
          }
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (disabled) {
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="ref-void-select-value">{displayLabel}</span>
        <IconChevDown className="ref-void-select-chev" />
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
