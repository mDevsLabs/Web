/**
 * 同一计划文件在不同 UI（审查面板绝对路径 vs 编辑器相对路径）下对齐为同一条「已执行」记录。
 */
export function planExecutedKey(
  workspaceRoot: string | null | undefined,
  relPath?: string | null,
  absPath?: string | null
): string {
  const rel = (relPath ?? "").trim().replace(/\\/g, "/");
  if (rel) {
    return rel.toLowerCase();
  }
  const abs = (absPath ?? "").trim().replace(/\\/g, "/");
  if (!abs) {
    return "";
  }
  if (workspaceRoot) {
    const root = workspaceRoot.replace(/\\/g, "/").replace(/\/$/, "");
    const al = abs.toLowerCase();
    const rl = root.toLowerCase();
    const prefix = `${rl}/`;
    if (al === rl) {
      return "";
    }
    if (al.startsWith(prefix)) {
      return abs.slice(root.length + 1).toLowerCase();
    }
  }
  return abs.toLowerCase();
}

export function isPlanMdPath(p: string): boolean {
  return /\.plan\.md$/i.test(p.replace(/\\/g, "/"));
}
