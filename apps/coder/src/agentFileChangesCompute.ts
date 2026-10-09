import type { MutableRefObject } from "react";
import {
  collectFileChanges,
  type FileChangeSummary,
  segmentAssistantContentUnified,
} from "./agentChatSegments";
import {
  type DiffPreviewStats,
  mergeAgentFileChangesWithGit,
  workspaceRelPathsEqual,
} from "./agentFileChangesFromGit";
import type { ComposerMode } from "./ComposerPlusMenu";
import type { TFunction } from "./i18n";
import type { ChatMessage } from "./threadTypes";

export type GitMergePack = {
  gitStatusOk: boolean;
  gitChangedPaths: string[];
  diffPreviews: Record<string, DiffPreviewStats>;
};

type SegmentCache = MutableRefObject<{
  content: string;
  result: ReturnType<typeof segmentAssistantContentUnified>;
} | null>;

/**
 * 底部「Agent 改动文件」条：解析最后一条助手消息并与 Git 合并。
 * 供 AgentChatPanel 内计算（避免 Git 更新时拖垮 useAgentChatPanelProps），
 * 以及 onRevertAllEdits 在点击时取路径快照（segmentCacheRef 传 null 即可）。
 */
export function computeMergedAgentFileChanges(
  displayMessages: ChatMessage[],
  composerMode: ComposerMode,
  t: TFunction,
  dismissedFiles: ReadonlySet<string>,
  git: GitMergePack,
  segmentCacheRef: SegmentCache | null,
  snapshotPaths: ReadonlySet<string> = new Set<string>()
): FileChangeSummary[] {
  if (composerMode !== "agent" && composerMode !== "team") {
    return [];
  }
  const lastAssistant = [...displayMessages]
    .reverse()
    .find((m) => m.role === "assistant");
  let all: FileChangeSummary[] = [];
  if (lastAssistant) {
    let segs: ReturnType<typeof segmentAssistantContentUnified>;
    if (segmentCacheRef?.current?.content === lastAssistant.content) {
      segs = segmentCacheRef.current.result;
    } else {
      segs = segmentAssistantContentUnified(lastAssistant.content, { t });
      if (segmentCacheRef) {
        segmentCacheRef.current = {
          content: lastAssistant.content,
          result: segs,
        };
      }
    }
    all = collectFileChanges(segs);
  }
  if (snapshotPaths.size > 0) {
    const seen = new Set(all.map((file) => file.path));
    for (const relPath of snapshotPaths) {
      if (!relPath || seen.has(relPath)) {
        continue;
      }
      all.push({ additions: 0, deletions: 0, path: relPath });
      seen.add(relPath);
    }
  }
  const afterDismiss =
    dismissedFiles.size > 0
      ? all.filter((f) => !dismissedFiles.has(f.path))
      : all;
  const merged = mergeAgentFileChangesWithGit(afterDismiss, {
    diffPreviews: git.diffPreviews,
    gitChangedPaths: git.gitChangedPaths,
    gitStatusOk: git.gitStatusOk,
  });
  if (!git.gitStatusOk || snapshotPaths.size === 0) {
    return merged;
  }
  const out = [...merged];
  for (const relPath of snapshotPaths) {
    if (dismissedFiles.has(relPath)) {
      continue;
    }
    if (out.some((file) => workspaceRelPathsEqual(file.path, relPath))) {
      continue;
    }
    const stats = Object.entries(git.diffPreviews).find(([path]) =>
      workspaceRelPathsEqual(path, relPath)
    )?.[1];
    out.push({
      additions: stats?.additions ?? 0,
      deletions: stats?.deletions ?? 0,
      path: relPath,
    });
  }
  return out;
}
