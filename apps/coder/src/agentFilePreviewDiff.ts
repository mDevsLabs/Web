/** `diff` 按需动态加载，避免进入主 bundle / 首屏解析。 */
type DiffLib = typeof import("diff");

export type AgentFilePreviewToken = {
  text: string;
  kind: "same" | "add" | "del";
};

export type AgentFilePreviewRow = {
  kind: "context" | "add" | "del";
  text: string;
  oldLineNo: number | null;
  newLineNo: number | null;
  anchorLine: number | null;
  tokens: AgentFilePreviewToken[];
  hunkId: string | null;
  isHunkStart: boolean;
};

export type AgentFilePreviewHunk = {
  id: string;
  patch: string;
  oldStart: number;
  oldEnd: number;
  newStart: number;
  newEnd: number;
  anchorLine: number | null;
};

type ChangeLine = {
  text: string;
  lineNo: number | null;
};

/** 与 Shiki 批量按行高亮共用同一套拆行规则 */
export function splitPreviewLines(content: string): string[] {
  const normalized = content.replace(/\r\n?/g, "\n");
  if (normalized === "") {
    return [""];
  }
  const parts = normalized.split("\n");
  if (parts.length > 1 && parts[parts.length - 1] === "") {
    parts.pop();
  }
  return parts;
}

function buildSingleKindTokens(
  text: string,
  kind: "same" | "add" | "del"
): AgentFilePreviewToken[] {
  return [{ kind, text }];
}

function buildPairedTokens(
  d: DiffLib,
  deletedText: string,
  addedText: string
): { deleted: AgentFilePreviewToken[]; added: AgentFilePreviewToken[] } {
  const parts = d.diffWordsWithSpace(deletedText, addedText);
  const deleted: AgentFilePreviewToken[] = [];
  const added: AgentFilePreviewToken[] = [];
  for (const part of parts) {
    if (!part.added) {
      deleted.push({ kind: part.removed ? "del" : "same", text: part.value });
    }
    if (!part.removed) {
      added.push({ kind: part.added ? "add" : "same", text: part.value });
    }
  }
  return { added, deleted };
}

function plainRowsFromContent(content: string): AgentFilePreviewRow[] {
  const lines = splitPreviewLines(content);
  return lines.map((text, index) => {
    const lineNo = index + 1;
    return {
      anchorLine: lineNo,
      hunkId: null,
      isHunkStart: false,
      kind: "context" as const,
      newLineNo: lineNo,
      oldLineNo: lineNo,
      text,
      tokens: buildSingleKindTokens(text, "same"),
    };
  });
}

/** 无 diff 时的行列表（不加载 `diff` 包）。 */
export function buildPlainAgentFilePreviewRows(
  content: string
): AgentFilePreviewRow[] {
  return plainRowsFromContent(content);
}

function pushChangeGroup(
  d: DiffLib,
  rows: AgentFilePreviewRow[],
  deleted: ChangeLine[],
  added: ChangeLine[]
) {
  const pairCount = Math.max(deleted.length, added.length);
  const deletedRows: AgentFilePreviewRow[] = [];
  const addedRows: AgentFilePreviewRow[] = [];
  for (let i = 0; i < pairCount; i += 1) {
    const deletedLine = deleted[i] ?? null;
    const addedLine = added[i] ?? null;
    if (deletedLine && addedLine) {
      const tokens = buildPairedTokens(d, deletedLine.text, addedLine.text);
      deletedRows.push({
        anchorLine: deletedLine.lineNo,
        hunkId: null,
        isHunkStart: false,
        kind: "del",
        newLineNo: null,
        oldLineNo: deletedLine.lineNo,
        text: deletedLine.text,
        tokens: tokens.deleted,
      });
      addedRows.push({
        anchorLine: addedLine.lineNo,
        hunkId: null,
        isHunkStart: false,
        kind: "add",
        newLineNo: addedLine.lineNo,
        oldLineNo: null,
        text: addedLine.text,
        tokens: tokens.added,
      });
      continue;
    }
    if (deletedLine) {
      deletedRows.push({
        anchorLine: deletedLine.lineNo,
        hunkId: null,
        isHunkStart: false,
        kind: "del",
        newLineNo: null,
        oldLineNo: deletedLine.lineNo,
        text: deletedLine.text,
        tokens: buildSingleKindTokens(deletedLine.text, "del"),
      });
    }
    if (addedLine) {
      addedRows.push({
        anchorLine: addedLine.lineNo,
        hunkId: null,
        isHunkStart: false,
        kind: "add",
        newLineNo: addedLine.lineNo,
        oldLineNo: null,
        text: addedLine.text,
        tokens: buildSingleKindTokens(addedLine.text, "add"),
      });
    }
  }
  rows.push(...deletedRows, ...addedRows);
}

function parsePreviewPatch(d: DiffLib, diff: string | null | undefined) {
  const rawDiff = String(diff ?? "").trim();
  if (!rawDiff) {
    return null;
  }
  try {
    const patches = d.parsePatch(rawDiff);
    return patches.find((item) => item.hunks.length > 0) ?? null;
  } catch {
    return null;
  }
}

function buildAgentFilePreviewHunksWithDiff(
  d: DiffLib,
  diff: string | null | undefined
): AgentFilePreviewHunk[] {
  const patch = parsePreviewPatch(d, diff);
  if (!patch) {
    return [];
  }
  return patch.hunks.map((hunk, index) => ({
    anchorLine:
      hunk.newStart > 0
        ? hunk.newStart
        : hunk.oldStart > 0
          ? hunk.oldStart
          : null,
    id: `hunk-${index}`,
    newEnd: Math.max(
      hunk.newStart,
      hunk.newStart + Math.max(hunk.newLines, 1) - 1
    ),
    newStart: hunk.newStart,
    oldEnd: Math.max(
      hunk.oldStart,
      hunk.oldStart + Math.max(hunk.oldLines, 1) - 1
    ),
    oldStart: hunk.oldStart,
    patch: d
      .formatPatch({
        hunks: [hunk],
        newFileName: patch.newFileName,
        newHeader: patch.newHeader,
        oldFileName: patch.oldFileName,
        oldHeader: patch.oldHeader,
      })
      .trim(),
  }));
}

function buildAgentFilePreviewRowsWithDiff(
  d: DiffLib,
  content: string,
  diff: string | null | undefined
): AgentFilePreviewRow[] {
  const patch = parsePreviewPatch(d, diff);
  if (!patch) {
    return plainRowsFromContent(content);
  }

  const lines = splitPreviewLines(content);
  const rows: AgentFilePreviewRow[] = [];
  let currentNewLine = 1;

  for (let hunkIndex = 0; hunkIndex < patch.hunks.length; hunkIndex += 1) {
    const hunk = patch.hunks[hunkIndex]!;
    const unchangedEnd = Math.max(0, hunk.newStart - 1);
    while (currentNewLine <= unchangedEnd && currentNewLine <= lines.length) {
      const text = lines[currentNewLine - 1] ?? "";
      rows.push({
        anchorLine: currentNewLine,
        hunkId: null,
        isHunkStart: false,
        kind: "context",
        newLineNo: currentNewLine,
        oldLineNo: currentNewLine,
        text,
        tokens: buildSingleKindTokens(text, "same"),
      });
      currentNewLine += 1;
    }

    const hunkId = `hunk-${hunkIndex}`;
    const hunkStartIndex = rows.length;
    let oldLineNo = hunk.oldStart;
    let newLineNo = hunk.newStart;
    let deleted: ChangeLine[] = [];
    let added: ChangeLine[] = [];

    const flushChangeGroup = () => {
      if (deleted.length === 0 && added.length === 0) {
        return;
      }
      pushChangeGroup(d, rows, deleted, added);
      deleted = [];
      added = [];
    };

    for (const rawLine of hunk.lines) {
      if (rawLine.startsWith("\\")) {
        continue;
      }
      const prefix = rawLine[0];
      const text = rawLine.slice(1);

      if (prefix === " ") {
        flushChangeGroup();
        const stableText =
          newLineNo > 0 ? (lines[newLineNo - 1] ?? text) : text;
        rows.push({
          anchorLine:
            newLineNo > 0 ? newLineNo : oldLineNo > 0 ? oldLineNo : null,
          hunkId: null,
          isHunkStart: false,
          kind: "context",
          newLineNo: newLineNo > 0 ? newLineNo : null,
          oldLineNo: oldLineNo > 0 ? oldLineNo : null,
          text: stableText,
          tokens: buildSingleKindTokens(stableText, "same"),
        });
        if (oldLineNo > 0) {
          oldLineNo += 1;
        }
        if (newLineNo > 0) {
          newLineNo += 1;
          currentNewLine = Math.max(currentNewLine, newLineNo);
        }
        continue;
      }

      if (prefix === "-") {
        deleted.push({
          lineNo: oldLineNo > 0 ? oldLineNo : null,
          text,
        });
        if (oldLineNo > 0) {
          oldLineNo += 1;
        }
        continue;
      }

      if (prefix === "+") {
        added.push({
          lineNo: newLineNo > 0 ? newLineNo : null,
          text,
        });
        if (newLineNo > 0) {
          newLineNo += 1;
          currentNewLine = Math.max(currentNewLine, newLineNo);
        }
      }
    }

    flushChangeGroup();
    for (let i = hunkStartIndex; i < rows.length; i += 1) {
      rows[i]!.hunkId = hunkId;
    }
    if (hunkStartIndex < rows.length) {
      rows[hunkStartIndex]!.isHunkStart = true;
    }
  }

  while (currentNewLine <= lines.length) {
    const text = lines[currentNewLine - 1] ?? "";
    rows.push({
      anchorLine: currentNewLine,
      hunkId: null,
      isHunkStart: false,
      kind: "context",
      newLineNo: currentNewLine,
      oldLineNo: currentNewLine,
      text,
      tokens: buildSingleKindTokens(text, "same"),
    });
    currentNewLine += 1;
  }

  return rows.length > 0 ? rows : plainRowsFromContent(content);
}

export async function buildAgentFilePreviewHunks(
  diff: string | null | undefined
): Promise<AgentFilePreviewHunk[]> {
  const raw = String(diff ?? "").trim();
  if (!raw) {
    return [];
  }
  const d = await import("diff");
  return buildAgentFilePreviewHunksWithDiff(d, diff);
}

export async function buildAgentFilePreviewRows(
  content: string,
  diff: string | null | undefined
): Promise<AgentFilePreviewRow[]> {
  const raw = String(diff ?? "").trim();
  if (!raw) {
    return plainRowsFromContent(content);
  }
  const d = await import("diff");
  return buildAgentFilePreviewRowsWithDiff(d, content, diff);
}
