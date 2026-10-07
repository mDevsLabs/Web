/**
 * Cursor 风格的 "Explored N files" 折叠分组（三态显示）。
 *
 * - `preview`：默认。head 下方留一段最小高度的滚动预览，活动行可粘底。
 * - `expanded`：用户主动展开，正文不限高，完全融入聊天流。
 * - `collapsed`：完全只剩 head 单行 summary。
 *
 * 自动行为：
 * - 同一回合内一旦下方出现 file_edit / 命令 / diff / 收尾 markdown 等
 *   （followingToolLikeWork=true）→ 自动切到 collapsed，把注意力让给工具卡片。
 * - liveTurn 由 true→false（回合结束）时：若仍非 collapsed，延迟自动 collapsed。
 * - 用户手动点击 toggle 后：不再自动覆盖，尊重用户选择。
 */
import {
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AgentResultCard } from "./AgentResultCard";
import { AnimatedHeightReveal } from "./AnimatedHeightReveal";
import type {
  ActivityGroupSegment,
  ActivitySegment,
} from "./agentChatSegments";

type DisplayState = "collapsed" | "preview" | "expanded";

type Props = {
  group: ActivityGroupSegment;
  onOpenFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number
  ) => void;
  /** Agent 回合是否仍在进行中（awaitingReply && isLastMessage） */
  liveTurn?: boolean;
  /** 与 liveTurn 一致：仅实时生成时允许 AgentResultCard 逐行揭示 */
  animateLineReveal?: boolean;
  /**
   * 本分组之后是否已渲染工具类片段（file_edit、命令围栏、diff 等）。
   * 为 true 时自动切到 collapsed 单行 summary。
   */
  followingToolLikeWork?: boolean;
  /**
   * 本分组渲染在 AgentPreflightShell 内部。preflight 整体已经会在回合结束自动收起，
   * 内部不需要再独立做「回合结束自动 collapse」/「followingToolLikeWork 自动 collapse」，
   * 否则会产生「过程中展开 → 结束瞬间卷成单行」的视觉跳变。
   */
  insideShell?: boolean;
};

export const AgentActivityGroup = memo(function AgentActivityGroup({
  group,
  onOpenFile,
  liveTurn = false,
  animateLineReveal = false,
  followingToolLikeWork = false,
  insideShell = false,
}: Props) {
  const [displayState, setDisplayState] = useState<DisplayState>(() => {
    if (!insideShell && followingToolLikeWork) {
      return "collapsed";
    }
    return "preview";
  });
  const userToggledRef = useRef(false);
  const prevLiveTurnRef = useRef(liveTurn);

  // 后续已出现工具块时：自动切到 collapsed（除非用户手动操作过）。preflight 内禁用此规则。
  useEffect(() => {
    if (insideShell) {
      return;
    }
    if (!followingToolLikeWork) {
      return;
    }
    if (userToggledRef.current) {
      return;
    }
    setDisplayState("collapsed");
  }, [followingToolLikeWork, insideShell]);

  // 整个 Agent 回合结束时若仍非 collapsed → 延迟收成 collapsed。preflight 内禁用此规则
  // （preflight 自身会自动收起，内部 group 不需要再单独折叠，避免视觉跳变）。
  useEffect(() => {
    const wasLive = prevLiveTurnRef.current;
    prevLiveTurnRef.current = liveTurn;

    if (insideShell) {
      return;
    }
    if (wasLive && !liveTurn && !userToggledRef.current) {
      const id = setTimeout(() => setDisplayState("collapsed"), 600);
      return () => clearTimeout(id);
    }
  }, [liveTurn, insideShell]);

  const bodyRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);

  // 监听滚动：如果用户往上滚（距底部 > 40px），暂停粘底；滚回底部则恢复
  const onBodyScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distFromBottom < 40;
  }, []);

  // 内容变化时，若粘底且非 collapsed 则自动滚到最新 (throttle rAF: évite le layout thrash par token)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (displayState === "collapsed" || !pinnedToBottomRef.current) return;
    const el = bodyRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const target = bodyRef.current;
      if (target) target.scrollTop = target.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [group.items, displayState]);

  // 切换显示态时重置粘底
  useEffect(() => {
    if (displayState !== "collapsed") {
      pinnedToBottomRef.current = true;
      const el = bodyRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [displayState]);

  /** 二态切换：preview/collapsed → expanded → preview */
  const onToggle = useCallback(() => {
    userToggledRef.current = true;
    setDisplayState((s) => (s === "expanded" ? "preview" : "expanded"));
  }, []);

  const isOpen = displayState !== "collapsed";

  return (
    <div
      className={`ref-activity-group ${group.pending ? "is-pending" : "is-done"}`}
      data-state={displayState}
    >
      <button
        aria-expanded={isOpen}
        className="ref-activity-group-header"
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden className="ref-activity-group-icon">
          {group.pending ? <SpinnerIcon /> : <ExploreIcon />}
        </span>
        <span className="ref-activity-group-summary">{group.summary}</span>
        <span aria-hidden className="ref-activity-group-chevron">
          <ChevronDown />
        </span>
      </button>

      <div className={`ref-activity-group-collapse ${isOpen ? "is-open" : ""}`}>
        <div
          className={`ref-activity-group-body ${group.pending || liveTurn ? "ref-activity-group-body--live" : ""}`}
          onScroll={onBodyScroll}
          ref={bodyRef}
        >
          {group.items.map((item, i) => (
            <ActivityRow
              animateLineReveal={animateLineReveal}
              item={item}
              key={i}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

function ActivityRow({
  item,
  onOpenFile,
  animateLineReveal,
}: {
  item: ActivitySegment;
  onOpenFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number
  ) => void;
  animateLineReveal: boolean;
}) {
  const readLink = item.agentReadLink;
  const hasResultCard = Boolean(
    item.resultLines && item.resultLines.length > 0 && item.resultKind
  );
  const hasExpandableBody = Boolean(item.detail || hasResultCard);
  const resultLines = item.resultLines ?? [];
  const resultKind = item.resultKind ?? "plain";
  const [expandedBody, setExpandedBody] = useState(false);
  const onToggleBody = useCallback(() => {
    setExpandedBody((v) => !v);
  }, []);
  const onToggleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggleBody();
      }
    },
    [onToggleBody]
  );
  return (
    <div
      className={`ref-activity-group-row ref-activity-group-row--${item.status}`}
    >
      <div
        aria-expanded={hasExpandableBody ? expandedBody : undefined}
        aria-label={
          hasExpandableBody
            ? expandedBody
              ? "收起详情"
              : "展开详情"
            : undefined
        }
        className={`ref-activity-group-row-top${hasExpandableBody ? " ref-activity-group-row-top--toggle" : ""}`}
        onClick={hasExpandableBody ? onToggleBody : undefined}
        onKeyDown={hasExpandableBody ? onToggleKeyDown : undefined}
        role={hasExpandableBody ? "button" : undefined}
        tabIndex={hasExpandableBody ? 0 : undefined}
      >
        <span aria-hidden className="ref-activity-group-row-dot-wrap">
          <span className="ref-activity-group-row-dot" />
        </span>
        <div
          className={`ref-activity-group-row-main${hasExpandableBody ? " ref-activity-group-row-main--toggle-head" : ""}`}
        >
          {hasExpandableBody ? (
            <span className="ref-activity-group-row-inline">
              {readLink && onOpenFile ? (
                <button
                  className="ref-agent-activity-ref-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFile(
                      readLink.path,
                      readLink.startLine,
                      readLink.endLine
                    );
                  }}
                  type="button"
                >
                  {item.text}
                </button>
              ) : (
                <span>{item.text}</span>
              )}
              <span
                aria-hidden
                className={`ref-activity-inline-chevron${expandedBody ? " is-open" : ""}`}
              >
                <InlineChevron open={expandedBody} />
              </span>
              {item.summary ? (
                <span className="ref-agent-activity-summary">
                  {item.summary}
                </span>
              ) : null}
            </span>
          ) : (
            <>
              <span className="ref-activity-group-row-text-cluster">
                {readLink && onOpenFile ? (
                  <button
                    className="ref-agent-activity-ref-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFile(
                        readLink.path,
                        readLink.startLine,
                        readLink.endLine
                      );
                    }}
                    type="button"
                  >
                    {item.text}
                  </button>
                ) : (
                  <span>{item.text}</span>
                )}
              </span>
              {item.summary ? (
                <span className="ref-agent-activity-summary">
                  {item.summary}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
      {hasExpandableBody ? (
        <AnimatedHeightReveal open={expandedBody}>
          <div className="ref-activity-group-row-rest">
            {item.detail ? (
              <pre className="ref-agent-activity-detail">{item.detail}</pre>
            ) : null}
            {hasResultCard ? (
              <AgentResultCard
                animateLineReveal={animateLineReveal}
                forceExpanded
                hideToggleChrome
                kind={resultKind}
                lines={resultLines}
                onOpenFile={onOpenFile}
                readSourcePath={item.agentReadLink?.path}
              />
            ) : null}
          </div>
        </AnimatedHeightReveal>
      ) : null}
    </div>
  );
}

function ExploreIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="13"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden
      className="ref-activity-group-spinner"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="13"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="11"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function InlineChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={`ref-activity-inline-chevron-svg${open ? " is-open" : ""}`}
      fill="none"
      height="11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.3"
      viewBox="0 0 24 24"
      width="11"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
