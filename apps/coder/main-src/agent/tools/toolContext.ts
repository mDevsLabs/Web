import * as fs from "node:fs";
import * as path from "node:path";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type { ShellSettings } from "../../settingsStore.js";
import { isPathInsideRoot, resolveWorkspacePath } from "../../workspace.js";
import type { AgentLoopOptions } from "../agentLoop.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import type { ManagedAgentUiEvent } from "../managedSubagents.js";
import type { NestedAgentStreamEmit } from "../../ipc/nestedAgentStream.js";
import type { TeamPlanQuestionRoleScope } from "../planQuestionTool.js";

export type SubAgentBackgroundDonePayload = {
  parentToolCallId: string;
  agentId: string;
  result: string;
  success: boolean;
};

export type DelegateContext = {
  settings: ShellSettings;
  options: Omit<AgentLoopOptions, "signal">;
  parentSignal: AbortSignal;
  nestedEmit?: (evt: NestedAgentStreamEmit) => void;
  threadId: string | null;
  managedEmit?: (evt: ManagedAgentUiEvent) => void;
  onSubAgentBackgroundDone?: (payload: SubAgentBackgroundDonePayload) => void;
  parentMessages?: import("../../threadStore.js").ChatMessage[];
};

let _delegateContext: DelegateContext | null = null;

export function getDelegateContext(): DelegateContext | null {
  return _delegateContext;
}

export function setDelegateContext(
  settings: ShellSettings,
  options: Omit<AgentLoopOptions, "signal">,
  parentSignal: AbortSignal,
  nestedEmit?: (evt: NestedAgentStreamEmit) => void,
  threadId?: string | null,
  managedEmit?: (evt: ManagedAgentUiEvent) => void,
  onSubAgentBackgroundDone?: (payload: SubAgentBackgroundDonePayload) => void,
  parentMessages?: import("../../threadStore.js").ChatMessage[]
): void {
  _delegateContext = {
    managedEmit,
    nestedEmit,
    onSubAgentBackgroundDone,
    options,
    parentMessages,
    parentSignal,
    settings,
    threadId: threadId ?? null,
  };
}

export function clearDelegateContext(): void {
  _delegateContext = null;
}

export type ToolWriteSnapshot = {
  path: string;
  previousContent: string | null;
};

export type ToolAfterWriteSnapshot = {
  path: string;
  previousContent: string | null;
  nextContent: string;
};

export type ToolExecutionHooks = {
  beforeWrite?: (snapshot: ToolWriteSnapshot) => void | Promise<void>;
  afterWrite?: (snapshot: ToolAfterWriteSnapshot) => void | Promise<void>;
};

export type ToolExecutionContext = {
  delegateExecutionDepth?: number;
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  threadId?: string | null;
  hostWebContentsId?: number | null;
  signal?: AbortSignal;
  /** Team 子循环：随 ask_plan_question 一并下发，供聊天区挂到对应角色 */
  teamToolRoleScope?: TeamPlanQuestionRoleScope;
  customToolHandlers?: Record<
    string,
    (
      call: ToolCall,
      hooks: ToolExecutionHooks,
      execCtx: ToolExecutionContext
    ) => Promise<ToolResult> | ToolResult
  >;
};

export function throwIfToolAbortRequested(
  signal: AbortSignal | undefined,
  toolName: string,
  phase: string
): void {
  if (!signal?.aborted) {
    return;
  }
  throw new DOMException(
    `Tool ${toolName} aborted during ${phase}`,
    "AbortError"
  );
}

export function requireWorkspace(execCtx: ToolExecutionContext): string {
  const root = execCtx.workspaceRoot ?? null;
  if (!root) throw new Error("No workspace folder open.");
  return root;
}

export type ExpectedReadablePath = "any" | "file" | "directory";

export type ResolvedReadablePath = {
  full: string;
  display: string;
  root: string;
  isWorkspace: boolean;
};

export function pathKey(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function normalizeToolPath(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.replace(/\\/g, "/") : resolved;
}

export function getExtraReadableRoots(execCtx: ToolExecutionContext): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of execCtx.extraReadableRoots ?? []) {
    if (!raw?.trim()) {
      continue;
    }
    const resolved = path.resolve(raw);
    const key = pathKey(resolved);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(resolved);
  }
  return out;
}

export function pathMatchesExpected(
  full: string,
  expected: ExpectedReadablePath
): boolean {
  if (!fs.existsSync(full)) {
    return false;
  }
  const stat = fs.statSync(full);
  if (expected === "file") {
    return stat.isFile();
  }
  if (expected === "directory") {
    return stat.isDirectory();
  }
  return true;
}

export function makeReadablePath(
  full: string,
  root: string,
  isWorkspace: boolean
): ResolvedReadablePath {
  const normalizedFull = path.resolve(full);
  const normalizedRoot = path.resolve(root);
  const rel =
    path.relative(normalizedRoot, normalizedFull).replace(/\\/g, "/") || ".";
  return {
    display: isWorkspace ? rel : normalizeToolPath(normalizedFull),
    full: normalizedFull,
    isWorkspace,
    root: normalizedRoot,
  };
}

export function readableRootCandidates(
  execCtx: ToolExecutionContext
): Array<{ root: string; isWorkspace: boolean }> {
  const roots: Array<{ root: string; isWorkspace: boolean }> = [];
  const workspaceRoot = execCtx.workspaceRoot
    ? path.resolve(execCtx.workspaceRoot)
    : "";
  if (workspaceRoot) {
    roots.push({ isWorkspace: true, root: workspaceRoot });
  }
  for (const root of getExtraReadableRoots(execCtx)) {
    if (workspaceRoot && pathKey(root) === pathKey(workspaceRoot)) {
      continue;
    }
    roots.push({ isWorkspace: false, root });
  }
  return roots;
}

export function resolveReadablePath(
  raw: string,
  execCtx: ToolExecutionContext,
  expected: ExpectedReadablePath = "any"
): ResolvedReadablePath {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("file_path is required");
  const roots = readableRootCandidates(execCtx);
  if (roots.length === 0) {
    throw new Error(
      "No workspace folder open and no skill/plugin readable roots registered."
    );
  }

  const candidates: ResolvedReadablePath[] = [];
  const addRelativeCandidates = (rel: string): void => {
    const cleaned = rel.replace(/^[/\\]+/, "");
    for (const rootInfo of roots) {
      const full = path.resolve(rootInfo.root, cleaned);
      if (!isPathInsideRoot(full, rootInfo.root)) {
        continue;
      }
      candidates.push(
        makeReadablePath(full, rootInfo.root, rootInfo.isWorkspace)
      );
    }
  };

  if (path.isAbsolute(trimmed)) {
    const full = path.resolve(trimmed);
    const allowedRoot = roots.find((rootInfo) =>
      isPathInsideRoot(full, rootInfo.root)
    );
    if (allowedRoot) {
      return makeReadablePath(full, allowedRoot.root, allowedRoot.isWorkspace);
    }
    if (/^[/\\]+(?![/\\])/.test(trimmed)) {
      addRelativeCandidates(trimmed);
    }
  } else {
    addRelativeCandidates(trimmed);
  }

  const existing = candidates.find((candidate) =>
    pathMatchesExpected(candidate.full, expected)
  );
  if (existing) {
    return existing;
  }
  const anyExisting = candidates.find((candidate) =>
    fs.existsSync(candidate.full)
  );
  if (anyExisting) {
    return anyExisting;
  }
  if (candidates.length > 0) {
    return candidates[0]!;
  }
  throw new Error("Path escapes workspace and registered skill/plugin roots.");
}

export function resolveAgentFilePath(
  raw: string,
  execCtx: ToolExecutionContext
): { rel: string; full: string } {
  const rawRoot = requireWorkspace(execCtx);
  let root: string;
  try {
    root = fs.realpathSync(rawRoot);
  } catch {
    root = path.resolve(rawRoot);
  }
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("file_path is required");
  let full: string;
  try {
    full = path.isAbsolute(trimmed)
      ? resolveWorkspacePath(trimmed, root)
      : resolveWorkspacePath(trimmed.replace(/^[/\\]+/, ""), root);
  } catch {
    throw new Error("Path escapes workspace boundary.");
  }
  if (!isPathInsideRoot(full, root))
    throw new Error("Path escapes workspace boundary.");
  const rel = path.relative(root, full).replace(/\\/g, "/") || ".";
  return { full, rel };
}

export function readToolFileArg(call: ToolCall): string {
  return String(call.arguments.file_path ?? call.arguments.path ?? "").trim();
}
