/**
 * 持久化 Agent 底部「改动文件」面板的收起/逐文件忽略状态。
 * 聊天记录里的 tool 标记不会随撤销磁盘而消失，故需单独记住用户已处理，避免重启后又弹出。
 */

const STORAGE_KEY_PREFIX = "mai-coder:agent-file-changes:v1:";

export type PersistedAgentFileChanges = {
  v: 1;
  contentHash: string;
  fileChangesDismissed: boolean;
  dismissedPaths: string[];
  revertedPaths: string[];
  revertedChangeKeys: string[];
};

function storageKey(threadId: string): string {
  return `${STORAGE_KEY_PREFIX}${threadId}`;
}

/** 与最后一条助手正文绑定；新回复后哈希变化即视为新一轮，不再沿用旧状态 */
export function hashAgentAssistantContent(content: string): string {
  let h = 2_166_136_261;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return `${(h >>> 0).toString(16)}:${content.length}`;
}

export function readPersistedAgentFileChanges(
  threadId: string
): PersistedAgentFileChanges | null {
  try {
    const raw = localStorage.getItem(storageKey(threadId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<PersistedAgentFileChanges>;
    if (d.v !== 1 || typeof d.contentHash !== "string") return null;
    return {
      contentHash: d.contentHash,
      dismissedPaths: Array.isArray(d.dismissedPaths)
        ? d.dismissedPaths.filter((p) => typeof p === "string")
        : [],
      fileChangesDismissed: !!d.fileChangesDismissed,
      revertedChangeKeys: Array.isArray(d.revertedChangeKeys)
        ? d.revertedChangeKeys.filter((p) => typeof p === "string")
        : [],
      revertedPaths: Array.isArray(d.revertedPaths)
        ? d.revertedPaths.filter((p) => typeof p === "string")
        : [],
      v: 1,
    };
  } catch {
    return null;
  }
}

export function writePersistedAgentFileChanges(
  threadId: string,
  lastAssistantContent: string,
  fileChangesDismissed: boolean,
  dismissedPaths: Set<string>,
  revertedPaths?: Set<string>,
  revertedChangeKeys?: Set<string>
): void {
  try {
    if (!lastAssistantContent.trim()) {
      localStorage.removeItem(storageKey(threadId));
      return;
    }
    const payload: PersistedAgentFileChanges = {
      contentHash: hashAgentAssistantContent(lastAssistantContent),
      dismissedPaths: [...dismissedPaths],
      fileChangesDismissed,
      revertedChangeKeys: [...(revertedChangeKeys ?? new Set<string>())],
      revertedPaths: [...(revertedPaths ?? new Set<string>())],
      v: 1,
    };
    localStorage.setItem(storageKey(threadId), JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}

export function clearPersistedAgentFileChanges(threadId: string): void {
  try {
    localStorage.removeItem(storageKey(threadId));
  } catch {
    /* ignore */
  }
}
