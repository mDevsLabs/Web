import { memo, type RefObject } from "react";
import type { TFunction } from "../i18n";
import { IconCheckCircle, IconPencil, IconTrash } from "../icons";
import type { ThreadInfo } from "../threadTypes";
import { normWorkspaceRootKey } from "../workspaceRootKey";
import { formatThreadRowSubtitle, threadRowTitle } from "./threadRowUi";

export type ThreadItemProps = {
  th: ThreadInfo;
  threadListWorkspace?: string | null;
  workspace: string | null;
  currentId: string | null;
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

/**
 * 单条线程行：
 *  - 不在编辑标题时显示带 lead 图标 + 标题 + 副标题 + 文件/Token 统计的按钮；
 *  - 编辑标题时切换为受控 input（Enter 提交、Esc 取消、blur 提交）；
 *  - 右侧 actions：重命名 + 删除（删除采用二段式 confirm）。
 *
 * 行为与原 App.tsx 内的 `renderThreadItem` 完全一致；提为独立组件后调用方
 * 在 `useAgentLeftSidebarProps` 入口处通过箭头函数桥接。
 */
function ThreadItemImpl(props: ThreadItemProps) {
  const {
    th,
    threadListWorkspace,
    workspace,
    currentId,
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

  return (
    <div
      className={`ref-thread-item ${isActive ? "is-active" : ""} ${
        editingThreadId === th.id ? "is-editing-title" : ""
      }`}
    >
      {editingThreadId === th.id ? (
        <input
          aria-label={t("common.threadTitle")}
          className="ref-thread-title-input"
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
          className="ref-thread-row ref-thread-row--rich"
          onClick={() => void onSelectThread(th.id, threadListWorkspace)}
          onDoubleClick={(e) => {
            e.preventDefault();
            beginThreadTitleEdit(th, threadListWorkspace);
          }}
          type="button"
        >
          <span aria-hidden className="ref-thread-row-lead">
            {th.isAwaitingReply ? (
              <IconPencil className="ref-thread-row-lead-svg" />
            ) : (
              <IconCheckCircle className="ref-thread-row-lead-svg" />
            )}
          </span>
          <span className="ref-thread-row-stack">
            <span className="ref-thread-row-title">
              {threadRowTitle(t, th)}
            </span>
            <span
              className={`ref-thread-row-meta ${isActive ? "is-active-meta" : ""}`}
            >
              {formatThreadRowSubtitle(t, th, isActive)}
            </span>
            {(th.fileStateCount && th.fileStateCount > 0) || th.tokenUsage ? (
              <span className="ref-thread-row-stats">
                {th.fileStateCount && th.fileStateCount > 0 ? (
                  <span
                    className="ref-thread-stat ref-thread-stat--files"
                    title={t("agent.files.count", { count: th.fileStateCount })}
                  >
                    <svg
                      aria-hidden
                      fill="none"
                      height="10"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="10"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {th.fileStateCount}
                  </span>
                ) : null}
                {th.tokenUsage ? (
                  <span
                    className="ref-thread-stat ref-thread-stat--tokens"
                    title={t("usage.totalTokens", {
                      input: th.tokenUsage.totalInput.toLocaleString(),
                      output: th.tokenUsage.totalOutput.toLocaleString(),
                    })}
                  >
                    {t("usage.tokensShort", {
                      input:
                        th.tokenUsage.totalInput > 999
                          ? `${Math.round(th.tokenUsage.totalInput / 1000)}k`
                          : String(th.tokenUsage.totalInput),
                      output:
                        th.tokenUsage.totalOutput > 999
                          ? `${Math.round(th.tokenUsage.totalOutput / 1000)}k`
                          : String(th.tokenUsage.totalOutput),
                    })}
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        </button>
      )}
      <div className="ref-thread-row-actions">
        <button
          aria-label={t("common.renameThread")}
          className="ref-thread-action"
          onClick={(e) => {
            e.stopPropagation();
            beginThreadTitleEdit(th, threadListWorkspace);
          }}
          onMouseDown={(e) => e.preventDefault()}
          title={t("common.rename")}
          type="button"
        >
          <IconPencil className="ref-thread-action-svg" />
        </button>
        <button
          aria-label={
            confirmDeleteId === th.id
              ? t("common.confirmDelete")
              : t("common.deleteThread")
          }
          className={`ref-thread-action ${
            confirmDeleteId === th.id ? "ref-thread-action--confirm" : ""
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
            <span className="ref-thread-action-confirm-label">
              {t("common.confirm")}
            </span>
          ) : (
            <IconTrash className="ref-thread-action-svg" />
          )}
        </button>
      </div>
    </div>
  );
}

export const ThreadItem = memo(ThreadItemImpl);
