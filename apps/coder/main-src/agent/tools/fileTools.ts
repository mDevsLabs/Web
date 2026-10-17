import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { AnthropicToolResultContent } from "../../llm/anthropicBeta.js";
import {
  decodeTextBuffer,
  isProbablyTextBuffer,
  readTextFileBufferSync,
  readTextFileSyncWithMetadata,
  type TextEncoding,
  writeTextFileAtomicSync,
} from "../../textEncoding.js";
import { getThread } from "../../threadStore.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  readToolFileArg,
  resolveAgentFilePath,
  resolveReadablePath,
  type ResolvedReadablePath,
  type ToolExecutionContext,
  type ToolExecutionHooks,
} from "./toolContext.js";

export const MAX_READ_LINES_PER_CALL = 2000;
export const MAX_READ_FILE_BYTES = 2 * 1024 * 1024;
export const VIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const VIEW_IMAGE_MEDIA_TYPE_BY_EXT = new Map<
  string,
  "image/jpeg" | "image/png" | "image/gif" | "image/webp"
>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

export function resolveViewImageMediaType(
  filePath: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null {
  return (
    VIEW_IMAGE_MEDIA_TYPE_BY_EXT.get(path.extname(filePath).toLowerCase()) ??
    null
  );
}

export function executeViewImage(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = String(
    call.arguments.path ?? call.arguments.file_path ?? ""
  ).trim();
  if (!rawPath) {
    return {
      content: "Error: path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const detailRaw = call.arguments.detail;
  if (
    detailRaw != null &&
    String(detailRaw).trim() !== "" &&
    String(detailRaw).trim() !== "original"
  ) {
    return {
      content: `Error: view_image.detail only supports "original"; omit it for default behavior, got "${String(detailRaw)}"`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let resolved: ResolvedReadablePath;
  try {
    resolved = resolveReadablePath(rawPath, execCtx, "file");
  } catch (error) {
    return {
      content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(resolved.full) || !fs.statSync(resolved.full).isFile()) {
    return {
      content: `Error: image not found or not a regular file: ${resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const mediaType = resolveViewImageMediaType(resolved.full);
  if (!mediaType) {
    return {
      content:
        "Error: view_image only supports PNG, JPG, JPEG, GIF, and WEBP files.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const bytes = fs.readFileSync(resolved.full);
  if (bytes.length === 0) {
    return {
      content: `Error: image file is empty: ${resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (bytes.length > VIEW_IMAGE_MAX_BYTES) {
    return {
      content: `Error: image is too large for view_image (${bytes.length} bytes). Maximum supported size is ${VIEW_IMAGE_MAX_BYTES} bytes.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const diskSha = crypto.createHash("sha256").update(bytes).digest("hex");
  const threadId = execCtx.threadId ?? null;
  if (threadId) {
    const thread = getThread(threadId);
    const alreadyAttached = !!thread?.messages?.some(
      (m) =>
        m.role === "user" &&
        !!m.parts?.some(
          (p) =>
            p.kind === "image_ref" &&
            typeof p.sha256 === "string" &&
            p.sha256.length > 0 &&
            p.sha256 === diskSha
        )
    );
    if (alreadyAttached) {
      return {
        content: JSON.stringify(
          {
            deduped: true,
            mediaType,
            note: "Image already attached to this conversation by the user (sha256 match). Reference it directly by relPath instead of reloading.",
            path: resolved.full,
            relPath: resolved.display,
            sha256: diskSha,
            sizeBytes: bytes.length,
          },
          null,
          2
        ),
        isError: false,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }

  const structuredContent: AnthropicToolResultContent = [
    {
      text: `Loaded local image ${resolved.display}.`,
      type: "text",
    },
    {
      source: {
        data: bytes.toString("base64"),
        media_type: mediaType,
        type: "base64",
      },
      type: "image",
    },
  ];

  return {
    content: JSON.stringify(
      {
        detail: detailRaw === "original" ? "original" : null,
        mediaType,
        note: "Local image loaded for inspection. Prefer this tool over Browser for workspace image files.",
        path: resolved.full,
        relPath: resolved.display,
        sizeBytes: bytes.length,
      },
      null,
      2
    ),
    isError: false,
    name: call.name,
    structuredContent,
    toolCallId: call.id,
  };
}

export function executeReadFile(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  let display: string;
  let full: string;
  try {
    const resolved = resolveReadablePath(rawPath, execCtx, "file");
    ({ display, full } = resolved);
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (!fs.existsSync(full)) {
    return {
      content: `File not found: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!fs.statSync(full).isFile()) {
    return {
      content: `Not a file: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const st = fs.statSync(full);
  if (st.size > MAX_READ_FILE_BYTES) {
    return {
      content: `File too large (${st.size} bytes). Use Read with offset and limit to read a portion, or use Grep.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const buf = readTextFileBufferSync(full);
  if (!isProbablyTextBuffer(buf)) {
    return {
      content: `Skipped binary file: ${display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const text = decodeTextBuffer(buf).text.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let offset = Math.max(1, Number(call.arguments.offset) || 1);
  let limit: number | undefined;
  if (
    call.arguments.limit !== undefined &&
    call.arguments.limit !== null &&
    String(call.arguments.limit) !== ""
  ) {
    const l = Number(call.arguments.limit);
    if (Number.isFinite(l) && l > 0)
      limit = Math.min(Math.floor(l), MAX_READ_LINES_PER_CALL);
  }
  const sl = call.arguments.start_line;
  const el = call.arguments.end_line;
  if (
    (call.arguments.offset === undefined ||
      call.arguments.offset === null ||
      !Number.isFinite(Number(call.arguments.offset))) &&
    Number(sl) > 0
  ) {
    offset = Math.max(1, Math.floor(Number(sl)));
    if (Number(el) > 0) {
      const endL = Math.floor(Number(el));
      limit = Math.min(Math.max(1, endL - offset + 1), MAX_READ_LINES_PER_CALL);
    }
  }

  if (offset > lines.length) {
    return {
      content: `offset ${offset} is past end of file (${lines.length} lines).`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const effectiveLimit =
    limit ?? Math.min(MAX_READ_LINES_PER_CALL, lines.length - offset + 1);
  const slice = lines.slice(offset - 1, offset - 1 + effectiveLimit);
  const numbered = slice
    .map((l, i) => `${String(offset + i).padStart(6)}|${l}`)
    .join("\n");

  const totalLines = lines.length;
  const footer =
    offset + slice.length - 1 < totalLines
      ? `\n\n(${totalLines} lines total; use offset=${offset + slice.length} to read more.)`
      : "";
  const header =
    effectiveLimit >= MAX_READ_LINES_PER_CALL &&
    offset === 1 &&
    totalLines > MAX_READ_LINES_PER_CALL
      ? `(First ${MAX_READ_LINES_PER_CALL} of ${totalLines} lines; use offset and limit to paginate.)\n\n`
      : "";

  return {
    content: header + numbered + footer,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export function executeWriteToFile(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  const content = String(call.arguments.content ?? "");
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  let relPath: string;
  let full: string;
  try {
    ({ rel: relPath, full } = resolveAgentFilePath(rawPath, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const existed = fs.existsSync(full);
  if (existed && !fs.statSync(full).isFile()) {
    return {
      content: `Not a file: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  let previousContent: string | null = null;
  let encoding: TextEncoding = "utf8";
  if (existed) {
    try {
      const meta = readTextFileSyncWithMetadata(full);
      previousContent = meta.text;
      encoding = meta.encoding;
    } catch (e) {
      return {
        content: `Error: cannot safely overwrite ${relPath}: ${e instanceof Error ? e.message : String(e)}`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
  }
  void hooks.beforeWrite?.({ path: relPath, previousContent });
  writeTextFileAtomicSync(full, content, encoding);
  void hooks.afterWrite?.({
    nextContent: content,
    path: relPath,
    previousContent,
  });

  const lineCount = content.split("\n").length;
  return {
    content: `${existed ? "Updated" : "Created"} ${relPath} (${lineCount} lines)`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export function stripTrailingSpacesPerLine(s: string): string {
  return s.replace(/[ \t]+(\r?\n)/g, "$1").replace(/[ \t]+$/, "");
}

export function lfPosToOriginal(original: string, lfPos: number): number {
  let origIdx = 0;
  let lfIdx = 0;
  while (lfIdx < lfPos && origIdx < original.length) {
    if (original[origIdx] === "\r" && original[origIdx + 1] === "\n") {
      origIdx += 2;
    } else {
      origIdx += 1;
    }
    lfIdx += 1;
  }
  return origIdx;
}

export function executeStrReplace(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): ToolResult {
  const rawPath = readToolFileArg(call);
  const rawOldStr = String(
    call.arguments.old_string ?? call.arguments.old_str ?? ""
  );
  const rawNewStr = String(
    call.arguments.new_string ?? call.arguments.new_str ?? ""
  );
  const replaceAll =
    call.arguments.replace_all === true ||
    call.arguments.replace_all === "true" ||
    call.arguments.replace_all === 1;
  if (!rawPath)
    return {
      content: "Error: file_path is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  if (!rawOldStr) {
    return {
      content: "Error: old_string is required and must not be empty",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (rawOldStr === rawNewStr && !replaceAll) {
    return {
      content:
        "Error: old_string and new_string are identical; nothing to change.",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let relPath: string;
  let full: string;
  try {
    ({ rel: relPath, full } = resolveAgentFilePath(rawPath, execCtx));
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!fs.existsSync(full)) {
    return {
      content: `File not found: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let buffer: Buffer;
  try {
    buffer = readTextFileBufferSync(full);
  } catch (e) {
    return {
      content: `Error: cannot read ${relPath}: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  if (!isProbablyTextBuffer(buffer)) {
    return {
      content: `Skipped binary file: ${relPath}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const meta = decodeTextBuffer(buffer);
  const source = meta.text;
  const fileHasCRLF = source.includes("\r\n");

  const oldStr = fileHasCRLF
    ? rawOldStr.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
    : rawOldStr.replace(/\r\n/g, "\n");
  const newStr = fileHasCRLF
    ? rawNewStr.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
    : rawNewStr.replace(/\r\n/g, "\n");

  if (replaceAll) {
    let patchedAll = source;
    let pos = 0;
    let count = 0;
    let firstLineNo = 1;
    while (true) {
      const found = patchedAll.indexOf(oldStr, pos);
      if (found === -1) break;
      if (count === 0)
        firstLineNo = patchedAll.slice(0, found).split("\n").length;
      patchedAll =
        patchedAll.slice(0, found) +
        newStr +
        patchedAll.slice(found + oldStr.length);
      pos = found + newStr.length;
      count++;
    }
    if (count === 0) {
      const preview =
        rawOldStr.length > 200 ? rawOldStr.slice(0, 200) + "..." : rawOldStr;
      const hint = fileHasCRLF ? " (note: file uses CRLF line endings)" : "";
      return {
        content: `old_string not found in ${relPath}${hint}. Make sure the string matches exactly including whitespace and indentation.\nSearched for: ${preview}`,
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
    void hooks.beforeWrite?.({ path: relPath, previousContent: source });
    writeTextFileAtomicSync(full, patchedAll, meta.encoding);
    void hooks.afterWrite?.({
      nextContent: patchedAll,
      path: relPath,
      previousContent: source,
    });
    return {
      content: `Applied ${count} replacement(s) in ${relPath} (first at line ${firstLineNo})`,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let idx = source.indexOf(oldStr);
  let matchLen = oldStr.length;

  if (idx === -1) {
    const stripped = stripTrailingSpacesPerLine(oldStr);
    const sourceStripped = stripTrailingSpacesPerLine(source);
    const fallbackIdx = sourceStripped.indexOf(stripped);
    if (fallbackIdx !== -1) {
      const secondFb = sourceStripped.indexOf(stripped, fallbackIdx + 1);
      if (secondFb === -1) {
        const origSlice = source.slice(
          fallbackIdx,
          fallbackIdx + stripped.length
        );
        const charDelta = source.length - sourceStripped.length;
        const adjustedIdx =
          charDelta === 0 ? fallbackIdx : source.indexOf(origSlice);
        if (adjustedIdx !== -1) idx = adjustedIdx;
      }
    }
  }

  if (idx === -1) {
    const srcLF = source.replace(/\r\n/g, "\n");
    const oldLF = rawOldStr.replace(/\r\n/g, "\n");
    const lfIdx = srcLF.indexOf(oldLF);
    if (lfIdx !== -1 && srcLF.indexOf(oldLF, lfIdx + 1) === -1) {
      idx = lfPosToOriginal(source, lfIdx);
      matchLen = lfPosToOriginal(source, lfIdx + oldLF.length) - idx;
    }
  }

  if (idx === -1) {
    const preview =
      rawOldStr.length > 200 ? rawOldStr.slice(0, 200) + "..." : rawOldStr;
    const hint = fileHasCRLF ? " (note: file uses CRLF line endings)" : "";
    return {
      content: `old_string not found in ${relPath}${hint}. Make sure the string matches exactly including whitespace and indentation.\nSearched for: ${preview}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const verifySecond = source.indexOf(oldStr, idx + 1);
  if (verifySecond !== -1) {
    return {
      content: `old_string appears multiple times in ${relPath}. Set replace_all to true to replace every occurrence, or include more surrounding context to make a single match unique.`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const lineNumber = source.slice(0, idx).split("\n").length;
  const patched = source.slice(0, idx) + newStr + source.slice(idx + matchLen);
  void hooks.beforeWrite?.({ path: relPath, previousContent: source });
  writeTextFileAtomicSync(full, patched, meta.encoding);
  void hooks.afterWrite?.({
    nextContent: patched,
    path: relPath,
    previousContent: source,
  });

  return {
    content: `Applied edit to ${relPath} at line ${lineNumber}`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}
