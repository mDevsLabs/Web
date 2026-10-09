import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
} from "react";
import { countDiffAddDel } from "../agentChatSegments";
import {
  normalizeWorkspaceRelPath,
  workspaceRelPathsEqual,
} from "../agentFileChangesFromGit";
import { buildAgentFilePreviewHunks } from "../agentFilePreviewDiff";
import type { ShellLayoutMode } from "../app/shellLayoutStorage";
import { debugDiffHead } from "../appDiffUtils";
import { voidShellDebugLog } from "../tabCloseDebug";
import type {
  AgentFilePreviewKind,
  AgentFilePreviewState,
  AgentFilePreviewUnsupportedReason,
} from "./useAgentFileReview";
import type { AgentConversationFileOpenOptions } from "./useFileOperations";
import type { AgentRightSidebarView } from "./useTeamSessionActions";

type DiffPreview = {
  diff: string;
  isBinary: boolean;
  additions: number;
  deletions: number;
};

type SafeTextPreviewReadResult =
  | {
      ok: true;
      canReadText: true;
      content: string;
      fileSize?: number;
      previewKind?: AgentFilePreviewKind;
    }
  | {
      ok: true;
      canReadText: false;
      content?: string;
      fileSize?: number;
      previewKind?: AgentFilePreviewKind;
      unsupportedReason?: AgentFilePreviewUnsupportedReason;
      imageUrl?: string;
    }
  | {
      ok?: false;
      error?: string;
    };

const AGENT_FILE_PREVIEW_MAX_TEXT_BYTES = 1_500_000;

export type AgentGitPack = {
  gitStatusOk: boolean;
  gitChangedPaths: string[];
  diffPreviews: Record<string, DiffPreview>;
};

export type UseAgentSidebarFilePreviewParams = {
  shell: NonNullable<Window["maiShell"]> | undefined;
  layoutMode: ShellLayoutMode;
  currentId: string | null;
  openFileInTab: (
    rel: string,
    revealLine?: number,
    revealEndLine?: number,
    options?: { background?: boolean } & AgentConversationFileOpenOptions
  ) => Promise<void> | void;
  agentGitPackRef: MutableRefObject<AgentGitPack>;
  setAgentRightSidebarView: Dispatch<SetStateAction<AgentRightSidebarView>>;
  setAgentRightSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setAgentFilePreview: Dispatch<SetStateAction<AgentFilePreviewState | null>>;
  agentFilePreviewRequestRef: MutableRefObject<number>;
};

export type AgentSidebarFilePreviewOpener = (
  rel: string,
  revealLine?: number,
  revealEndLine?: number,
  options?: AgentConversationFileOpenOptions
) => Promise<void>;

/**
 * 在 agent 布局右侧栏打开"文件预览 + diff"。
 *
 * 实现细节：四级 diff 来源回退，行为与原 App.tsx 完全一致：
 *  1. 来源 diff（assistant 消息直接给出的 patch / preview）；
 *  2. agent 快照（snapshot），通过 createTwoFilesPatch 生成；
 *  3. 权威 git diff（仅当 Git 已报告该路径有变更，或需要校验可撤销快照时）；
 *  4. 缓存的 git preview 兜底。
 *
 * 同时维护 requestId 抗竞态：每次进入 +1，最终写入前若 ref 已变则丢弃。
 */
export function useAgentSidebarFilePreview(
  params: UseAgentSidebarFilePreviewParams
): AgentSidebarFilePreviewOpener {
  const {
    shell,
    layoutMode,
    currentId,
    openFileInTab,
    agentGitPackRef,
    setAgentRightSidebarView,
    setAgentRightSidebarOpen,
    setAgentFilePreview,
    agentFilePreviewRequestRef,
  } = params;

  return useCallback(
    async (
      rel: string,
      revealLine?: number,
      revealEndLine?: number,
      options?: AgentConversationFileOpenOptions
    ) => {
      if (!shell || layoutMode !== "agent") {
        await openFileInTab(rel, revealLine, revealEndLine, options);
        return;
      }

      const { gitStatusOk, gitChangedPaths, diffPreviews } =
        agentGitPackRef.current;
      const normalizedRel = normalizeWorkspaceRelPath(rel);
      const safeRevealLine =
        typeof revealLine === "number" &&
        Number.isFinite(revealLine) &&
        revealLine > 0
          ? Math.floor(revealLine)
          : undefined;
      const safeRevealEndLine =
        typeof revealEndLine === "number" &&
        Number.isFinite(revealEndLine) &&
        revealEndLine > 0
          ? Math.floor(revealEndLine)
          : undefined;
      const sourceDiff =
        typeof options?.diff === "string" ? options.diff.trim() : "";
      const sourceAllowsReviewActions = options?.allowReviewActions === true;
      const useSourceReadonlyFallback = !gitStatusOk && sourceDiff.length > 0;
      const isGitChanged = gitChangedPaths.some((path) =>
        workspaceRelPathsEqual(path, normalizedRel)
      );
      voidShellDebugLog("agent-file-preview:open:start", {
        allowReviewActions: sourceAllowsReviewActions,
        currentId: currentId ?? "",
        isGitChanged,
        layoutMode,
        relPath: normalizedRel,
        revealEndLine: safeRevealEndLine ?? null,
        revealLine: safeRevealLine ?? null,
        sourceDiffHead: sourceDiff ? debugDiffHead(sourceDiff) : "",
        sourceDiffLength: sourceDiff.length,
        useSourceReadonlyFallback,
      });

      setAgentRightSidebarView("file");
      setAgentRightSidebarOpen(true);
      setAgentFilePreview((prev) => ({
        additions: 0,
        content: prev?.relPath === normalizedRel ? prev.content : "",
        deletions: 0,
        diff:
          sourceAllowsReviewActions || useSourceReadonlyFallback
            ? sourceDiff
            : "",
        fileSize: prev?.relPath === normalizedRel ? prev.fileSize : undefined,
        imageUrl: undefined,
        isBinary: false,
        loading: true,
        previewKind:
          prev?.relPath === normalizedRel ? prev.previewKind : "text",
        readError: null,
        relPath: normalizedRel,
        revealEndLine: safeRevealEndLine,
        revealLine: safeRevealLine,
        reviewMode:
          prev?.relPath === normalizedRel && sourceAllowsReviewActions
            ? prev.reviewMode
            : "readonly",
        unsupportedReason: null,
      }));

      const requestId = ++agentFilePreviewRequestRef.current;
      let content = "";
      let readError: string | null = null;
      let previewKind: AgentFilePreviewKind = "text";
      let fileSize: number | undefined;
      let unsupportedReason: AgentFilePreviewUnsupportedReason | null = null;
      let imageUrl: string | undefined;
      try {
        const fileResult = (await shell.invoke(
          "fs:readTextPreview",
          normalizedRel,
          {
            maxBytes: AGENT_FILE_PREVIEW_MAX_TEXT_BYTES,
          }
        )) as SafeTextPreviewReadResult;
        if (fileResult.ok) {
          fileSize = fileResult.fileSize;
          previewKind = fileResult.previewKind ?? previewKind;
          if (fileResult.canReadText) {
            content = fileResult.content;
          } else {
            unsupportedReason =
              fileResult.unsupportedReason ?? "unsupported-type";
            imageUrl =
              typeof fileResult.imageUrl === "string"
                ? fileResult.imageUrl
                : undefined;
          }
        } else {
          readError = fileResult.error ?? "Unable to read file preview.";
        }
      } catch (err) {
        readError = err instanceof Error ? err.message : String(err);
      }

      let previewDiff =
        sourceAllowsReviewActions || useSourceReadonlyFallback
          ? sourceDiff
          : "";
      let isBinary = unsupportedReason !== null;
      let additions = 0;
      let deletions = 0;
      let reviewMode: AgentFilePreviewState["reviewMode"] = "readonly";
      voidShellDebugLog("agent-file-preview:open:path-match", {
        gitChangedCount: gitChangedPaths.length,
        gitChangedHead: gitChangedPaths.slice(0, 12).join(" | "),
        isGitChanged,
        relPath: normalizedRel,
      });

      if (
        currentId &&
        sourceAllowsReviewActions &&
        unsupportedReason === null &&
        !readError
      ) {
        try {
          const snapshotResult = (await shell.invoke(
            "agent:getFileSnapshot",
            currentId,
            normalizedRel
          )) as
            | { ok: true; hasSnapshot: false }
            | { ok: true; hasSnapshot: true; previousContent: string | null }
            | { ok?: false };
          if (snapshotResult?.ok && snapshotResult.hasSnapshot) {
            const previousContent = snapshotResult.previousContent ?? "";
            const { createTwoFilesPatch } = await import("diff");
            previewDiff = createTwoFilesPatch(
              `a/${normalizedRel}`,
              `b/${normalizedRel}`,
              previousContent,
              content,
              "",
              "",
              { context: 3 }
            ).trim();
            reviewMode = "snapshot";
            readError = null;
            voidShellDebugLog("agent-file-preview:open:snapshot", {
              contentLength: content.length,
              diffHead: debugDiffHead(previewDiff),
              diffLength: previewDiff.length,
              hunkCount: (await buildAgentFilePreviewHunks(previewDiff)).length,
              previousLength: previousContent.length,
              relPath: normalizedRel,
            });
          }
        } catch {
          /* snapshot lookup failed; fall back to git preview */
        }
      }

      let authoritativeGitPreviewLoaded = false;
      if (
        gitStatusOk &&
        unsupportedReason === null &&
        (isGitChanged || sourceAllowsReviewActions)
      ) {
        try {
          const fullDiffResult = (await shell.invoke("git:diffPreview", {
            full: true,
            relPath: normalizedRel,
          })) as
            | { ok: true; preview: DiffPreview }
            | { ok: false; error?: string };
          if (fullDiffResult.ok && fullDiffResult.preview) {
            authoritativeGitPreviewLoaded = true;
            const gitPreviewDiff = String(fullDiffResult.preview.diff ?? "");
            const gitPreviewIsBinary = fullDiffResult.preview.isBinary === true;
            const gitPreviewAdditions = fullDiffResult.preview.additions ?? 0;
            const gitPreviewDeletions = fullDiffResult.preview.deletions ?? 0;
            const gitPreviewHead = debugDiffHead(gitPreviewDiff);
            if (!sourceAllowsReviewActions || reviewMode !== "snapshot") {
              previewDiff = gitPreviewDiff;
              isBinary = unsupportedReason !== null || gitPreviewIsBinary;
              additions = gitPreviewAdditions;
              deletions = gitPreviewDeletions;
              reviewMode = "readonly";
            } else if (!gitPreviewDiff.trim()) {
              // Snapshot exists but git shows clean: trust git and hide stale inline diff.
              previewDiff = "";
              isBinary = unsupportedReason !== null || gitPreviewIsBinary;
              additions = gitPreviewAdditions;
              deletions = gitPreviewDeletions;
              reviewMode = "readonly";
            }
            voidShellDebugLog("agent-file-preview:open:git-authoritative", {
              additions: gitPreviewAdditions,
              deletions: gitPreviewDeletions,
              diffHead: gitPreviewHead,
              diffLength: gitPreviewDiff.length,
              hunkCount:
                unsupportedReason !== null || gitPreviewIsBinary
                  ? 0
                  : (await buildAgentFilePreviewHunks(gitPreviewDiff)).length,
              isBinary: gitPreviewIsBinary,
              relPath: normalizedRel,
              reviewMode,
            });
          }
        } catch {
          /* fall back to cached preview/status heuristics below */
        }
      }

      if (
        !authoritativeGitPreviewLoaded &&
        !previewDiff &&
        gitStatusOk &&
        isGitChanged &&
        unsupportedReason === null
      ) {
        const cachedPreview = Object.entries(diffPreviews).find(([path]) =>
          workspaceRelPathsEqual(path, normalizedRel)
        )?.[1];
        voidShellDebugLog("agent-file-preview:open:git-start", {
          cachedDiffLength: String(cachedPreview?.diff ?? "").length,
          gitStatusOk,
          hasCachedPreview: Boolean(cachedPreview),
          isGitChanged,
          relPath: normalizedRel,
        });
        if (cachedPreview) {
          isBinary =
            unsupportedReason !== null || cachedPreview.isBinary === true;
          additions = cachedPreview.additions ?? 0;
          deletions = cachedPreview.deletions ?? 0;
        }
        try {
          const fullDiffResult = (await shell.invoke("git:diffPreview", {
            full: true,
            relPath: normalizedRel,
          })) as
            | { ok: true; preview: DiffPreview }
            | { ok: false; error?: string };
          if (fullDiffResult.ok && fullDiffResult.preview) {
            previewDiff = String(fullDiffResult.preview.diff ?? "");
            isBinary =
              unsupportedReason !== null ||
              fullDiffResult.preview.isBinary === true;
            additions = fullDiffResult.preview.additions ?? additions;
            deletions = fullDiffResult.preview.deletions ?? deletions;
            reviewMode = "readonly";
            voidShellDebugLog("agent-file-preview:open:git-full", {
              additions,
              deletions,
              diffHead: debugDiffHead(previewDiff),
              diffLength: previewDiff.length,
              hunkCount: isBinary
                ? 0
                : (await buildAgentFilePreviewHunks(previewDiff)).length,
              isBinary,
              relPath: normalizedRel,
            });
          }
        } catch {
          if (cachedPreview) {
            previewDiff = String(cachedPreview.diff ?? "");
            isBinary =
              unsupportedReason !== null || cachedPreview.isBinary === true;
            additions = cachedPreview.additions ?? 0;
            deletions = cachedPreview.deletions ?? 0;
            reviewMode = "readonly";
            voidShellDebugLog("agent-file-preview:open:git-cached-fallback", {
              additions,
              deletions,
              diffHead: debugDiffHead(previewDiff),
              diffLength: previewDiff.length,
              hunkCount: isBinary
                ? 0
                : (await buildAgentFilePreviewHunks(previewDiff)).length,
              isBinary,
              relPath: normalizedRel,
            });
          }
        }
      }

      if (
        !authoritativeGitPreviewLoaded &&
        previewDiff &&
        !isBinary &&
        isGitChanged &&
        reviewMode === "readonly" &&
        (await buildAgentFilePreviewHunks(previewDiff)).length === 0
      ) {
        try {
          const fullDiffResult = (await shell.invoke("git:diffPreview", {
            full: true,
            relPath: normalizedRel,
          })) as
            | { ok: true; preview: DiffPreview }
            | { ok: false; error?: string };
          if (fullDiffResult.ok && fullDiffResult.preview) {
            previewDiff = String(fullDiffResult.preview.diff ?? "");
            isBinary =
              unsupportedReason !== null ||
              fullDiffResult.preview.isBinary === true;
            additions = fullDiffResult.preview.additions ?? additions;
            deletions = fullDiffResult.preview.deletions ?? deletions;
            voidShellDebugLog("agent-file-preview:open:git-retry-full", {
              additions,
              deletions,
              diffHead: debugDiffHead(previewDiff),
              diffLength: previewDiff.length,
              hunkCount: isBinary
                ? 0
                : (await buildAgentFilePreviewHunks(previewDiff)).length,
              isBinary,
              relPath: normalizedRel,
            });
          }
        } catch {
          /* keep the existing preview fallback */
        }
      }

      if (previewDiff) {
        const stats = countDiffAddDel(previewDiff);
        additions = additions || stats.additions;
        deletions = deletions || stats.deletions;
        readError = null;
      }

      const previewHunks = isBinary
        ? []
        : await buildAgentFilePreviewHunks(previewDiff);
      if (
        currentId &&
        sourceAllowsReviewActions &&
        previewDiff &&
        !isBinary &&
        reviewMode === "readonly" &&
        previewHunks.length > 0
      ) {
        try {
          const seedResult = (await shell.invoke("agent:seedFileSnapshot", {
            content,
            diff: previewDiff,
            relPath: normalizedRel,
            threadId: currentId,
          })) as {
            ok?: boolean;
            seeded?: boolean;
            previousLength?: number;
            error?: string;
          };
          if (seedResult?.ok && seedResult.seeded) {
            reviewMode = "snapshot";
            voidShellDebugLog("agent-file-preview:open:seeded-snapshot", {
              contentLength: content.length,
              diffHead: debugDiffHead(previewDiff),
              diffLength: previewDiff.length,
              hunkCount: previewHunks.length,
              previousLength: seedResult.previousLength ?? 0,
              relPath: normalizedRel,
            });
          }
        } catch {
          /* derived snapshot seeding failed; keep readonly preview */
        }
      }

      if (requestId !== agentFilePreviewRequestRef.current) {
        voidShellDebugLog("agent-file-preview:open:stale", {
          activeRequestId: agentFilePreviewRequestRef.current,
          relPath: normalizedRel,
          requestId,
        });
        return;
      }

      voidShellDebugLog("agent-file-preview:open:final", {
        additions,
        contentLength: content.length,
        deletions,
        diffHead: previewDiff ? debugDiffHead(previewDiff) : "",
        diffLength: previewDiff.length,
        fileSize: fileSize ?? null,
        hunkCount: previewHunks.length,
        isBinary,
        previewKind,
        readError: readError ?? "",
        relPath: normalizedRel,
        reviewMode,
        unsupportedReason: unsupportedReason ?? "",
      });

      setAgentFilePreview({
        additions,
        content,
        deletions,
        diff: previewDiff,
        fileSize,
        imageUrl,
        isBinary,
        loading: false,
        previewKind,
        readError,
        relPath: normalizedRel,
        revealEndLine: safeRevealEndLine,
        revealLine: safeRevealLine,
        reviewMode,
        unsupportedReason,
      });
    },
    [
      currentId,
      layoutMode,
      openFileInTab,
      shell,
      agentGitPackRef,
      setAgentRightSidebarView,
      setAgentRightSidebarOpen,
      setAgentFilePreview,
      agentFilePreviewRequestRef,
    ]
  );
}
