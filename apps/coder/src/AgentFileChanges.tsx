import { useState } from "react";
import type { FileChangeSummary } from "./agentChatSegments";
import { FileTypeIcon } from "./fileTypeIcons";
import { useI18n } from "./i18n";

type Props = {
  files: FileChangeSummary[];
  /**
   * 仍能撤销的相对路径集合（来自 main 进程当前内存中的快照）。
   * 不在集合中的文件 → 重启后内存丢失或更早被 keep 掉，撤销按钮置灰提示用户。
   * 传 undefined 等价于"全部可撤销"，保持向后兼容。
   */
  revertableSnapshotPaths?: ReadonlySet<string>;
  revertNotice?: string | null;
  onDismissRevertNotice?: () => void;
  onOpenFile?: (
    relPath: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { diff?: string | null }
  ) => void;
  onKeepAll?: () => void;
  onRevertAll?: () => void;
  onKeepFile?: (relPath: string) => void;
  onRevertFile?: (relPath: string) => void;
};

function basename(p: string): string {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

export function AgentFileChangesPanel({
  files,
  revertableSnapshotPaths,
  revertNotice,
  onDismissRevertNotice,
  onOpenFile,
  onKeepAll,
  onRevertAll,
  onKeepFile,
  onRevertFile,
}: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);

  if (files.length === 0) return null;

  const hasAnyRevertable = revertableSnapshotPaths
    ? revertableSnapshotPaths.size > 0
    : true;
  const isFileRevertable = (relPath: string) =>
    revertableSnapshotPaths ? revertableSnapshotPaths.has(relPath) : true;
  const revertAllTitle = hasAnyRevertable
    ? undefined
    : t("agent.revert.unavailableTooltip");
  const revertFileTitleNotAvailable = t("agent.revert.unavailableTooltip");

  return (
    <div className="ref-fcp">
      <div className="ref-fcp-header">
        <button
          aria-expanded={expanded}
          className="ref-fcp-toggle"
          onClick={() => setExpanded((e) => !e)}
          type="button"
        >
          <svg
            className={`ref-fc-chevron ${expanded ? "ref-fc-chevron--open" : ""}`}
            fill="none"
            height="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="12"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="ref-fcp-count">
            {t("agent.files.count", { count: files.length })}
          </span>
        </button>
        <span className="ref-fcp-actions">
          <button
            className="ref-fcp-btn ref-fcp-btn--keep"
            onClick={onKeepAll}
            type="button"
          >
            {t("agent.keepAll")}
          </button>
          <button
            className="ref-fcp-btn ref-fcp-btn--revert"
            disabled={!hasAnyRevertable}
            onClick={onRevertAll}
            title={revertAllTitle}
            type="button"
          >
            {t("agent.revertAll")}
          </button>
        </span>
      </div>

      {revertNotice ? (
        <div className="ref-fcp-notice" role="alert">
          <span className="ref-fcp-notice-text">{revertNotice}</span>
          {onDismissRevertNotice ? (
            <button
              aria-label={t("common.dismiss")}
              className="ref-fcp-notice-close"
              onClick={onDismissRevertNotice}
              title={t("common.dismiss")}
              type="button"
            >
              <svg
                fill="none"
                height="12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="12"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}

      {expanded && (
        <div className="ref-fcp-list">
          {files.map((f) => {
            const name = basename(f.path);
            return (
              <div className="ref-fc-row-wrap" key={f.path}>
                <button
                  className="ref-fc-row"
                  onClick={() =>
                    onOpenFile?.(f.path, f.startLine, undefined, {
                      diff: f.diff ?? null,
                    })
                  }
                  title={f.path}
                  type="button"
                >
                  <FileTypeIcon
                    className="ref-fc-icon"
                    fileName={name}
                    isDirectory={false}
                  />
                  <span className="ref-fc-name">{name}</span>
                  <span className="ref-fc-stats">
                    {f.additions > 0 && (
                      <span className="ref-fc-add">+{f.additions}</span>
                    )}
                    {f.deletions > 0 && (
                      <span className="ref-fc-del">-{f.deletions}</span>
                    )}
                  </span>
                </button>
                <span className="ref-fc-file-actions">
                  <button
                    className="ref-fc-file-btn ref-fc-file-btn--keep"
                    onClick={(e) => {
                      e.stopPropagation();
                      onKeepFile?.(f.path);
                    }}
                    title={t("agent.keepFile")}
                    type="button"
                  >
                    <svg
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    className="ref-fc-file-btn ref-fc-file-btn--revert"
                    disabled={!isFileRevertable(f.path)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevertFile?.(f.path);
                    }}
                    title={
                      isFileRevertable(f.path)
                        ? t("agent.revertFile")
                        : revertFileTitleNotAvailable
                    }
                    type="button"
                  >
                    <svg
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <line x1="18" x2="6" y1="6" y2="18" />
                      <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
