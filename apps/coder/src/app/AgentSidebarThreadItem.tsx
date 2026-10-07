import { memo, type RefObject } from "react";
import type { TFunction } from "../i18n";
import { IconPencil, IconTrash } from "../icons";
import type { ThreadInfo } from "../threadTypes";
import { normWorkspaceRootKey } from "../workspaceRootKey";
import { threadRowTitle } from "./threadRowUi";

function formatRelativeTime(t: TFunction, timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return t("time.justNow");
  if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
  if (diffHour < 24) return t("time.hoursAgo", { count: diffHour });
  if (diffDay < 30) return t("time.daysAgo", { count: diffDay });
  if (diffDay < 365)
    return t("time.monthsAgo", { count: Math.floor(diffDay / 30) });
  return t("time.yearsAgo", { count: Math.floor(diffDay / 365) });
}

export type AgentSidebarThreadItemProps = {
  th: ThreadInfo;
  threadListWorkspace?: string | null;
  workspace: string | null;
  currentId: string | null;
  hasUnreadAgentReply?: boolean;
  /** Front-end 当前正在流式回复的线程 id；用于无延迟显示「正在回复」状态 */
  streamingThreadId?: string | null;
  /** 当前会话是否仍在等模型：暂停/结束后为 false，用于盖过尚未刷新的 `th.isAwaitingReply` */
  awaitingReply?: boolean;
  editingThreadId: string | null;
  editingThreadTitleDraft: string;
  setEditingThreadTitleDraft: (v: string) => void;
  threadTitleDraftRef: { current: string };
  threadTitleInputRef: RefObject<HTMLInputElement | null>;
  commitThreadTitleEdit: () => Promise<void>;
  cancelThreadTitleEdit: () => void;
  beginThreadTitleEdit: (
    t: ThreadInfo,
    threadListWorkspace?: string | null
  ) => void;
  onSelectThread: (
    id: string,
    threadListWorkspace?: string | null
  ) => Promise<void>;
  confirmDeleteId: string | null;
  onDeleteThread: (
    e: React.MouseEvent,
    id: string,
    threadWorkspaceRoot?: string | null
  ) => Promise<void>;
  t: TFunction;
};

function AgentSidebarThreadItemImpl(props: AgentSidebarThreadItemProps) {
  const {
    th,
    threadListWorkspace,
    workspace,
    currentId,
    hasUnreadAgentReply = false,
    streamingThreadId = null,
    awaitingReply = true,
    editingThreadId,
    editingThreadTitleDraft,
    setEditingThreadTitleDraft,
    threadTitleDraftRef,
    threadTitleInputRef,
    commitThreadTitleEdit,
    cancelThreadTitleEdit,
    beginThreadTitleEdit,
    onSelectThread,
    confirmDeleteId,
    onDeleteThread,
    t,
  } = props;

  const owningWs = threadListWorkspace ?? workspace;
  const isActive =
    th.id === currentId &&
    (!workspace ||
      !owningWs ||
      normWorkspaceRootKey(owningWs) === normWorkspaceRootKey(workspace));
  // 本地正在流式回复 → 立即显示「正在回复」，无需等待主进程列表刷新；
  // 主进程列表也会同步置位 isAwaitingReply，作为兜底（例如刷新慢于本地状态）。
  // 用户已暂停时本地 awaitingReply 先置 false，摘要仍可能短暂为「末条 user」— 当前激活行勿再显示工作中。
  const isStreamingThisThread = streamingThreadId === th.id;
  const serverAwaiting = Boolean(th.isAwaitingReply);
  const staleServerAwaiting = isActive && !awaitingReply;
  const isWorking =
    isStreamingThisThread || (serverAwaiting && !staleServerAwaiting);
  const showUnread = hasUnreadAgentReply && !isActive && !isWorking;

  return (
    <div
      className={`ref-agent-thread-item ${isActive ? "is-active" : ""} ${
        isWorking ? "is-awaiting-reply" : ""
      } ${showUnread ? "has-unread-reply" : ""} ${
        editingThreadId === th.id ? "is-editing-title" : ""
      }`}
    >
      {editingThreadId === th.id ? (
        <input
          aria-label={t("common.threadTitle")}
          className="ref-agent-thread-title-input"
          onBlur={() => void commitThreadTitleEdit()}
          onChange={(e) => {
            const v = e.target.value;
            setEditingThreadTitleDraft(v);
            threadTitleDraftRef.current = v;
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commitThreadTitleEdit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelThreadTitleEdit();
            }
          }}
          ref={threadTitleInputRef}
          type="text"
          value={editingThreadTitleDraft}
        />
      ) : (
        <button
          className="ref-agent-thread-row"
          onClick={() => void onSelectThread(th.id, threadListWorkspace)}
          onDoubleClick={(e) => {
            e.preventDefault();
            beginThreadTitleEdit(th, threadListWorkspace);
          }}
          type="button"
        >
          <span className="ref-agent-thread-row-title">
            {threadRowTitle(t, th)}
          </span>
          {isWorking ? (
            <span
              aria-label="Agent 正在回复"
              className="ref-agent-thread-status ref-agent-thread-status--working"
            >
              <span aria-hidden />
              <span aria-hidden />
              <span aria-hidden />
            </span>
          ) : showUnread ? (
            <span
              aria-label="有未读回复"
              className="ref-agent-thread-status ref-agent-thread-status--unread"
            />
          ) : null}
          <span className="ref-agent-thread-row-time">
            {formatRelativeTime(t, th.updatedAt)}
          </span>
        </button>
      )}
      <div className="ref-agent-thread-row-actions">
        <button
          aria-label={t("common.renameThread")}
          className="ref-agent-thread-action"
          onClick={(e) => {
            e.stopPropagation();
            beginThreadTitleEdit(th, threadListWorkspace);
          }}
          onMouseDown={(e) => e.preventDefault()}
          title={t("common.rename")}
          type="button"
        >
          <IconPencil className="ref-agent-thread-action-svg" />
        </button>
        <button
          aria-label={
            confirmDeleteId === th.id
              ? t("common.confirmDelete")
              : t("common.deleteThread")
          }
          className={`ref-agent-thread-action ${
            confirmDeleteId === th.id ? "ref-agent-thread-action--confirm" : ""
          }`}
          onClick={(e) => void onDeleteThread(e, th.id, threadListWorkspace)}
          onMouseDown={(e) => e.preventDefault()}
          title={
            confirmDeleteId === th.id
              ? t("common.confirmDelete")
              : t("common.delete")
          }
          type="button"
        >
          {confirmDeleteId === th.id ? (
            <span className="ref-agent-thread-action-confirm-label">
              {t("common.confirm")}
            </span>
          ) : (
            <IconTrash className="ref-agent-thread-action-svg" />
          )}
        </button>
      </div>
    </div>
  );
}

export const AgentSidebarThreadItem = memo(AgentSidebarThreadItemImpl);
