/** 与主进程 threadStore bucket 键一致：用于跨工作区线程列表的 Map 查找 */
export function normWorkspaceRootKey(p: string): string {
  return p.trim().replace(/\\/g, "/").toLowerCase();
}
