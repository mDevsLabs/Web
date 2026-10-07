/** 编辑器内 Markdown 文件：Monaco 源码 vs 渲染预览 */

export type MarkdownEditorViewMode = "source" | "preview";

export function isMarkdownEditorPath(relPath: string): boolean {
  const n = relPath.replace(/\\/g, "/").toLowerCase();
  return n.endsWith(".md") || n.endsWith(".mdx");
}

/** 新打开标签时的默认视图：计划文档默认预览，其余 Markdown 默认源码（便于直接改） */
export function defaultMarkdownViewForPath(
  relPath: string
): MarkdownEditorViewMode {
  return /\.plan\.md$/i.test(relPath.replace(/\\/g, "/"))
    ? "preview"
    : "source";
}

export function initialMarkdownViewForTab(
  relPath: string
): MarkdownEditorViewMode | undefined {
  if (!isMarkdownEditorPath(relPath)) {
    return;
  }
  return defaultMarkdownViewForPath(relPath);
}

/** 从标签读取当前模式（兼容旧标签无 markdownView） */
export function markdownViewForTab(
  relPath: string,
  tabMarkdownView: MarkdownEditorViewMode | undefined
): MarkdownEditorViewMode | null {
  if (!isMarkdownEditorPath(relPath)) {
    return null;
  }
  return tabMarkdownView ?? defaultMarkdownViewForPath(relPath);
}

/** 去掉任意 Markdown 文件顶部的 `---` YAML 块（用于解析 `# Plan:` 正文等） */
export function stripLeadingYamlFrontmatter(content: string): string {
  const t = content.trimStart();
  if (!t.startsWith("---")) {
    return content;
  }
  const end = t.indexOf("\n---", 3);
  if (end < 0) {
    return content;
  }
  return t
    .slice(end + 4)
    .replace(/^\s*\n/, "")
    .trimStart();
}

/**
 * `.plan.md` 顶部 YAML frontmatter 在渲染预览中隐藏，避免重复展示结构化元数据。
 */
export function stripPlanFrontmatterForPreview(
  relPath: string,
  content: string
): string {
  if (!/\.plan\.md$/i.test(relPath.replace(/\\/g, "/"))) {
    return content;
  }
  return stripLeadingYamlFrontmatter(content);
}
