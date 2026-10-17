import { useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "../i18n";
import { IconChevron, IconExplorer } from "../icons";
import {
  readStoredWorkspaceLauncher,
  WORKSPACE_LAUNCHER_ORDER,
  type WorkspaceLauncherTool,
  workspaceLauncherLabel,
  writeStoredWorkspaceLauncher,
} from "./workspaceLaunchers";

const launcherImageByTool: Partial<Record<WorkspaceLauncherTool, string>> = {
  antigravity: new URL("../../resources/icons/antigravity.png", import.meta.url)
    .href,
  cursor: new URL("../../resources/icons/cursor.png", import.meta.url).href,
  explorer: new URL(
    "../../resources/icons/file_explore_icon.png",
    import.meta.url
  ).href,
  jetbrains: new URL("../../resources/icons/jetbrains.png", import.meta.url)
    .href,
  vscode: new URL("../../resources/icons/vscode_icon.png", import.meta.url)
    .href,
};

type AgentWorkspaceLauncherProps = {
  t: TFunction;
  workspace: string | null;
  onLaunchTool: (tool: WorkspaceLauncherTool) => void;
};

function IconVsCode({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M16.8 2.5 8.9 8.2 4.4 4.7 2.2 6.7l4.3 5-4.3 5 2.2 2 4.5-3.5 7.9 5.7 4-.8V3.3l-4-.8Z"
        fill="currentColor"
      />
      <path
        d="M8.9 8.2v7.6L16.8 21V3l-7.9 5.2Z"
        fill="currentColor"
        opacity="0.32"
      />
    </svg>
  );
}

function IconCursorApp({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M6.5 4.2h6.4l4.1 4.1v6.4l-4.1 4.1H6.5l-4.1-4.1V8.3l4.1-4.1Zm1.7 3.2L5.9 9.7v3.7l2.3 2.3h3.7l2.3-2.3V9.7L11.9 7.4H8.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconAntigravityApp({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="m12 3 3.7 5.3L21 12l-5.3 3.7L12 21l-3.7-5.3L3 12l5.3-3.7L12 3Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" fill="var(--void-bg-0)" r="2.5" />
    </svg>
  );
}

function IconJetBrainsApp({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <rect fill="currentColor" height="15" rx="2" width="15" x="4.5" y="4.5" />
      <path
        d="M7.5 12h9M12 7.5v9"
        stroke="var(--void-bg-0)"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconTerminalApp({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M4.5 5.5h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m7.1 9 2.9 2.9L7.1 14.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12.5 15h4.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
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
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M5 13.2 9.1 17 19 7.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
    </svg>
  );
}

function vectorIconForTool(tool: WorkspaceLauncherTool) {
  switch (tool) {
    case "cursor":
      return IconCursorApp;
    case "antigravity":
      return IconAntigravityApp;
    case "jetbrains":
      return IconJetBrainsApp;
    case "explorer":
      return IconExplorer;
    case "terminal":
      return IconTerminalApp;
    default:
      return IconVsCode;
  }
}

function WorkspaceLauncherIcon({
  tool,
  className,
}: {
  tool: WorkspaceLauncherTool;
  className?: string;
}) {
  const imageUrl = launcherImageByTool[tool];
  if (imageUrl) {
    return (
      <img
        alt=""
        aria-hidden
        className={className}
        draggable={false}
        src={imageUrl}
      />
    );
  }
  const VectorIcon = vectorIconForTool(tool);
  return <VectorIcon className={className} />;
}

export function AgentWorkspaceLauncher({
  t,
  workspace,
  onLaunchTool,
}: AgentWorkspaceLauncherProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<WorkspaceLauncherTool>(() =>
    readStoredWorkspaceLauncher()
  );
  const disabled = !workspace;

  const options = useMemo(
    () =>
      WORKSPACE_LAUNCHER_ORDER.map((tool) => ({
        id: tool,
        label: workspaceLauncherLabel(t, tool),
      })),
    [t]
  );

  const selected =
    options.find((option) => option.id === selectedTool) ?? options[0]!;

  useEffect(() => {
    writeStoredWorkspaceLauncher(selectedTool);
  }, [selectedTool]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const triggerTitle = disabled
    ? t("app.noWorkspace")
    : t("app.workspaceLauncher.openWith", { app: selected.label });

  return (
    <div
      className={`ref-agent-workspace-launcher ${open ? "is-open" : ""}`}
      ref={rootRef}
    >
      <button
        aria-label={triggerTitle}
        className="ref-agent-workspace-launcher-trigger"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setOpen(false);
          onLaunchTool(selected.id);
        }}
        title={triggerTitle}
        type="button"
      >
        <span
          aria-hidden
          className={`ref-agent-workspace-launcher-ico-wrap ref-agent-workspace-launcher-ico-wrap--${selected.id}`}
        >
          <WorkspaceLauncherIcon
            className="ref-agent-workspace-launcher-ico"
            tool={selected.id}
          />
        </span>
      </button>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          disabled ? t("app.noWorkspace") : t("app.workspaceLauncher.menuAria")
        }
        className="ref-agent-workspace-launcher-toggle"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setOpen((prev) => !prev);
        }}
        title={
          disabled ? t("app.noWorkspace") : t("app.workspaceLauncher.menuAria")
        }
        type="button"
      >
        <IconChevron className="ref-agent-workspace-launcher-toggle-ico" />
      </button>
      {open ? (
        <div
          aria-label={t("app.workspaceLauncher.menuAria")}
          className="ref-agent-workspace-launcher-menu"
          role="menu"
        >
          {options.map((option) => {
            const isSelected = option.id === selected.id;
            return (
              <button
                aria-checked={isSelected}
                className={`ref-agent-workspace-launcher-option ${isSelected ? "is-selected" : ""}`}
                key={option.id}
                onClick={() => {
                  setSelectedTool(option.id);
                  setOpen(false);
                  onLaunchTool(option.id);
                }}
                role="menuitemradio"
                type="button"
              >
                <span className="ref-agent-workspace-launcher-option-main">
                  <span
                    aria-hidden
                    className={`ref-agent-workspace-launcher-ico-wrap ref-agent-workspace-launcher-ico-wrap--${option.id}`}
                  >
                    <WorkspaceLauncherIcon
                      className="ref-agent-workspace-launcher-ico"
                      tool={option.id}
                    />
                  </span>
                  <span className="ref-agent-workspace-launcher-option-label">
                    {option.label}
                  </span>
                </span>
                {isSelected ? (
                  <IconCheck className="ref-agent-workspace-launcher-option-check" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
