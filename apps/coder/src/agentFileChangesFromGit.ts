import type { FileChangeSummary } from "./agentChatSegments";

/** 与 main-src/gitService 中 porcelain 路径一致：正斜杠、去 ./ */
export function normalizeWorkspaceRelPath(p: string): string {
  return p.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * 判断是否应该忽略路径大小写（Windows 文件系统不区分大小写）
 *
 * 使用 navigator.platform 检测（浏览器环境）
 * 注意：Electron 主进程应使用 process.platform
 */
function shouldIgnoreWorkspacePathCase(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const platform = String(navigator.platform ?? "").toLowerCase();
  return platform.includes("win");
}

export function normalizeWorkspaceRelPathForMatch(p: string): string {
  const normalized = normalizeWorkspaceRelPath(p);
  return shouldIgnoreWorkspacePathCase()
    ? normalized.toLowerCase()
    : normalized;
}

export function workspaceRelPathsEqual(a: string, b: string): boolean {
  return (
    normalizeWorkspaceRelPathForMatch(a) ===
    normalizeWorkspaceRelPathForMatch(b)
  );
}

export type DiffPreviewStats = { additions: number; deletions: number };

function findDiffPreview(
  previews: Record<string, DiffPreviewStats>,
  relPath: string
): DiffPreviewStats | undefined {
  const n = normalizeWorkspaceRelPathForMatch(relPath);
  const direct = previews[relPath] ?? previews[n];
  if (direct) {
    return direct;
  }
  for (const k of Object.keys(previews)) {
    if (normalizeWorkspaceRelPathForMatch(k) === n) {
      return previews[k];
    }
  }
}

/**
 * 底部「改动文件」条：在 Git 可用时用 `git status` 判断是否仍有工作区改动，
 * 用 `git diff` 统计增删行；否则回退为对话里解析出的行数（无 Git / 非仓库 / git 失败）。
 */
export function mergeAgentFileChangesWithGit(
  fromAssistant: FileChangeSummary[],
  options: {
    gitStatusOk: boolean;
    gitChangedPaths: string[];
    diffPreviews: Record<string, DiffPreviewStats>;
  }
): FileChangeSummary[] {
  const { gitStatusOk, gitChangedPaths, diffPreviews } = options;
  if (!gitStatusOk) {
    return fromAssistant;
  }
  const gitSet = new Set(
    gitChangedPaths.map(normalizeWorkspaceRelPathForMatch)
  );
  const out: FileChangeSummary[] = [];
  for (const f of fromAssistant) {
    const n = normalizeWorkspaceRelPathForMatch(f.path);
    if (!gitSet.has(n)) {
      continue;
    }
    const prev = findDiffPreview(diffPreviews, f.path);
    out.push({
      ...f,
      additions: prev?.additions ?? 0,
      deletions: prev?.deletions ?? 0,
    });
  }
  return out;
}
