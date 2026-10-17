import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import {
  MEMORY_FRONTMATTER_EXAMPLE,
  TYPES_SECTION_INDIVIDUAL,
  WHAT_NOT_TO_SAVE_SECTION,
  WHEN_TO_ACCESS_SECTION,
} from "./memoryTypes.js";
import {
  ENTRYPOINT_NAME,
  getAutoMemEntrypoint,
  getAutoMemPath,
} from "./paths.js";

export const MAX_ENTRYPOINT_LINES = 200;
export const MAX_ENTRYPOINT_BYTES = 25_000;

export type EntrypointTruncation = {
  content: string;
  lineCount: number;
  byteCount: number;
  wasLineTruncated: boolean;
  wasByteTruncated: boolean;
};

export async function ensureMemoryDirExists(
  workspaceRoot?: string | null
): Promise<string | null> {
  const dir = getAutoMemPath(workspaceRoot);
  if (!dir) {
    return null;
  }
  await fsp.mkdir(dir, { recursive: true });
  const entrypoint = getAutoMemEntrypoint(workspaceRoot);
  if (entrypoint) {
    try {
      await fsp.access(entrypoint);
    } catch {
      await fsp.writeFile(entrypoint, "", "utf8");
    }
  }
  return dir;
}

export function truncateEntrypointContent(raw: string): EntrypointTruncation {
  const trimmed = raw.trim();
  const contentLines = trimmed.split("\n");
  const lineCount = contentLines.length;
  const byteCount = Buffer.byteLength(trimmed, "utf8");
  const wasLineTruncated = lineCount > MAX_ENTRYPOINT_LINES;
  const wasByteTruncated = byteCount > MAX_ENTRYPOINT_BYTES;

  if (!wasLineTruncated && !wasByteTruncated) {
    return {
      byteCount,
      content: trimmed,
      lineCount,
      wasByteTruncated,
      wasLineTruncated,
    };
  }

  let truncated = wasLineTruncated
    ? contentLines.slice(0, MAX_ENTRYPOINT_LINES).join("\n")
    : trimmed;
  if (Buffer.byteLength(truncated, "utf8") > MAX_ENTRYPOINT_BYTES) {
    let cut = truncated.length;
    while (
      cut > 0 &&
      Buffer.byteLength(truncated.slice(0, cut), "utf8") > MAX_ENTRYPOINT_BYTES
    ) {
      cut--;
    }
    const nl = truncated.lastIndexOf("\n", cut);
    truncated = truncated.slice(0, nl > 0 ? nl : cut);
  }

  const reason =
    wasByteTruncated && !wasLineTruncated
      ? `${byteCount} bytes (limit: ${MAX_ENTRYPOINT_BYTES})`
      : wasLineTruncated && !wasByteTruncated
        ? `${lineCount} lines (limit: ${MAX_ENTRYPOINT_LINES})`
        : `${lineCount} lines and ${byteCount} bytes`;

  return {
    byteCount,
    content:
      truncated +
      `\n\n> WARNING: ${ENTRYPOINT_NAME} is ${reason}. Only part of it was loaded. Keep index entries short and move details into topic files.`,
    lineCount,
    wasByteTruncated,
    wasLineTruncated,
  };
}

export function buildMemoryLines(memoryDir: string): string[] {
  return [
    "# Persistent project memory",
    "",
    `You have a persistent, file-based memory system at \`${memoryDir.replace(/\\/g, "/")}\`.`,
    "",
    "Use it to accumulate project knowledge, user preferences, recurring feedback, and reusable reference notes across conversations.",
    "",
    ...TYPES_SECTION_INDIVIDUAL,
    "",
    ...WHAT_NOT_TO_SAVE_SECTION,
    "",
    "## How to save memories",
    "",
    "Saving a memory is a two-step process:",
    "",
    "**Step 1** — write the memory to its own `.md` file using this frontmatter format:",
    "",
    ...MEMORY_FRONTMATTER_EXAMPLE,
    "",
    `**Step 2** — add a pointer to that file in \`${ENTRYPOINT_NAME}\`. \`${ENTRYPOINT_NAME}\` is an index, not a memory. Keep each entry to one short line, for example: \`- [Title](file.md) — one-line hook\`.`,
    "",
    `- \`${ENTRYPOINT_NAME}\` is loaded into conversation context automatically; lines after ${MAX_ENTRYPOINT_LINES} may be truncated.`,
    "- Update existing memories when they drift out of date.",
    "- Prefer one topic per file instead of chronological dumping.",
    "",
    ...WHEN_TO_ACCESS_SECTION,
  ];
}

export function buildMemoryPrompt(
  workspaceRoot?: string | null
): string | null {
  const memoryDir = getAutoMemPath(workspaceRoot);
  const entrypoint = getAutoMemEntrypoint(workspaceRoot);
  if (!memoryDir || !entrypoint) {
    return null;
  }

  let entrypointContent = "";
  try {
    entrypointContent = fs.readFileSync(entrypoint, "utf8");
  } catch {
    entrypointContent = "";
  }

  const lines = buildMemoryLines(memoryDir);
  if (entrypointContent.trim()) {
    const t = truncateEntrypointContent(entrypointContent);
    lines.push("", `## ${ENTRYPOINT_NAME}`, "", t.content);
  } else {
    lines.push(
      "",
      `## ${ENTRYPOINT_NAME}`,
      "",
      `Your ${ENTRYPOINT_NAME} is currently empty.`
    );
  }
  return lines.join("\n");
}

export async function loadMemoryPrompt(
  workspaceRoot?: string | null
): Promise<string | null> {
  await ensureMemoryDirExists(workspaceRoot);
  return buildMemoryPrompt(workspaceRoot);
}
