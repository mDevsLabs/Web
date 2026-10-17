import * as fs from "node:fs";
import * as path from "node:path";
import type { WebContents } from "electron";

/** 每个渲染进程 WebContents 独立的工作区根（绝对路径或「未打开」）。 */
const rootsByWebContentsId = new Map<number, string>();

/**
 * 绑定当前窗口的工作区根。返回该窗口此前绑定的根（若有），便于调用方做索引引用计数释放。
 */
export function bindWorkspaceRootToWebContents(
  webContents: WebContents,
  root: string | null
): string | null {
  const id = webContents.id;
  const prev = rootsByWebContentsId.has(id)
    ? (rootsByWebContentsId.get(id) as string)
    : null;
  if (root) {
    rootsByWebContentsId.set(id, path.resolve(root));
  } else {
    rootsByWebContentsId.delete(id);
  }
  return prev;
}

export function getWorkspaceRootForWebContents(
  webContents: WebContents | null | undefined
): string | null {
  if (!webContents || webContents.isDestroyed()) {
    return null;
  }
  return rootsByWebContentsId.get(webContents.id) ?? null;
}

export function clearWorkspaceBindingForWebContents(
  webContents: WebContents
): string | null {
  const id = webContents.id;
  const prev = rootsByWebContentsId.has(id)
    ? (rootsByWebContentsId.get(id) as string)
    : null;
  rootsByWebContentsId.delete(id);
  return prev;
}

/** 在 WebContents 销毁时移除绑定，避免 id 复用串台。 */
export function onWebContentsDestroyed(
  webContents: WebContents,
  cb: (releasedRoot: string | null) => void
): void {
  webContents.once("destroyed", () => {
    const prev = clearWorkspaceBindingForWebContents(webContents);
    cb(prev);
  });
}

/** Resolve user-supplied path (absolute or relative to workspace) and ensure it stays inside workspace.
 *  Secure: resolves symlinks via realpath, rejects UNC/extended paths escaping root,
 *  case-insensitive check on Windows/macOS. */
export function resolveWorkspacePath(
  userPath: string,
  workspaceRoot: string | null
): string {
  if (!workspaceRoot) {
    throw new Error("No workspace folder open.");
  }
  if (
    typeof userPath !== "string" ||
    !userPath.trim() ||
    userPath.includes("\0")
  ) {
    throw new Error("Invalid path.");
  }
  const trimmed = userPath.trim();
  // Reject UNC / extended-length / device paths outright (Windows).
  if (
    /^(\\\\|\/\/|[A-Za-z]:[\\/]|\\\\\?\\|\\\\\.\\)/.test(trimmed) &&
    path.isAbsolute(trimmed)
  ) {
    // Absolute paths are only allowed if they resolve inside the workspace below.
  }
  const resolved = path.isAbsolute(trimmed)
    ? path.resolve(trimmed)
    : path.resolve(workspaceRoot, trimmed);
  if (!isPathInsideRoot(resolved, workspaceRoot)) {
    throw new Error("Path escapes workspace.");
  }
  // TOCTOU-safe: resolve symlinks for both root and target (if target exists).
  try {
    const realRoot = fs.realpathSync(workspaceRoot);
    // Only realpath the existing prefix of the target to support new files.
    let existing: string = resolved;
    const missing: string[] = [];
    while (!fs.existsSync(existing) && existing !== path.dirname(existing)) {
      missing.unshift(path.basename(existing));
      existing = path.dirname(existing);
    }
    const realExisting = fs.existsSync(existing)
      ? fs.realpathSync(existing)
      : path.normalize(existing);
    const realTarget = missing.length
      ? path.join(realExisting, ...missing)
      : realExisting;
    if (!isPathInsideRoot(realTarget, realRoot)) {
      throw new Error("Path escapes workspace via symlink.");
    }
    return path.normalize(realTarget);
  } catch (e) {
    if (e instanceof Error && /symlink|escapes workspace/.test(e.message))
      throw e;
    // realpath failed (e.g. missing file deep inside workspace): fall back to normalized check above.
    return path.normalize(resolved);
  }
}

export function isPathInsideRoot(filePath: string, root: string): boolean {
  const normalize = (p: string): string => {
    let n = path.normalize(p);
    // On Windows/macOS the FS is usually case-insensitive: compare lowercase.
    if (process.platform === "win32" || process.platform === "darwin")
      n = n.toLowerCase();
    // Strip trailing separators for stable comparison.
    if (n.length > 1) n = n.replace(/[\\/]+$/, "");
    return n;
  };
  const a = normalize(filePath);
  const b = normalize(root);
  if (a === b) {
    return true;
  }
  const rel = path.relative(b, a);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}
