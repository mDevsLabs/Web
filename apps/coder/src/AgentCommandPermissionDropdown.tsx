import type { CSSProperties } from "react";
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
import type { ShellPermissionMode } from "./agentSettingsTypes";
import {
  type ClampedPopoverLayout,
  computeClampedPopoverLayout,
} from "./anchorPopoverLayout";

export type CommandPermissionMode = ShellPermissionMode;

function modeToCssToken(mode: ShellPermissionMode): string {
  return mode === "ask_every_time" ? "ask-every-time" : mode;
}

type Props = {
  value: CommandPermissionMode;
  onChange: (next: CommandPermissionMode) => void;
  alwaysLabel: string;
  rulesLabel: string;
  askEveryTimeLabel: string;
  ariaLabel: string;
  disabled?: boolean;
};

const MENU_Z = 6000;

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M12 5l1.7 5.3L19 12l-5.3 1.7L12 19l-1.7-5.3L5 12l5.3-1.7L12 5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 规则 / 列表 — 表示「按规则放行」 */
function IconRuleList({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="1.85"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path
        d="M4 6h.01M4 12h.01M4 18h.01"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
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

export function AgentCommandPermissionDropdown({
  value,
  onChange,
  alwaysLabel,
  rulesLabel,
  askEveryTimeLabel,
  ariaLabel,
  disabled,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const titleId = `${triggerId}-title`;
  const listId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [layout, setLayout] = useState<ClampedPopoverLayout>({
    left: 0,
    maxHeightPx: 220,
    minHeightPx: 80,
    placement: "below",
    top: 80,
    width: 184,
  });

  const options = useMemo(
    () =>
      [
        { icon: IconSpark, label: alwaysLabel, value: "always" as const },
        { icon: IconRuleList, label: rulesLabel, value: "rules" as const },
        {
          icon: IconShield,
          label: askEveryTimeLabel,
          value: "ask_every_time" as const,
        },
      ] as const,
    [alwaysLabel, rulesLabel, askEveryTimeLabel]
  );

  const selected =
    options.find((option) => option.value === value) ?? options[1];
  const SelectedIcon = selected.icon;
  const triggerModeClass = `ref-command-permission-trigger--${modeToCssToken(selected.value)}`;

  const recompute = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(200, Math.ceil(rect.width));
    const naturalHeight = Math.min(
      280,
      Math.max(menu?.scrollHeight ?? 0, options.length * 46 + 12)
    );
    setLayout(
      computeClampedPopoverLayout(rect, {
        contentHeight: naturalHeight,
        menuWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      })
    );
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    recompute();
    const id = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(id);
  }, [open, rendered, recompute, value]);

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
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered) {
      return;
    }
    const id = window.setTimeout(() => setRendered(false), 120);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

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

  const menu = rendered ? (
    <div
      aria-labelledby={titleId}
      className={`ref-command-permission-menu ${open ? "" : "is-closing"}`}
      ref={menuRef}
      role="dialog"
      style={menuStyle}
    >
      <div className="ref-command-permission-menu-title" id={titleId}>
        {ariaLabel}
      </div>
      <div
        aria-labelledby={titleId}
        className="ref-command-permission-menu-list"
        id={listId}
        role="listbox"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const OptionIcon = option.icon;
          const cssTok = modeToCssToken(option.value);
          return (
            <button
              aria-selected={isSelected}
              className={`ref-command-permission-option ref-command-permission-option--${cssTok} ${isSelected ? "is-selected" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              role="option"
              type="button"
            >
              <span className="ref-command-permission-option-main">
                <span className="ref-command-permission-option-ico-wrap">
                  <OptionIcon className="ref-command-permission-option-ico" />
                </span>
                <span className="ref-command-permission-option-label">
                  {option.label}
                </span>
              </span>
              {isSelected ? (
                <IconCheck className="ref-command-permission-option-check" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className="ref-command-permission">
      <button
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`ref-command-permission-trigger ${triggerModeClass} ${open ? "is-open" : ""}`}
        disabled={disabled}
        id={triggerId}
        onClick={() => {
          if (disabled) {
            return;
          }
          setOpen((prev) => !prev);
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="ref-command-permission-trigger-ico-wrap">
          <SelectedIcon className="ref-command-permission-trigger-ico" />
        </span>
        <span className="ref-command-permission-trigger-label">
          <span className="ref-command-permission-trigger-label-text">
            {selected.label}
          </span>
        </span>
        <span aria-hidden className="ref-command-permission-trigger-chev-wrap">
          <IconChevron className="ref-command-permission-trigger-chev" />
        </span>
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
