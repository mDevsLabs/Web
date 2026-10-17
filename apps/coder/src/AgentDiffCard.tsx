import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  countDiffAddDel,
  diffPathToWorkspaceRel,
  extractDiffDisplayPath,
  firstHunkNewStartLine,
} from "./agentChatSegments";
import { FileTypeIcon } from "./fileTypeIcons";
import { countAgentDiffLinesForPreviewPx } from "./pretextLayout";

function IconChevronDiff({
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
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      {expanded ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
    </svg>
  );
}

function lineClassName(line: string): string {
  let mod = "ref-agent-diff-line";
  if (line.startsWith("+") && !line.startsWith("+++")) {
    mod += " is-add";
  } else if (line.startsWith("-") && !line.startsWith("---")) {
    mod += " is-del";
  } else if (line.startsWith("@@")) {
    mod += " is-hunk";
  } else if (
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("--- ") ||
    line.startsWith("+++ ")
  ) {
    mod += " is-meta";
  }
  return mod;
}

/** 折叠预览区大致像素上限（长行折行后由 Pretext 按真实排版高度截断，替代固定行数） */
const DIFF_PREVIEW_MAX_BODY_PX = 240;

type Props = {
  diff: string;
  /** 当前工作区根路径，用于把 diff 里的绝对路径转成相对路径 */
  workspaceRoot?: string | null;
  /** 点击标题区：右侧打开文件并滚动到首个 hunk 对应行 */
  onOpenFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null }
  ) => void;
};

export const AgentDiffCard = memo(function AgentDiffCard({
  diff,
  workspaceRoot,
  onOpenFile,
}: Props) {
  const rawPath = extractDiffDisplayPath(diff);
  const rel = diffPathToWorkspaceRel(rawPath, workspaceRoot);
  const openTarget = (rel || rawPath.replace(/\\/g, "/")).trim();
  const base =
    openTarget.split("/").pop() ||
    rawPath.replace(/\\/g, "/").split("/").pop() ||
    rawPath;
  const { additions, deletions } = countDiffAddDel(diff);
  const lines = useMemo(() => diff.split("\n"), [diff]);
  const [expanded, setExpanded] = useState(false);
  const revealLine = firstHunkNewStartLine(diff);
  const linesMeasureRef = useRef<HTMLDivElement>(null);
  const [linesInnerWidth, setLinesInnerWidth] = useState(280);

  useLayoutEffect(() => {
    const el = linesMeasureRef.current;
    if (!el) {
      return;
    }
    const apply = (w: number) => {
      if (w > 0) {
        setLinesInnerWidth(w);
      }
    };
    apply(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      apply(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const previewLineCount = useMemo(() => {
    if (expanded) {
      return lines.length;
    }
    return countAgentDiffLinesForPreviewPx(
      lines,
      linesInnerWidth,
      DIFF_PREVIEW_MAX_BODY_PX
    );
  }, [lines, linesInnerWidth, expanded]);

  const needsCollapse = previewLineCount < lines.length;
  const visibleLines = expanded ? lines : lines.slice(0, previewLineCount);
  const hiddenCount = needsCollapse ? lines.length - previewLineCount : 0;

  const canOpen = Boolean(onOpenFile && openTarget);

  const handleOpen = () => {
    if (!onOpenFile || !openTarget) {
      return;
    }
    onOpenFile(openTarget, revealLine ?? undefined, undefined, { diff });
  };

  const headInner = (
    <>
      <span aria-hidden className="ref-agent-diff-card-ico">
        <FileTypeIcon
          className="ref-agent-diff-card-ico-svg"
          fileName={base}
          isDirectory={false}
        />
      </span>
      <span className="ref-agent-diff-card-name" title={rawPath}>
        {base}
      </span>
      <span className="ref-agent-diff-card-stats">
        {additions > 0 ? (
          <span className="ref-agent-diff-stat-add">+{additions}</span>
        ) : null}
        {deletions > 0 ? (
          <span className="ref-agent-diff-stat-del">−{deletions}</span>
        ) : null}
        {additions === 0 && deletions === 0 ? (
          <span className="ref-agent-diff-stat-neutral">0</span>
        ) : null}
      </span>
    </>
  );

  const pathLine =
    openTarget === base ? null : (
      <div className="ref-agent-diff-card-path" title={openTarget}>
        {openTarget}
      </div>
    );

  return (
    <div
      aria-label={`改动：${base}`}
      className="ref-agent-diff-card"
      role="article"
    >
      {canOpen ? (
        <button
          aria-label={`在右侧打开 ${openTarget}${revealLine ? `，定位约第 ${revealLine} 行` : ""}`}
          className="ref-agent-diff-card-open"
          onClick={handleOpen}
          type="button"
        >
          <div className="ref-agent-diff-card-head">{headInner}</div>
          {pathLine}
        </button>
      ) : (
        <div className="ref-agent-diff-card-head">{headInner}</div>
      )}
      <div
        className={[
          "ref-agent-diff-card-body",
          needsCollapse && !expanded
            ? "ref-agent-diff-card-body--preview"
            : "ref-agent-diff-card-body--expanded",
        ].join(" ")}
      >
        <div
          aria-label="Unified diff"
          className="ref-agent-diff-lines"
          ref={linesMeasureRef}
          role="region"
        >
          {visibleLines.map((line, i) => (
            <div className={lineClassName(line)} key={i}>
              {line || "\u00a0"}
            </div>
          ))}
        </div>
        {needsCollapse ? (
          <div
            className={[
              "ref-agent-diff-preview-chrome",
              expanded ? "is-expanded" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {expanded ? null : (
              <div aria-hidden className="ref-agent-diff-preview-fade" />
            )}
            <button
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? "收起 diff，仅显示预览"
                  : `展开全部 diff（还有 ${hiddenCount} 行）`
              }
              className="ref-agent-diff-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((ex) => !ex);
              }}
              type="button"
            >
              <IconChevronDiff
                className="ref-agent-diff-toggle-ico"
                expanded={expanded}
              />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
});
