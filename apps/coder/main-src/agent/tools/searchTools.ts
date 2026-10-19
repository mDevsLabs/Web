import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { minimatch } from "minimatch";
import {
  ensureSymbolIndexLoaded,
  formatSymbolSearchResults,
  searchWorkspaceSymbols,
} from "../../workspaceSymbolIndex.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  getExtraReadableRoots,
  makeReadablePath,
  normalizeToolPath,
  resolveReadablePath,
  type ResolvedReadablePath,
  throwIfToolAbortRequested,
  type ToolExecutionContext,
} from "./toolContext.js";

const execFileAsync = promisify(execFile);

const GLOB_MAX_RESULTS = 100;
const GLOB_IGNORE_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".hg",
  ".svn",
  ".jj",
]);
const MAX_SYMBOL_SEARCH_RESULTS = 80;
const DEFAULT_GREP_HEAD_LIMIT = 250;
const VCS_GREP_EXCLUDES = [
  ".git",
  ".svn",
  ".hg",
  ".bzr",
  ".jj",
  ".sl",
] as const;

function collectGlobFileDisplayPaths(
  scanRoot: string,
  matchRoot: string,
  displayRoot: string,
  isWorkspace: boolean,
  out: Array<{ matchPath: string; displayPath: string }>
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(scanRoot, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(scanRoot, e.name);
    if (e.isDirectory()) {
      if (GLOB_IGNORE_DIR_NAMES.has(e.name)) continue;
      collectGlobFileDisplayPaths(
        full,
        matchRoot,
        displayRoot,
        isWorkspace,
        out
      );
    } else {
      out.push({
        displayPath: isWorkspace
          ? path.relative(displayRoot, full).replace(/\\/g, "/")
          : normalizeToolPath(full),
        matchPath: path.relative(matchRoot, full).replace(/\\/g, "/"),
      });
    }
  }
}

function executeGlob(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const pattern = String(call.arguments.pattern ?? "").trim();
  if (!pattern) {
    return {
      content: "Error: pattern is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const sub = String(call.arguments.path ?? "").trim();
  let resolvedRoot: ResolvedReadablePath;
  try {
    if (sub) {
      resolvedRoot = resolveReadablePath(sub, execCtx, "directory");
    } else if (execCtx.workspaceRoot) {
      const root = path.resolve(execCtx.workspaceRoot);
      resolvedRoot = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      resolvedRoot = makeReadablePath(extraRoot, extraRoot, false);
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const scanRoot = resolvedRoot.full;
  if (!fs.existsSync(scanRoot) || !fs.statSync(scanRoot).isDirectory()) {
    return {
      content: `Not a directory: ${sub || "."}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const allFiles: Array<{ matchPath: string; displayPath: string }> = [];
  collectGlobFileDisplayPaths(
    scanRoot,
    resolvedRoot.isWorkspace ? resolvedRoot.root : scanRoot,
    resolvedRoot.isWorkspace ? resolvedRoot.root : scanRoot,
    resolvedRoot.isWorkspace,
    allFiles
  );
  const mmOpts = { dot: true, nocase: process.platform === "win32" } as const;
  const matched = allFiles
    .filter((item) => minimatch(item.matchPath, pattern, mmOpts))
    .map((item) => item.displayPath)
    .filter((displayPath, index, arr) => arr.indexOf(displayPath) === index)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const truncated = matched.length > GLOB_MAX_RESULTS;
  const shown = truncated ? matched.slice(0, GLOB_MAX_RESULTS) : matched;
  if (shown.length === 0) {
    return {
      content: "No files found",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const header = truncated
    ? `Found at least ${matched.length} files (showing first ${GLOB_MAX_RESULTS})\n`
    : `Found ${shown.length} file${shown.length === 1 ? "" : "s"}\n`;
  return {
    content: header + shown.join("\n"),
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function executeListDir(
  call: ToolCall,
  execCtx: ToolExecutionContext
): ToolResult {
  const relPath = String(call.arguments.path ?? "").trim();
  let resolved: ResolvedReadablePath;
  try {
    if (relPath) {
      resolved = resolveReadablePath(relPath, execCtx, "directory");
    } else if (execCtx.workspaceRoot) {
      const root = path.resolve(execCtx.workspaceRoot);
      resolved = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      resolved = makeReadablePath(extraRoot, extraRoot, false);
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const full = resolved.full;

  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) {
    return {
      content: `Not a directory: ${relPath || resolved.display}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const entries = fs.readdirSync(full, { withFileTypes: true });
  const sorted = entries
    .filter((e) => e.name !== "." && e.name !== "..")
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const lines = sorted.map((e) =>
    e.isDirectory() ? `[dir]  ${e.name}/` : `[file] ${e.name}`
  );
  return {
    content: lines.join("\n") || "(empty directory)",
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

function grepFormatLimitInfo(
  appliedLimit: number | undefined,
  appliedOffset: number | undefined
): string {
  const parts: string[] = [];
  if (appliedLimit !== undefined) parts.push(`limit: ${appliedLimit}`);
  if (appliedOffset) parts.push(`offset: ${appliedOffset}`);
  return parts.join(", ");
}

function applyGrepHeadLimit<T>(
  items: T[],
  headLimit: number | undefined,
  offset: number
): { items: T[]; appliedLimit?: number; appliedOffset?: number } {
  const off = Math.max(0, Math.floor(Number(offset) || 0));
  if (headLimit === 0) {
    return {
      appliedOffset: off > 0 ? off : undefined,
      items: items.slice(off),
    };
  }
  const effective = headLimit ?? DEFAULT_GREP_HEAD_LIMIT;
  const sliced = items.slice(off, off + effective);
  const truncated = items.length - off > effective;
  return {
    appliedLimit: truncated ? effective : undefined,
    appliedOffset: off > 0 ? off : undefined,
    items: sliced,
  };
}

function expandUserGlobPatterns(globField: string): string[] {
  const rawPatterns = globField.trim().split(/\s+/);
  const out: string[] = [];
  for (const raw of rawPatterns) {
    if (!raw) continue;
    if (raw.includes("{") && raw.includes("}")) {
      out.push(raw);
    } else {
      out.push(
        ...raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return out;
}

async function runRipgrep(
  rgArgs: string[],
  cwd: string,
  signal?: AbortSignal
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const r = await execFileAsync("rg", rgArgs, {
      cwd,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      signal,
      timeout: 30_000,
      windowsHide: true,
    });
    return {
      code: 0,
      stderr: (r.stderr as string) || "",
      stdout: (r.stdout as string) || "",
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    const err = e as { stdout?: string; stderr?: string; code?: number };
    const code = typeof err.code === "number" ? err.code : -1;
    return {
      code,
      stderr: err.stderr || "",
      stdout: err.stdout || "",
    };
  }
}

function sortGrepFilePathsByMtime(
  relPaths: string[],
  baseDir: string
): string[] {
  const withT = relPaths.map((f) => {
    const full = path.join(baseDir, f);
    try {
      const st = fs.statSync(full);
      return { f, t: st.mtimeMs };
    } catch {
      return { f, t: 0 };
    }
  });
  withT.sort(
    (a, b) =>
      b.t - a.t || a.f.localeCompare(b.f, undefined, { sensitivity: "base" })
  );
  return withT.map((x) => x.f);
}

function formatRipgrepPath(
  filePath: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (!useAbsolute) {
    return normalized;
  }
  const full = path.isAbsolute(filePath)
    ? filePath
    : path.join(searchDirAbs, filePath);
  return normalizeToolPath(full);
}

function formatRipgrepContentLine(
  line: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  if (!useAbsolute) {
    return line.replace(/\\/g, "/");
  }
  const i = line.indexOf(":");
  if (i <= 0) {
    return line;
  }
  return (
    formatRipgrepPath(line.slice(0, i), searchDirAbs, true) + line.slice(i)
  );
}

function formatRipgrepCountLine(
  line: string,
  searchDirAbs: string,
  useAbsolute: boolean
): string {
  const i = line.lastIndexOf(":");
  if (i <= 0) {
    return useAbsolute
      ? formatRipgrepPath(line, searchDirAbs, true)
      : line.replace(/\\/g, "/");
  }
  return (
    formatRipgrepPath(line.slice(0, i), searchDirAbs, useAbsolute) +
    line.slice(i)
  );
}

async function executeGrepTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "grep:start");
  const root = execCtx.workspaceRoot
    ? path.resolve(execCtx.workspaceRoot)
    : null;
  const pattern = String(call.arguments.pattern ?? "");
  if (!pattern)
    return {
      content: "Error: pattern is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };

  const symbolMode =
    call.arguments.symbol === true ||
    call.arguments.search_symbols === true ||
    call.arguments.mode === "symbol";
  if (symbolMode) {
    if (!root) {
      return {
        content: "Error: symbol search requires an open workspace.",
        isError: true,
        name: call.name,
        toolCallId: call.id,
      };
    }
    const rootNorm = path.resolve(root);
    await ensureSymbolIndexLoaded(rootNorm);
    const hits = searchWorkspaceSymbols(
      pattern,
      MAX_SYMBOL_SEARCH_RESULTS,
      rootNorm
    );
    return {
      content: formatSymbolSearchResults(hits),
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let searchDirAbs: string;
  let searchRoot: ResolvedReadablePath;
  try {
    const subPath = String(call.arguments.path ?? "").trim();
    if (subPath) {
      searchRoot = resolveReadablePath(subPath, execCtx, "directory");
    } else if (root) {
      searchRoot = makeReadablePath(root, root, true);
    } else {
      const extraRoot = getExtraReadableRoots(execCtx)[0];
      if (!extraRoot)
        throw new Error(
          "No workspace folder open and no skill/plugin readable roots registered."
        );
      searchRoot = makeReadablePath(extraRoot, extraRoot, false);
    }
    searchDirAbs = searchRoot.full;
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const outputModeRaw = call.arguments.output_mode;
  const output_mode =
    outputModeRaw === "content" ||
    outputModeRaw === "files_with_matches" ||
    outputModeRaw === "count"
      ? outputModeRaw
      : "files_with_matches";

  const multiline = call.arguments.multiline === true;
  const caseInsensitive = call.arguments["-i"] === true;
  const ctxNum = (k: string) => {
    const v = call.arguments[k];
    if (typeof v === "number" && Number.isFinite(v))
      return Math.max(0, Math.floor(v));
  };
  const contextBefore = ctxNum("-B");
  const contextAfter = ctxNum("-A");
  const contextC = ctxNum("-C");
  const contextUnified = ctxNum("context");
  const showLineNumbers = call.arguments["-n"] !== false;
  const typeFilter =
    typeof call.arguments.type === "string" && call.arguments.type.trim()
      ? call.arguments.type.trim()
      : "";
  const globField =
    typeof call.arguments.glob === "string" ? call.arguments.glob : "";
  const globPatterns = globField ? expandUserGlobPatterns(globField) : [];

  let headLimit: number | undefined;
  if (call.arguments.head_limit === 0) headLimit = 0;
  else if (
    typeof call.arguments.head_limit === "number" &&
    Number.isFinite(call.arguments.head_limit)
  ) {
    headLimit = Math.max(0, Math.floor(call.arguments.head_limit));
  } else headLimit = undefined;

  let offset = 0;
  if (
    typeof call.arguments.offset === "number" &&
    Number.isFinite(call.arguments.offset)
  ) {
    offset = Math.max(0, Math.floor(call.arguments.offset));
  }

  const rgArgs: string[] = ["--hidden"];
  for (const d of VCS_GREP_EXCLUDES) {
    rgArgs.push("--glob", `!${d}`);
  }
  rgArgs.push("--max-columns", "500", "--color=never");
  if (multiline) rgArgs.push("-U", "--multiline-dotall");
  if (caseInsensitive) rgArgs.push("-i");

  if (output_mode === "files_with_matches") rgArgs.push("-l");
  else if (output_mode === "count") rgArgs.push("-c");

  if (output_mode === "content") {
    if (showLineNumbers) rgArgs.push("-n");
    else rgArgs.push("--no-line-number");
    rgArgs.push("--no-heading");
    const ctxU = contextUnified;
    if (ctxU !== undefined) rgArgs.push("-C", String(ctxU));
    else if (contextC === undefined) {
      if (contextBefore !== undefined) rgArgs.push("-B", String(contextBefore));
      if (contextAfter !== undefined) rgArgs.push("-A", String(contextAfter));
    } else rgArgs.push("-C", String(contextC));
  }

  if (pattern.startsWith("-")) rgArgs.push("-e", pattern);
  else rgArgs.push(pattern);

  if (typeFilter) rgArgs.push("--type", typeFilter);
  for (const g of globPatterns) {
    rgArgs.push("--glob", g);
  }
  rgArgs.push(".");

  const { stdout, stderr, code } = await runRipgrep(
    rgArgs,
    searchDirAbs,
    execCtx.signal
  );
  if (code === 2 || (code !== 0 && code !== 1)) {
    return {
      content: `Search failed: ${stderr || `exit ${code}`}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const rawLines = stdout.split("\n").filter(Boolean);
  const useAbsolutePaths = !searchRoot.isWorkspace;

  if (output_mode === "count" && rawLines.length === 0) {
    return {
      content: "No matches found.",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  if (output_mode === "content") {
    const formattedLines = rawLines.map((line) =>
      formatRipgrepContentLine(line, searchDirAbs, useAbsolutePaths)
    );
    const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
      formattedLines,
      headLimit,
      offset
    );
    const body = items.join("\n") || "No matches found";
    const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
    const content = lim
      ? `${body}\n\n[Showing results with pagination = ${lim}]`
      : body;
    return { content, isError: false, name: call.name, toolCallId: call.id };
  }

  if (output_mode === "count") {
    const normalized = rawLines.map((line) =>
      formatRipgrepCountLine(line, searchDirAbs, useAbsolutePaths)
    );
    const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
      normalized,
      headLimit,
      offset
    );
    let totalMatches = 0;
    let fileCount = 0;
    for (const line of items) {
      const i = line.lastIndexOf(":");
      if (i <= 0) continue;
      const n = Number.parseInt(line.slice(i + 1), 10);
      if (!Number.isNaN(n)) {
        totalMatches += n;
        fileCount += 1;
      }
    }
    const rawContent = items.join("\n") || "No matches found";
    const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
    const occ = totalMatches === 1 ? "occurrence" : "occurrences";
    const fs_ = fileCount === 1 ? "file" : "files";
    const summary = `\n\nFound ${totalMatches} total ${occ} across ${fileCount} ${fs_}.${lim ? ` with pagination = ${lim}` : ""}`;
    return {
      content: rawContent + summary,
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }

  let files = rawLines.map((f) => f.replace(/\\/g, "/"));
  files = sortGrepFilePathsByMtime(files, searchDirAbs);
  files = files.map((f) =>
    formatRipgrepPath(f, searchDirAbs, useAbsolutePaths)
  );
  const { items, appliedLimit, appliedOffset } = applyGrepHeadLimit(
    files,
    headLimit,
    offset
  );
  const lim = grepFormatLimitInfo(appliedLimit, appliedOffset);
  if (items.length === 0) {
    return {
      content: "No files found",
      isError: false,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const fw = items.length === 1 ? "file" : "files";
  const prefix = `Found ${items.length} ${fw}${lim ? ` ${lim}` : ""}`;
  return {
    content: `${prefix}\n${items.join("\n")}`,
    isError: false,
    name: call.name,
    toolCallId: call.id,
  };
}

export { executeGlob, executeListDir, executeGrepTool };
