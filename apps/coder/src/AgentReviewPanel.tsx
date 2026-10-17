import { useMemo, useState } from "react";
import { AgentDiffCard } from "./AgentDiffCard";
import { useI18n } from "./i18n";
import type { AgentPendingPatch } from "./ipcTypes";

type Props = {
  patches: AgentPendingPatch[];
  workspaceRoot: string | null;
  busy: boolean;
  onOpenFile: (
    rel: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null }
  ) => void;
  onApplyOne: (id: string) => void;
  onApplyAll: () => void;
  onDiscard: () => void;
};

function IconChevron({
  expanded,
  className,
}: {
  expanded: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      {expanded ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
    </svg>
  );
}

export function AgentReviewPanel({
  patches,
  workspaceRoot,
  busy,
  onOpenFile,
  onApplyOne,
  onApplyAll,
  onDiscard,
}: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const fileCount = useMemo(() => {
    const s = new Set<string>();
    for (const p of patches) {
      s.add(p.relPath?.trim() || p.id);
    }
    return s.size;
  }, [patches]);

  if (patches.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={t("agent.review.regionAria")}
      className="ref-agent-review"
      role="region"
    >
      <div className="ref-agent-review-bar">
        <div className="ref-agent-review-bar-left">
          <span className="ref-agent-review-title">
            {t("agent.review.title")}
          </span>
          <span className="ref-agent-review-meta">
            {t("agent.review.meta", {
              patches: patches.length,
              paths: fileCount,
            })}
          </span>
        </div>
        <div className="ref-agent-review-bar-right">
          <button
            className="ref-agent-review-btn ref-agent-review-btn--ghost"
            disabled={busy}
            onClick={onDiscard}
            type="button"
          >
            {t("agent.review.discardAll")}
          </button>
          <button
            className="ref-agent-review-btn ref-agent-review-btn--primary"
            disabled={busy}
            onClick={onApplyAll}
            type="button"
          >
            {t("agent.review.applyAll")}
          </button>
          <button
            aria-expanded={expanded}
            className="ref-agent-review-toggle"
            disabled={busy}
            onClick={() => setExpanded((e) => !e)}
            type="button"
          >
            <span>
              {expanded ? t("agent.review.collapse") : t("agent.review.expand")}
            </span>
            <IconChevron
              className="ref-agent-review-toggle-ico"
              expanded={expanded}
            />
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="ref-agent-review-body">
          {patches.map((p) => (
            <div className="ref-agent-review-row" key={p.id}>
              <div className="ref-agent-review-row-head">
                <span
                  className="ref-agent-review-row-label"
                  title={p.relPath ?? undefined}
                >
                  {p.relPath ?? t("agent.review.unknownPath")}
                </span>
                <button
                  className="ref-agent-review-btn ref-agent-review-btn--sm"
                  disabled={busy}
                  onClick={() => onApplyOne(p.id)}
                  type="button"
                >
                  {t("agent.review.applyOne")}
                </button>
              </div>
              <AgentDiffCard
                diff={p.chunk}
                onOpenFile={onOpenFile}
                workspaceRoot={workspaceRoot}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
