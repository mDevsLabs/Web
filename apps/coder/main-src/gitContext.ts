/**
 * Git 状态快照注入 — 为 Agent 对话提供当前分支、未提交改动和最近提交的上下文。
 *
 * 使用 memoize 缓存，避免每轮都重复 exec。
 * 缓存有效期 30 秒，适合交互式对话节奏。
 */

import { execFile } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const GIT_CACHE_TTL_MS = 30_000;
const GIT_STATUS_MAX_CHARS = 2000;
const GIT_LOG_LINES = 5;

type GitCache = {
  rootNorm: string;
  block: string;
  ts: number;
};

const cacheByRoot = new Map<string, GitCache>();

async function runGit(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", ...args],
      {
        cwd,
        encoding: "utf8",
        maxBuffer: 512 * 1024,
        timeout: 5000,
        windowsHide: true,
      }
    );
    return stdout.trim();
  } catch {
    return "";
  }
}

/**
 * 返回 Markdown 格式的 git 上下文块。
 * 若 cwd 不是 git 仓库，或 git 不可用，返回空串。
 * 结果缓存 30 秒，同一 root 下多次调用直接返回缓存值。
 */
export async function getGitContextBlock(root: string): Promise<string> {
  const rootNorm = path.normalize(path.resolve(root));
  const now = Date.now();
  const cache = cacheByRoot.get(rootNorm);
  if (cache && now - cache.ts < GIT_CACHE_TTL_MS) {
    return cache.block;
  }

  const [branch, statusRaw, logRaw] = await Promise.all([
    runGit(["branch", "--show-current"], root),
    runGit(["status", "--short"], root),
    runGit(["log", "--oneline", `-${GIT_LOG_LINES}`], root),
  ]);

  if (!branch && !statusRaw && !logRaw) {
    // 不是 git 仓库或 git 不可用
    cacheByRoot.set(rootNorm, { block: "", rootNorm, ts: now });
    return "";
  }

  const status =
    statusRaw.length > GIT_STATUS_MAX_CHARS
      ? statusRaw.slice(0, GIT_STATUS_MAX_CHARS) + "\n... (truncated)"
      : statusRaw;

  const parts: string[] = ["## Git context (snapshot)"];
  if (branch) parts.push(`**Branch:** ${branch}`);
  if (status) {
    parts.push(`**Status:**\n\`\`\`\n${status}\n\`\`\``);
  } else {
    parts.push("**Status:** clean (no uncommitted changes)");
  }
  if (logRaw) {
    parts.push(`**Recent commits:**\n\`\`\`\n${logRaw}\n\`\`\``);
  }

  const block = parts.join("\n\n");
  cacheByRoot.set(rootNorm, { block, rootNorm, ts: now });
  return block;
}

/** 清除某工作区根的缓存（该窗关闭文件夹时调用，避免误清其它窗）。 */
export function clearGitContextCacheForRoot(root: string): void {
  cacheByRoot.delete(path.normalize(path.resolve(root)));
}

/** @deprecated 仅测试或全量重置；多窗场景请用 clearGitContextCacheForRoot。 */
export function clearGitContextCache(): void {
  cacheByRoot.clear();
}
