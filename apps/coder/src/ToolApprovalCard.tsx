import { useEffect, useRef } from "react";

export type ToolApprovalPayload = {
  approvalId: string;
  toolName: string;
  command?: string;
  path?: string;
};

type Props = {
  payload: ToolApprovalPayload | null;
  onAllow: () => void;
  onDeny: () => void;
  title: string;
  allowLabel: string;
  denyLabel: string;
};

export function ToolApprovalInlineCard({
  payload,
  onAllow,
  onDeny,
  title,
  allowLabel,
  denyLabel,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const denyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!payload) {
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    queueMicrotask(() => denyBtnRef.current?.focus());
  }, [payload?.approvalId]);

  useEffect(() => {
    if (!payload) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDeny();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload?.approvalId, onDeny]);

  if (!payload) {
    return null;
  }

  const body =
    payload.toolName === "Bash"
      ? (payload.command ?? "")
      : payload.path
        ? `${payload.toolName}: ${payload.path}`
        : payload.toolName;

  return (
    <div
      aria-labelledby="ref-tool-approval-inline-title"
      className="ref-tool-approval-inline"
      ref={rootRef}
      role="region"
    >
      <div className="ref-tool-approval-inline-inner">
        <h2
          className="ref-tool-approval-inline-title"
          id="ref-tool-approval-inline-title"
        >
          {title}
        </h2>
        <pre className="ref-tool-approval-inline-body">{body}</pre>
        <div className="ref-tool-approval-inline-actions">
          <button
            className="ref-tool-approval-btn ref-tool-approval-btn--deny"
            onClick={onDeny}
            ref={denyBtnRef}
            type="button"
          >
            {denyLabel}
          </button>
          <button
            className="ref-tool-approval-btn ref-tool-approval-btn--allow"
            onClick={onAllow}
            type="button"
          >
            {allowLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
