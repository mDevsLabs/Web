export type AtMenuIcon = "branch" | "browser" | "folder" | "chat" | "file";

export type AtMenuItem = {
  id: string;
  label: string;
  subtitle?: string;
  insertText: string;
  icon: AtMenuIcon;
};

/** 光标是否在 `@查询词` 片段内（从光标向前找最近的 @，中间无空白） */
export function getAtMentionRange(
  value: string,
  caret: number
): { start: number; query: string } | null {
  if (caret <= 0) {
    return null;
  }
  const slice = value.slice(0, caret);
  /* ASCII @ 与全角 ＠（部分输入法） */
  const match = slice.match(/(?:@|\uFF03)([^\s@\n\uFF03]*)$/);
  if (!match || match.index === undefined) {
    return null;
  }
  return { query: match[1] ?? "", start: match.index };
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

export function filterAtMenuItems(
  items: AtMenuItem[],
  query: string
): AtMenuItem[] {
  const q = norm(query);
  if (!q) {
    return items;
  }
  return items.filter((it) => {
    const hay = norm(`${it.label} ${it.subtitle ?? ""} ${it.insertText}`);
    return hay.includes(q);
  });
}

/** 非文件类 @ 项（Branch、Browser 等） */
export function buildStaticAtMenuItems(opts: {
  currentThreadTitle: string;
  workspaceOpen: boolean;
}): AtMenuItem[] {
  const items: AtMenuItem[] = [
    {
      icon: "branch",
      id: "branch",
      insertText: "@Branch",
      label: "Branch",
      subtitle: "使用当前分支 diff 作为上下文",
    },
    {
      icon: "browser",
      id: "browser",
      insertText: "@Browser",
      label: "Browser",
      subtitle: "启用浏览器工具（即将推出）",
    },
    {
      icon: "folder",
      id: "files",
      insertText: "@Files",
      label: "Files & Folders",
      subtitle: opts.workspaceOpen ? "引用工作区路径" : "请先打开工作区",
    },
    {
      icon: "chat",
      id: "past-chats",
      insertText: "@PastChats",
      label: "Past Chats",
      subtitle: "在提示中引用历史会话（占位）",
    },
  ];

  if (opts.currentThreadTitle.trim()) {
    const t = opts.currentThreadTitle.trim();
    items.push({
      icon: "chat",
      id: "current-thread",
      insertText: `@Chat:${t.slice(0, 48)}`,
      label: t.length > 36 ? `${t.slice(0, 36)}…` : t,
      subtitle: "当前会话标题",
    });
  }

  return items;
}

/**
 * 从工作区文件列表中按 @ 后关键词筛选，生成菜单项（id 前缀 `ws:`）。
 * Git 变更文件略微提前排序。
 */
export function workspacePathsToMenuItems(
  paths: string[],
  query: string,
  gitChangedPaths: string[],
  limit = 60
): AtMenuItem[] {
  const normPath = (p: string) => p.replace(/\\/g, "/");
  const gitSet = new Set(gitChangedPaths.map(normPath));
  const q = query.trim().toLowerCase();

  type Scored = { path: string; score: number };
  const scored: Scored[] = [];

  if (q) {
    for (const p of paths) {
      const slash = normPath(p);
      const pl = slash.toLowerCase();
      const base = (slash.split("/").pop() || slash).toLowerCase();
      if (!pl.includes(q) && !base.includes(q)) {
        continue;
      }
      let score = 20;
      if (base === q) {
        score = 0;
      } else if (base.startsWith(q)) {
        score = 2;
      } else if (base.includes(q)) {
        score = 5;
      } else if (pl.includes(q)) {
        score = 10;
      }
      if (gitSet.has(slash)) {
        score -= 1;
      }
      scored.push({ path: slash, score });
    }
    scored.sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      const ab = (a.path.split("/").pop() || a.path).toLowerCase();
      const bb = (b.path.split("/").pop() || b.path).toLowerCase();
      const c = ab.localeCompare(bb);
      if (c !== 0) {
        return c;
      }
      return a.path.localeCompare(b.path);
    });
  } else {
    for (const p of paths) {
      const slash = normPath(p);
      scored.push({ path: slash, score: gitSet.has(slash) ? 0 : 2 });
    }
    scored.sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
    });
  }

  return scored.slice(0, limit).map(({ path: slash }) => {
    const base = slash.split("/").pop() || slash;
    return {
      icon: "file" as const,
      id: `ws:${slash}`,
      insertText: `@${slash}`,
      label: base,
      subtitle: slash,
    };
  });
}

/** 发送给模型的用户消息：文件引用行 + 正文（与 chip 组合一致，便于再编辑时解析） */
export function formatMessageWithWorkspaceFileRefs(
  relativePaths: string[],
  body: string
): string {
  const head = relativePaths.map((p) => `@${p}`).join(" ");
  const b = body.trim();
  if (!head) {
    return b;
  }
  if (!b) {
    return head;
  }
  return `${head}\n\n${b}`;
}

/** 与 composerSegments 内联 wire 格式一致：文件 token 与紧随正文之间的 ZWNJ（非空白，不能仅靠 \s+ 分词） */
const INLINE_FILE_REF_BOUNDARY = "\u200c";

/**
 * 从已发送消息还原「文件 chip + 正文」：首行为仅由空格分隔的 `@相对路径` token 时解析。
 */
export function parseLeadingWorkspaceRefs(text: string): {
  refs: string[];
  body: string;
} {
  const raw = text.replace(/^\uFEFF/, "");
  const lead = raw.match(/^\s*/)?.[0].length ?? 0;
  const trimmed = raw.slice(lead);
  if (!trimmed.startsWith("@")) {
    return { body: text, refs: [] };
  }
  const nl = trimmed.indexOf("\n");
  const firstLineFull = nl === -1 ? trimmed : trimmed.slice(0, nl);
  const restAfterFirstLine = nl === -1 ? "" : trimmed.slice(nl + 1);

  const z = firstLineFull.indexOf(INLINE_FILE_REF_BOUNDARY);
  let refLine: string;
  let afterBoundary: string;
  if (z >= 0) {
    refLine = firstLineFull.slice(0, z).trim();
    afterBoundary = firstLineFull.slice(z + INLINE_FILE_REF_BOUNDARY.length);
  } else {
    refLine = firstLineFull.trim();
    afterBoundary = "";
  }

  const tokens = refLine.split(/\s+/).filter(Boolean);
  if (
    !tokens.length ||
    !tokens.every((t) => t.startsWith("@") && t.length > 1)
  ) {
    return { body: text, refs: [] };
  }
  const refs = tokens.map((t) => t.slice(1));
  let body = afterBoundary.replace(/^\n+/, "");
  if (restAfterFirstLine) {
    const tail = restAfterFirstLine.replace(/^\n+/, "");
    body = body ? `${body}\n${tail}` : tail;
  }
  body = body.replace(/^\n+/, "");
  return { body, refs };
}
