import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import * as gitService from "../../gitService.js";
import { executeShellCommand } from "../../shell/commandExecutor.js";
import { readTextFileIfExistsSync } from "../../textEncoding.js";
import { isPathInsideRoot, resolveWorkspacePath } from "../../workspace.js";
import type { ToolCall, ToolResult } from "../agentTools.js";
import {
  requireWorkspace,
  throwIfToolAbortRequested,
  type ToolExecutionContext,
  type ToolExecutionHooks,
} from "./toolContext.js";

const execFileAsync = promisify(execFile);

type BashGitDirtyState = {
  topLevel: string;
  orderedEntries: Array<{ repoRel: string; wsRel: string }>;
  dirtyContentByWsPath: Map<string, string | null>;
};

function decodeGitPorcelainPath(raw: string): string {
  let value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return value.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function parseGitPorcelainEntriesForWorkspace(
  raw: string,
  workspaceRoot: string,
  gitTopLevel: string
): Array<{ repoRel: string; wsRel: string }> {
  const line = raw.trimEnd();
  if (line.length < 4 || line[2] !== " ") {
    return [];
  }
  const rest = line.slice(3).trimEnd();
  const repoPaths = rest.includes(" -> ")
    ? (() => {
        const idx = rest.lastIndexOf(" -> ");
        return [
          decodeGitPorcelainPath(rest.slice(0, idx)),
          decodeGitPorcelainPath(rest.slice(idx + 4)),
        ];
      })()
    : [decodeGitPorcelainPath(rest)];
  const out: Array<{ repoRel: string; wsRel: string }> = [];
  for (const repoRel of repoPaths) {
    if (!repoRel) {
      continue;
    }
    const wsRel = gitService.workspaceRelativeFromRepoRelative(
      repoRel,
      workspaceRoot,
      gitTopLevel
    );
    if (wsRel) {
      out.push({ repoRel, wsRel });
    }
  }
  return out;
}

function readUtf8TextFileIfExists(fullPath: string): string | null {
  return readTextFileIfExistsSync(fullPath);
}

async function captureBashGitDirtyState(
  workspaceRoot: string
): Promise<BashGitDirtyState | null> {
  try {
    const { stdout: gitRootStdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "rev-parse", "--show-toplevel"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      }
    );
    const topLevel = path.resolve(String(gitRootStdout ?? "").trim());
    if (!topLevel) {
      return null;
    }
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "status", "--porcelain=v1"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      }
    );
    const orderedEntries: Array<{ repoRel: string; wsRel: string }> = [];
    const seen = new Set<string>();
    for (const line of String(stdout ?? "").split(/\r?\n/)) {
      for (const entry of parseGitPorcelainEntriesForWorkspace(
        line,
        workspaceRoot,
        topLevel
      )) {
        if (seen.has(entry.wsRel)) {
          continue;
        }
        seen.add(entry.wsRel);
        orderedEntries.push(entry);
      }
    }
    const dirtyContentByWsPath = new Map<string, string | null>();
    for (const entry of orderedEntries) {
      const fullPath = resolveWorkspacePath(entry.wsRel, workspaceRoot);
      dirtyContentByWsPath.set(entry.wsRel, readUtf8TextFileIfExists(fullPath));
    }
    return { dirtyContentByWsPath, orderedEntries, topLevel };
  } catch {
    return null;
  }
}

async function readGitHeadTextOrNull(
  gitTopLevel: string,
  repoRel: string
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-c", "core.quotepath=false", "show", `HEAD:${repoRel}`],
      {
        cwd: gitTopLevel,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      }
    );
    const content = String(stdout ?? "");
    return content.includes("\u0000") ? null : content;
  } catch {
    return null;
  }
}

async function recordBashWorkspaceSnapshots(
  workspaceRoot: string,
  hooks: ToolExecutionHooks,
  beforeState: BashGitDirtyState | null
): Promise<void> {
  if (!hooks.beforeWrite && !hooks.afterWrite) {
    return;
  }
  const afterState = await captureBashGitDirtyState(workspaceRoot);
  const gitTopLevel = afterState?.topLevel ?? beforeState?.topLevel;
  if (!gitTopLevel) {
    return;
  }
  const orderedEntries: Array<{ repoRel: string; wsRel: string }> = [];
  const seen = new Set<string>();
  const pushUnique = (entry: { repoRel: string; wsRel: string }) => {
    if (seen.has(entry.wsRel)) {
      return;
    }
    seen.add(entry.wsRel);
    orderedEntries.push(entry);
  };
  for (const entry of afterState?.orderedEntries ?? []) {
    pushUnique(entry);
  }
  for (const entry of beforeState?.orderedEntries ?? []) {
    pushUnique(entry);
  }
  for (const entry of orderedEntries) {
    const previousContent = beforeState?.dirtyContentByWsPath.has(entry.wsRel)
      ? (beforeState.dirtyContentByWsPath.get(entry.wsRel) ?? null)
      : await readGitHeadTextOrNull(gitTopLevel, entry.repoRel);
    const fullPath = resolveWorkspacePath(entry.wsRel, workspaceRoot);
    const nextContent = readUtf8TextFileIfExists(fullPath);
    if ((previousContent ?? null) === (nextContent ?? null)) {
      continue;
    }
    await hooks.beforeWrite?.({ path: entry.wsRel, previousContent });
    if (nextContent !== null) {
      await hooks.afterWrite?.({
        nextContent,
        path: entry.wsRel,
        previousContent,
      });
    } else if (previousContent !== null) {
      await hooks.afterWrite?.({
        nextContent: "",
        path: entry.wsRel,
        previousContent,
      });
    }
  }
}

function maskShellQuotedText(command: string): string {
  let out = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (const ch of command) {
    if (escaped) {
      out += " ";
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += quote ? " " : ch;
      escaped = quote !== "'";
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
        out += ch;
      } else {
        out += " ";
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    out += ch;
  }
  return out;
}

function validateBashCommandDoesNotDirectlyWriteFiles(
  command: string
): string | null {
  const inspected = maskShellQuotedText(command);
  const allowedRedirectTarget = String.raw`(?:&?\d\b|/dev/null\b|/dev/fd/\d+\b|nul\b)`;
  const fileRedirect = new RegExp(
    String.raw`(?:^|[^&])(?:\d*>>?|\d*>\||&>)\s*(?!${allowedRedirectTarget})`,
    "i"
  );
  if (fileRedirect.test(inspected)) {
    return "Bash is not allowed to write files with shell redirection. Use Write/Edit for source files, or let the command output be captured by the tool.";
  }
  if (
    /(?:^|[;&|()]\s*)tee(?:\s+-[a-zA-Z]+)*\s+(?!\/dev\/null\b|nul\b|-($|\s))/i.test(
      inspected
    )
  ) {
    return "Bash is not allowed to write files with tee. Use Write/Edit for source files.";
  }
  if (/(?:^|[;&|()]\s*)sed\b[^;&|]*\s-i(?:\s|$)/i.test(inspected)) {
    return "Bash is not allowed to edit files with sed -i. Use Edit instead.";
  }
  if (/(?:^|[;&|()]\s*)perl\b[^;&|]*\s-pi(?:\s|$)/i.test(inspected)) {
    return "Bash is not allowed to edit files with perl -pi. Use Edit instead.";
  }
  if (/\b(?:Set-Content|Add-Content|Out-File|Export-Csv)\b/i.test(inspected)) {
    return "Bash is not allowed to call PowerShell file-writing cmdlets. Use Write/Edit so the app controls encoding.";
  }
  if (/(?:^|[;&|()]\s*)(?:rm|rmdir|mv|cp|touch|mkdir)\b/i.test(inspected)) {
    return "Bash is not allowed to directly create, remove, copy, or move files. Use workspace tools for file changes.";
  }
  return null;
}

async function executeCommand(
  call: ToolCall,
  hooks: ToolExecutionHooks,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "command:start");
  const root = requireWorkspace(execCtx);
  const command = String(call.arguments.command ?? "").trim();
  if (!command)
    return {
      content: "Error: command is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  const blockedReason = validateBashCommandDoesNotDirectlyWriteFiles(command);
  if (blockedReason) {
    return {
      content: `Blocked unsafe Bash command: ${blockedReason}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }

  const timeoutMsRaw = Number(call.arguments.timeout_ms);
  const timeoutMs =
    Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0
      ? Math.max(1000, Math.min(Math.floor(timeoutMsRaw), 600_000))
      : 120_000;
  const beforeGitState = await captureBashGitDirtyState(root);

  try {
    const res = await executeShellCommand(command, {
      cwd: root,
      signal: execCtx.signal,
      timeoutMs,
    });
    await recordBashWorkspaceSnapshots(root, hooks, beforeGitState);
    let output = res.output;
    if (!output.trim()) output = "(command completed with no output)";
    const header = res.truncated ? "[output truncated]\n" : "";
    return {
      content: header + output,
      isError: res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
      name: call.name,
      toolCallId: call.id,
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw e;
    }
    await recordBashWorkspaceSnapshots(root, hooks, beforeGitState);
    const output = e instanceof Error ? e.message : String(e);
    return {
      content: output,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}

function parseTerminalRunInBackground(args: Record<string, unknown>): boolean {
  return args.run_in_background === true || args.run_in_background === "true";
}

function parseTerminalTimeoutMs(
  args: Record<string, unknown>
): number | undefined {
  const raw = Number(args.timeout_ms);
  if (!Number.isFinite(raw) || raw <= 0) {
    return;
  }
  return Math.max(500, Math.min(Math.floor(raw), 600_000));
}

function formatBackgroundTerminalSessionResult(opts: {
  sessionId: string;
  command: string;
  profileName?: string;
}): string {
  const lines = [
    `session_id=${opts.sessionId} background=true`,
    "---",
    opts.profileName
      ? `Started background terminal command via profile "${opts.profileName}".`
      : "Started background terminal command.",
    `Command: ${opts.command}`,
    "Use Terminal read with this session_id to inspect output, and close when finished.",
  ];
  return lines.join("\n");
}

function resolveTerminalCwd(
  raw: unknown,
  execCtx: ToolExecutionContext
): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return execCtx.workspaceRoot ?? undefined;
  }
  const trimmed = raw.trim();
  if (path.isAbsolute(trimmed)) {
    if (
      execCtx.workspaceRoot &&
      !isPathInsideRoot(trimmed, execCtx.workspaceRoot)
    ) {
      throw new Error("cwd escapes workspace boundary.");
    }
    if (!fs.existsSync(trimmed)) {
      throw new Error(`cwd does not exist: ${trimmed}`);
    }
    return trimmed;
  }
  if (!execCtx.workspaceRoot) {
    throw new Error("cwd is relative but no workspace is open.");
  }
  const full = resolveWorkspacePath(trimmed, execCtx.workspaceRoot);
  if (!isPathInsideRoot(full, execCtx.workspaceRoot)) {
    throw new Error("cwd escapes workspace boundary.");
  }
  if (!fs.existsSync(full)) {
    throw new Error(`cwd does not exist: ${full}`);
  }
  return full;
}

async function executeTerminalTool(
  call: ToolCall,
  execCtx: ToolExecutionContext
): Promise<ToolResult> {
  throwIfToolAbortRequested(execCtx.signal, call.name, "terminal:start");
  const args = call.arguments;
  const action = String(args.action ?? "").trim();
  if (!action) {
    return {
      content: "Error: action is required",
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
  const svc = await import("../../terminalSessionService.js");
  const runInBackground = parseTerminalRunInBackground(args);
  const timeoutMs = parseTerminalTimeoutMs(args);
  try {
    switch (action) {
      case "list_profiles": {
        const profileStore = await import("../../terminalProfileStore.js");
        const profiles = profileStore.listTerminalToolProfiles();
        return {
          content: JSON.stringify(profiles, null, 2),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "open": {
        const profileNeedle =
          typeof args.profile_id === "string" ? args.profile_id.trim() : "";
        let createOpts: Parameters<typeof svc.createTerminalSession>[0];
        let profileMeta: unknown = null;
        if (profileNeedle) {
          const profileStore = await import("../../terminalProfileStore.js");
          const resolved =
            profileStore.resolveTerminalToolCreateOpts(profileNeedle);
          if (!resolved) {
            return {
              content: `Error: terminal profile not found: ${profileNeedle}`,
              isError: true,
              name: call.name,
              toolCallId: call.id,
            };
          }
          createOpts = {
            ...resolved.createOpts,
            cols:
              typeof args.cols === "number"
                ? args.cols
                : resolved.createOpts.cols,
            cwd: resolved.createOpts.cwd
              ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
              : resolved.createOpts.cwd,
            rows:
              typeof args.rows === "number"
                ? args.rows
                : resolved.createOpts.rows,
            title:
              typeof args.title === "string" && args.title.trim()
                ? args.title
                : resolved.createOpts.title,
          };
          profileMeta = resolved.profile;
        } else {
          createOpts = {
            cols: typeof args.cols === "number" ? args.cols : undefined,
            cwd: resolveTerminalCwd(args.cwd, execCtx),
            rows: typeof args.rows === "number" ? args.rows : undefined,
            shell:
              typeof args.shell === "string" && args.shell.trim()
                ? args.shell.trim()
                : undefined,
            title: typeof args.title === "string" ? args.title : undefined,
          };
        }
        const info = svc.createTerminalSession(createOpts);
        return {
          content: JSON.stringify(
            profileMeta ? { profile: profileMeta, session: info } : info,
            null,
            2
          ),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "write": {
        const id = String(args.session_id ?? "").trim();
        const data = typeof args.data === "string" ? args.data : "";
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (!data) {
          return {
            content: "Error: data is required (include \\r or \\n to submit)",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.writeTerminalSession(id, data);
        return {
          content: ok ? "ok" : "write failed (session missing or exited)",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "read": {
        const id = String(args.session_id ?? "").trim();
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const maxBytes =
          typeof args.max_bytes === "number" ? args.max_bytes : undefined;
        const slice = svc.getTerminalBuffer(id, maxBytes);
        if (!slice) {
          return {
            content: "Error: session not found",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const header = `# session ${slice.id}\nalive=${slice.alive} exit_code=${
          slice.exitCode ?? "null"
        } buffer_bytes=${slice.bufferBytes} seq=${slice.seq}\n---\n`;
        return {
          content: header + slice.content,
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "list": {
        const list = svc.listTerminalSessions();
        return {
          content: JSON.stringify(list, null, 2),
          isError: false,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "resize": {
        const id = String(args.session_id ?? "").trim();
        const cols = typeof args.cols === "number" ? args.cols : 0;
        const rows = typeof args.rows === "number" ? args.rows : 0;
        if (!id || !cols || !rows) {
          return {
            content: "Error: session_id, cols, rows are required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.resizeTerminalSession(id, cols, rows);
        return {
          content: ok ? "ok" : "resize failed",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "close": {
        const id = String(args.session_id ?? "").trim();
        if (!id) {
          return {
            content: "Error: session_id is required",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const ok = svc.killTerminalSession(id);
        return {
          content: ok ? "ok" : "close failed",
          isError: !ok,
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "run": {
        if (typeof args.profile_id === "string" && args.profile_id.trim()) {
          return {
            content:
              "Error: run does not support profile_id. Use exec for one-shot SSH profile commands, or use list_profiles + open + write/read for a persistent interactive session.",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const command = String(args.command ?? "").trim();
        if (!command) {
          return {
            content: "Error: command is required for run",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (runInBackground) {
          const info = svc.startOneShotCommandSession({
            cols: typeof args.cols === "number" ? args.cols : undefined,
            command,
            cwd: resolveTerminalCwd(args.cwd, execCtx),
            rows: typeof args.rows === "number" ? args.rows : undefined,
            shell:
              typeof args.shell === "string" && args.shell.trim()
                ? args.shell.trim()
                : undefined,
          });
          return {
            content: formatBackgroundTerminalSessionResult({
              command,
              sessionId: info.id,
            }),
            isError: false,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const res = await executeShellCommand(command, {
          cwd: resolveTerminalCwd(args.cwd, execCtx),
          shell:
            typeof args.shell === "string" && args.shell.trim()
              ? args.shell.trim()
              : undefined,
          signal: execCtx.signal,
          timeoutMs,
        });
        const header = `exit_code=${res.exitCode ?? "null"} timed_out=${res.timedOut}\n---\n`;
        return {
          content:
            header + (res.truncated ? "[output truncated]\n" : "") + res.output,
          isError:
            res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
          name: call.name,
          toolCallId: call.id,
        };
      }
      case "exec": {
        const profileNeedle =
          typeof args.profile_id === "string" ? args.profile_id.trim() : "";
        if (!profileNeedle) {
          return {
            content: "Error: profile_id is required for exec",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const command = String(args.command ?? "").trim();
        if (!command) {
          return {
            content: "Error: command is required for exec",
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const profileStore = await import("../../terminalProfileStore.js");
        const resolved = profileStore.resolveTerminalToolExecCreateOpts(
          profileNeedle,
          command
        );
        if (!resolved) {
          return {
            content: `Error: terminal profile not found: ${profileNeedle}`,
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if ("error" in resolved) {
          return {
            content: `Error: ${resolved.error}`,
            isError: true,
            name: call.name,
            toolCallId: call.id,
          };
        }
        if (runInBackground) {
          const info = svc.createTerminalSession({
            ...resolved.createOpts,
            cols:
              typeof args.cols === "number"
                ? args.cols
                : resolved.createOpts.cols,
            cwd: resolved.createOpts.cwd
              ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
              : resolved.createOpts.cwd,
            rows:
              typeof args.rows === "number"
                ? args.rows
                : resolved.createOpts.rows,
            title:
              typeof args.title === "string" && args.title.trim()
                ? args.title
                : resolved.createOpts.title,
          });
          return {
            content: formatBackgroundTerminalSessionResult({
              command,
              profileName: resolved.profile.name,
              sessionId: info.id,
            }),
            isError: false,
            name: call.name,
            toolCallId: call.id,
          };
        }
        const res = await executeShellCommand(command, {
          args: resolved.createOpts.args,
          cwd: resolved.createOpts.cwd
            ? resolveTerminalCwd(resolved.createOpts.cwd, execCtx)
            : resolved.createOpts.cwd,
          env: resolved.createOpts.env,
          shell: resolved.createOpts.shell,
          signal: execCtx.signal,
          timeoutMs,
        });
        const header = `profile=${resolved.profile.name} exit_code=${res.exitCode ?? "null"} timed_out=${res.timedOut}\n---\n`;
        return {
          content:
            header + (res.truncated ? "[output truncated]\n" : "") + res.output,
          isError:
            res.timedOut || (res.exitCode !== 0 && res.exitCode !== null),
          name: call.name,
          toolCallId: call.id,
        };
      }
      default:
        return {
          content: `Error: unknown action "${action}"`,
          isError: true,
          name: call.name,
          toolCallId: call.id,
        };
    }
  } catch (e) {
    return {
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
      isError: true,
      name: call.name,
      toolCallId: call.id,
    };
  }
}


export { executeCommand, executeTerminalTool };
