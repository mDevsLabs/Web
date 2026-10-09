import {
  type AgentCommand,
  isPluginImportedCommand,
} from "./agentSettingsTypes";
import type { SlashCommandToken } from "./composerSegments";
import type { TFunction } from "./i18n";

export type BuiltinSlashCommand = {
  id: string;
  /** 不含前导 /，如 create-skill */
  name: string;
  descriptionKey: string;
  /** 选中后插入方式 */
  insert:
    | { type: "chip"; chip: SlashCommandToken }
    | { type: "text"; text: string };
};

/** 合并后菜单项（内置 + 用户设置） */
export type SlashMenuEntry = {
  id: string;
  /** 小写，用于过滤匹配 */
  name: string;
  descriptionKey?: string;
  descriptionLiteral?: string;
  insert: BuiltinSlashCommand["insert"];
  source: "builtin" | "user" | "plugin";
};

/** 菜单行（已解析 description） */
export type SlashMenuRowItem = SlashMenuEntry & {
  label: string;
  description: string;
};

/** 内置斜杠命令 */
export const BUILTIN_SLASH_COMMANDS: BuiltinSlashCommand[] = [
  {
    descriptionKey: "slashCmd.createSkillDesc",
    id: "create-skill",
    insert: { chip: "create-skill", type: "chip" },
    name: "create-skill",
  },
  {
    descriptionKey: "slashCmd.createRuleDesc",
    id: "create-rule",
    insert: { chip: "create-rule", type: "chip" },
    name: "create-rule",
  },
  {
    descriptionKey: "slashCmd.createSubagentDesc",
    id: "create-subagent",
    insert: { chip: "create-subagent", type: "chip" },
    name: "create-subagent",
  },
];

/** 内置 name（小写）集合；同名时内置优先 */
const builtinNameKeys = () =>
  new Set(BUILTIN_SLASH_COMMANDS.map((b) => b.name.toLowerCase()));

/** 将设置中的 Commands 转为菜单项（排除与内置同名的 slash） */
export function agentCommandsToSlashMenuEntries(
  commands: AgentCommand[] | undefined
): SlashMenuEntry[] {
  if (!commands?.length) {
    return [];
  }
  const taken = builtinNameKeys();
  const out: SlashMenuEntry[] = [];
  for (const c of commands) {
    const raw = c.slash.trim().replace(/^\//, "");
    if (!raw) {
      continue;
    }
    const key = raw.toLowerCase();
    if (taken.has(key)) {
      continue;
    }
    taken.add(key);
    const desc = (c.description ?? "").trim();
    const lit = desc || (c.name ?? "").trim() || undefined;
    out.push({
      descriptionLiteral: lit,
      id: `user-${c.id}`,
      insert: { chip: raw, type: "chip" },
      name: key,
      source: isPluginImportedCommand(c) ? "plugin" : "user",
    });
  }
  return out;
}

export function mergeSlashMenuEntries(
  userCommands: AgentCommand[] | undefined
): SlashMenuEntry[] {
  const builtins: SlashMenuEntry[] = BUILTIN_SLASH_COMMANDS.map((b) => ({
    descriptionKey: b.descriptionKey,
    id: b.id,
    insert: b.insert,
    name: b.name.toLowerCase(),
    source: "builtin" as const,
  }));
  return [...builtins, ...agentCommandsToSlashMenuEntries(userCommands)];
}

export function filterSlashMenuEntries(
  entries: SlashMenuEntry[],
  query: string
): SlashMenuEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...entries];
  }
  return entries.filter((c) => {
    const n = c.name;
    const desc = (c.descriptionLiteral ?? "").toLowerCase();
    const hay = `${n} ${c.id} ${desc}`;
    return n.startsWith(q) || hay.includes(q);
  });
}

/** 解析 label（展示用） */
export function slashMenuEntryLabel(entry: SlashMenuEntry): string {
  if (entry.insert.type === "text") {
    return entry.insert.text.replace(/\s+$/u, "");
  }
  return `/${entry.name}`;
}

export function resolveSlashMenuRow(
  entry: SlashMenuEntry,
  t: TFunction
): SlashMenuRowItem {
  return {
    ...entry,
    description: entry.descriptionKey
      ? t(entry.descriptionKey)
      : (entry.descriptionLiteral ?? ""),
    label: slashMenuEntryLabel(entry),
  };
}

/**
 * 首段为 `/...` 且光标仍在「命令名」内（未到空格后的参数区）时返回查询词（不含 /）。
 * plainPrefix：caret 前由 DOM 采样的纯文本前缀，须与首段文本对齐。
 */
export function getLeadingSlashCommandQuery(
  firstSegmentText: string,
  plainPrefix: string
): string | null {
  if (
    !firstSegmentText.startsWith("/") ||
    plainPrefix.length === 0 ||
    !firstSegmentText.startsWith(plainPrefix)
  ) {
    return null;
  }
  const cmdToken = firstSegmentText.match(/^\/(\S*)/);
  if (!cmdToken) {
    return null;
  }
  const cmdEnd = cmdToken[0]!.length;
  if (plainPrefix.length > cmdEnd) {
    return null;
  }
  const afterSlash = plainPrefix.slice(1);
  if (/\s/u.test(afterSlash)) {
    return null;
  }
  return afterSlash;
}

/** @deprecated 使用 mergeSlashMenuEntries + filterSlashMenuEntries */
export function filterSlashCommands(
  commands: BuiltinSlashCommand[],
  query: string
): BuiltinSlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...commands];
  }
  return commands.filter((c) => {
    const n = c.name.toLowerCase();
    const hay = `${n} ${c.id}`.toLowerCase();
    return n.startsWith(q) || hay.includes(q);
  });
}

/** 用于在纯文本里标出 /command 范围（高亮校验） */
export function findSlashCommandTokenRanges(
  text: string
): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  const re = /(^|[\s\n])(\/[a-zA-Z][a-zA-Z0-9:._-]*)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const pre = m[1] ?? "";
    const tok = m[2] ?? "";
    const start = m.index + pre.length;
    out.push({ end: start + tok.length, start });
  }
  return out;
}

export function isKnownBuiltinSlashToken(token: string): boolean {
  const name = token.startsWith("/") ? token.slice(1) : token;
  return BUILTIN_SLASH_COMMANDS.some((c) => c.name === name);
}

/** 供设置页「可用斜杠命令」只读列表 */
export type SlashCommandListRow = {
  label: string;
  description: string;
  source: "builtin" | "user" | "plugin";
};

export function buildSlashCommandListRows(
  userCommands: AgentCommand[] | undefined,
  t: TFunction
): SlashCommandListRow[] {
  return mergeSlashMenuEntries(userCommands).map((e) => {
    const row = resolveSlashMenuRow(e, t);
    return { description: row.description, label: row.label, source: e.source };
  });
}
