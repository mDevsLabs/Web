/**
 * 全能终端：跨窗口共享的 pty 会话池。
 *
 * 与 `terminalPty.ts` 的区别：
 * - 会话不绑定创建者 sender；任何窗口 / agent tool 都可读写/订阅
 * - 维护每会话的环形输出缓冲（供窗口晚开、agent `read` 使用）
 * - 广播 `term:data` / `term:exit` / `term:listChanged` 到所有已订阅的 webContents
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { BrowserWindow, type WebContents } from "electron";
import * as pty from "node-pty";
import { isWindows } from "./platform.js";
import {
  appendTerminalAuthPromptTail,
  detectTerminalAuthPrompt,
  type TerminalSessionAuthPromptKind,
} from "./terminalAuthPrompt.js";

const MAX_BUFFER_BYTES = 256 * 1024;
const MAX_PASSWORD_AUTOFILL_ATTEMPTS = 1;
const MAX_BROADCAST_CHUNK_CHARS = 64 * 1024;

export type TerminalSessionCreateOpts = {
  cwd?: string;
  shell?: string;
  args?: string[];
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  title?: string;
  passwordAutofill?: string;
};

export type TerminalSessionInfo = {
  id: string;
  title: string;
  cwd: string;
  shell: string;
  cols: number;
  rows: number;
  alive: boolean;
  bufferBytes: number;
  createdAt: number;
};

export type TerminalSessionAuthPrompt = {
  prompt: string;
  kind: TerminalSessionAuthPromptKind;
  seq: number;
};

type Session = {
  id: string;
  pty: pty.IPty;
  title: string;
  cwd: string;
  shell: string;
  cols: number;
  rows: number;
  alive: boolean;
  createdAt: number;
  buffer: string;
  seq: number;
  subscribers: Set<WebContents>;
  exitCode: number | null;
  passwordAutofill: string | null;
  passwordAutofillCount: number;
  recentOutputTail: string;
  pendingAuthPrompt: TerminalSessionAuthPrompt | null;
  pendingBroadcastChunks: string[];
  pendingBroadcastChars: number;
  broadcastScheduled: boolean;
};

const sessions = new Map<string, Session>();

function safeSend(
  contents: WebContents,
  channel: string,
  ...args: unknown[]
): void {
  if (!contents.isDestroyed()) {
    try {
      contents.send(channel, ...args);
    } catch {
      /* ignore */
    }
  }
}

function broadcastToSubscribers(
  s: Session,
  channel: string,
  ...args: unknown[]
): void {
  for (const c of [...s.subscribers]) {
    if (c.isDestroyed()) {
      s.subscribers.delete(c);
      continue;
    }
    safeSend(c, channel, ...args);
  }
}

function broadcastListChanged(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      safeSend(win.webContents, "term:listChanged");
    }
  }
}

function appendBuffer(s: Session, chunk: string): void {
  const merged = s.buffer + chunk;
  if (merged.length <= MAX_BUFFER_BYTES) {
    s.buffer = merged;
  } else {
    s.buffer = merged.slice(merged.length - MAX_BUFFER_BYTES);
  }
}

function flushPendingBroadcast(s: Session): void {
  s.broadcastScheduled = false;
  if (s.pendingBroadcastChars === 0) {
    return;
  }
  const data = s.pendingBroadcastChunks.join("");
  s.pendingBroadcastChunks = [];
  s.pendingBroadcastChars = 0;
  broadcastToSubscribers(s, "term:data", s.id, data, s.seq);
}

function queueDataBroadcast(s: Session, chunk: string): void {
  s.pendingBroadcastChunks.push(chunk);
  s.pendingBroadcastChars += chunk.length;
  if (s.pendingBroadcastChars >= MAX_BROADCAST_CHUNK_CHARS) {
    flushPendingBroadcast(s);
    return;
  }
  if (s.broadcastScheduled) {
    return;
  }
  s.broadcastScheduled = true;
  setImmediate(() => flushPendingBroadcast(s));
}

function powerShellInteractiveArgs(): string[] {
  return [
    "-NoLogo",
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false); $OutputEncoding = [System.Text.UTF8Encoding]::new($false)",
  ];
}

function isPowerShellShell(shell: string): boolean {
  return (
    /(?:^|[\\/])(pwsh|powershell)(?:\.exe)?$/i.test(shell) ||
    /^(pwsh|powershell)(?:\.exe)?$/i.test(shell)
  );
}

// Allowlist for renderer-requested shells: bare names or absolute paths inside
// well-known system dirs. Anything else falls back to the default shell.
const ALLOWED_SHELL_NAMES = new Set([
  "pwsh.exe",
  "pwsh",
  "powershell.exe",
  "powershell",
  "cmd.exe",
  "cmd",
  "bash",
  "sh",
  "zsh",
  "fish",
  "/bin/bash",
  "/bin/sh",
  "/bin/zsh",
  "/usr/bin/bash",
  "/usr/bin/zsh",
  "/usr/bin/fish",
  "C:\\Windows\\System32\\cmd.exe",
  "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
]);
function sanitizeShell(requested?: string): string | undefined {
  if (!requested || !requested.trim()) return;
  const trimmed = requested.trim();
  if (trimmed.includes("\0") || trimmed.length > 512) return;
  if (
    ALLOWED_SHELL_NAMES.has(trimmed) ||
    ALLOWED_SHELL_NAMES.has(trimmed.toLowerCase())
  )
    return trimmed;
  // Allow absolute paths only if basename is allowlisted.
  const base =
    trimmed.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? "";
  if (
    [
      "pwsh.exe",
      "pwsh",
      "powershell.exe",
      "powershell",
      "cmd.exe",
      "cmd",
      "bash",
      "sh",
      "zsh",
      "fish",
    ].includes(base) &&
    pathIsAbsoluteSafe(trimmed)
  ) {
    return trimmed;
  }
}
function pathIsAbsoluteSafe(p: string): boolean {
  return p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
}

// env keys that must never be inherited/overridden from the renderer.
const BLOCKED_ENV_KEYS = new Set([
  "LD_PRELOAD",
  "LD_LIBRARY_PATH",
  "DYLD_INSERT_LIBRARIES",
  "DYLD_LIBRARY_PATH",
  "NODE_OPTIONS",
  "NODE_PRELOAD",
  "ELECTRON_RUN_AS_NODE",
  "PATH",
]);
function sanitizeEnv(
  input?: Record<string, string>
): Record<string, string> | undefined {
  if (!input) return;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    const key = k.trim();
    if (!key || key.includes("\0") || key.includes("=") || key.length > 256)
      continue;
    if (BLOCKED_ENV_KEYS.has(key.toUpperCase())) continue;
    if (v.includes("\0") || v.length > 8192) continue;
    out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function resolveShell(requested?: string): { shell: string; args: string[] } {
  const win = isWindows();
  if (requested && requested.trim()) {
    const trimmed = requested.trim();
    return {
      args: win
        ? isPowerShellShell(trimmed)
          ? powerShellInteractiveArgs()
          : ["/k", "chcp 65001>nul"]
        : ["-i"],
      shell: trimmed,
    };
  }
  const shell = win
    ? findPowerShellSync() || process.env.ComSpec || "cmd.exe"
    : process.env.SHELL || "/bin/bash";
  const args = win
    ? isPowerShellShell(shell)
      ? powerShellInteractiveArgs()
      : ["/k", "chcp 65001>nul"]
    : ["-i"];
  return { args, shell };
}

function findPowerShellSync(): string | null {
  try {
    return execFileSyncPowerShellProbe("pwsh.exe")
      ? "pwsh.exe"
      : execFileSyncPowerShellProbe("powershell.exe")
        ? "powershell.exe"
        : null;
  } catch {
    return null;
  }
}

function execFileSyncPowerShellProbe(command: string): boolean {
  try {
    execFileSync(command, ["-Version"], {
      stdio: "ignore",
      timeout: 1000,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function createTerminalSession(
  opts: TerminalSessionCreateOpts = {}
): TerminalSessionInfo {
  const cwd = opts.cwd && existsSync(opts.cwd) ? opts.cwd : process.cwd();
  const safeShell = sanitizeShell(opts.shell);
  const { shell, args } = resolveShell(safeShell);
  const cols = Math.max(2, Math.min(Math.floor(opts.cols ?? 120), 1000));
  const rows = Math.max(1, Math.min(Math.floor(opts.rows ?? 30), 1000));
  const id = randomUUID();
  const safeEnv = sanitizeEnv(opts.env);
  const mergedEnv = safeEnv
    ? ({ ...(process.env as Record<string, string>), ...safeEnv } as {
        [key: string]: string;
      })
    : (process.env as { [key: string]: string });
  const proc = pty.spawn(shell, opts.args ?? args, {
    cols,
    cwd,
    env: mergedEnv,
    name: "xterm-256color",
    rows,
  });
  const session: Session = {
    alive: true,
    broadcastScheduled: false,
    buffer: "",
    cols,
    createdAt: Date.now(),
    cwd,
    exitCode: null,
    id,
    passwordAutofill: opts.passwordAutofill || null,
    passwordAutofillCount: 0,
    pendingAuthPrompt: null,
    pendingBroadcastChars: 0,
    pendingBroadcastChunks: [],
    pty: proc,
    recentOutputTail: "",
    rows,
    seq: 0,
    shell,
    subscribers: new Set(),
    title: opts.title?.trim() || defaultTitleForShell(shell),
  };
  sessions.set(id, session);
  proc.onData((data) => {
    session.seq += 1;
    appendBuffer(session, data);
    const authPrompt = maybeHandleAuthPrompt(session, data);
    queueDataBroadcast(session, data);
    if (authPrompt) {
      broadcastToSubscribers(session, "term:authPrompt", id, authPrompt);
    }
  });
  proc.onExit(({ exitCode }) => {
    session.alive = false;
    session.exitCode = typeof exitCode === "number" ? exitCode : null;
    session.pendingAuthPrompt = null;
    flushPendingBroadcast(session);
    broadcastToSubscribers(session, "term:exit", id, session.exitCode);
    broadcastListChanged();
  });
  broadcastListChanged();
  return toInfo(session);
}

export function writeTerminalSession(id: string, data: string): boolean {
  const s = sessions.get(id);
  if (!s || !s.alive) {
    return false;
  }
  try {
    resetSessionAuthPromptState(s);
    s.pty.write(data);
    return true;
  } catch {
    return false;
  }
}

export function respondToTerminalSessionAuthPrompt(
  id: string,
  data: string
): boolean {
  const s = sessions.get(id);
  if (!s || !s.alive || !s.pendingAuthPrompt) {
    return false;
  }
  try {
    resetSessionAuthPromptState(s);
    s.pty.write(data);
    return true;
  } catch {
    return false;
  }
}

export function clearTerminalSessionAuthPrompt(id: string): boolean {
  const s = sessions.get(id);
  if (!s) {
    return false;
  }
  resetSessionAuthPromptState(s);
  return true;
}

export function resizeTerminalSession(
  id: string,
  cols: number,
  rows: number
): boolean {
  const s = sessions.get(id);
  if (!s || !s.alive) {
    return false;
  }
  const c = Math.max(2, Math.floor(cols));
  const r = Math.max(1, Math.floor(rows));
  try {
    s.pty.resize(c, r);
    s.cols = c;
    s.rows = r;
    return true;
  } catch {
    return false;
  }
}

export function killTerminalSession(id: string): boolean {
  const s = sessions.get(id);
  if (!s) {
    return false;
  }
  try {
    s.pty.kill();
  } catch {
    /* ignore */
  }
  sessions.delete(id);
  broadcastListChanged();
  return true;
}

export function listTerminalSessions(): TerminalSessionInfo[] {
  return [...sessions.values()].map(toInfo);
}

export function getTerminalSession(id: string): TerminalSessionInfo | null {
  const s = sessions.get(id);
  return s ? toInfo(s) : null;
}

export type TerminalBufferSlice = {
  id: string;
  content: string;
  seq: number;
  alive: boolean;
  exitCode: number | null;
  bufferBytes: number;
  authPrompt: TerminalSessionAuthPrompt | null;
};

export type TerminalOneShotCommandResult = {
  id: string;
  exitCode: number | null;
  output: string;
  timedOut: boolean;
  sessionKept: boolean;
  alive: boolean;
};

export type TerminalWaitForExitResult = {
  id: string;
  exitCode: number | null;
  output: string;
  timedOut: boolean;
  authPrompt: TerminalSessionAuthPrompt | null;
  sessionKept: boolean;
  alive: boolean;
};

export function getTerminalBuffer(
  id: string,
  maxBytes?: number
): TerminalBufferSlice | null {
  const s = sessions.get(id);
  if (!s) {
    return null;
  }
  const cap = Math.max(
    256,
    Math.min(Math.floor(maxBytes ?? 16_384), MAX_BUFFER_BYTES)
  );
  const content =
    s.buffer.length <= cap ? s.buffer : s.buffer.slice(s.buffer.length - cap);
  return {
    alive: s.alive,
    authPrompt: s.pendingAuthPrompt,
    bufferBytes: Buffer.byteLength(s.buffer, "utf8"),
    content,
    exitCode: s.exitCode,
    id: s.id,
    seq: s.seq,
  };
}

const destroyedHandlersByContents = new WeakMap<WebContents, () => void>();

export function subscribeToSession(
  id: string,
  contents: WebContents
): TerminalBufferSlice | null {
  const s = sessions.get(id);
  if (!s) {
    return null;
  }
  s.subscribers.add(contents);
  if (!destroyedHandlersByContents.has(contents)) {
    const cleanup = () => {
      for (const session of sessions.values()) {
        session.subscribers.delete(contents);
      }
      destroyedHandlersByContents.delete(contents);
    };
    destroyedHandlersByContents.set(contents, cleanup);
    contents.once("destroyed", cleanup);
  }
  return {
    alive: s.alive,
    authPrompt: s.pendingAuthPrompt,
    bufferBytes: Buffer.byteLength(s.buffer, "utf8"),
    content: s.buffer,
    exitCode: s.exitCode,
    id: s.id,
    seq: s.seq,
  };
}

export function unsubscribeFromSession(
  id: string,
  contents: WebContents
): void {
  const s = sessions.get(id);
  if (!s) {
    return;
  }
  s.subscribers.delete(contents);
}

export function renameTerminalSession(id: string, title: string): boolean {
  const s = sessions.get(id);
  if (!s) {
    return false;
  }
  const next = title.trim();
  if (!next) {
    return false;
  }
  s.title = next;
  broadcastListChanged();
  return true;
}

/**
 * 启动一个短命会话、等待其退出（或超时后强杀），返回完整输出。
 * 适合 agent `Terminal run` 动作：不需要持续交互时无副作用地执行命令。
 */
export function startOneShotCommandSession(opts: {
  command: string;
  cwd?: string;
  shell?: string;
  cols?: number;
  rows?: number;
}): TerminalSessionInfo {
  const info = createTerminalSession({
    cols: opts.cols,
    cwd: opts.cwd,
    rows: opts.rows,
    shell: opts.shell,
    title: "(one-shot) " + opts.command.slice(0, 40),
  });
  const cr = isWindows() ? "\r\n" : "\n";
  const submitted = writeTerminalSession(
    info.id,
    opts.command + cr + (isWindows() ? "exit\r\n" : "exit\n")
  );
  if (!submitted) {
    killTerminalSession(info.id);
    throw new Error("Failed to submit one-shot command to terminal session.");
  }
  return info;
}

export async function runOneShotCommand(opts: {
  command: string;
  cwd?: string;
  shell?: string;
  timeoutMs?: number;
  cols?: number;
  rows?: number;
  preserveOnTimeout?: boolean;
}): Promise<TerminalOneShotCommandResult> {
  const info = startOneShotCommandSession(opts);
  const session = sessions.get(info.id)!;
  const timeoutMs = Math.max(500, Math.min(opts.timeoutMs ?? 120_000, 600_000));
  return await new Promise<TerminalOneShotCommandResult>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      const slice = getTerminalBuffer(info.id, MAX_BUFFER_BYTES);
      if (opts.preserveOnTimeout) {
        resolve({
          alive: slice?.alive ?? session.alive,
          exitCode: slice?.exitCode ?? session.exitCode,
          id: info.id,
          output: slice?.content ?? "",
          sessionKept: true,
          timedOut: true,
        });
        return;
      }
      try {
        session.pty.kill();
      } catch {
        /* ignore */
      }
      sessions.delete(info.id);
      resolve({
        alive: false,
        exitCode: null,
        id: info.id,
        output: slice?.content ?? "",
        sessionKept: false,
        timedOut: true,
      });
    }, timeoutMs);
    const disposeExit = session.pty.onExit(({ exitCode }) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      disposeExit.dispose();
      const slice = getTerminalBuffer(info.id, MAX_BUFFER_BYTES);
      sessions.delete(info.id);
      resolve({
        alive: false,
        exitCode: typeof exitCode === "number" ? exitCode : null,
        id: info.id,
        output: slice?.content ?? "",
        sessionKept: false,
        timedOut: false,
      });
    });
  });
}

export async function runTerminalSessionToExit(opts: {
  createOpts: TerminalSessionCreateOpts;
  timeoutMs?: number;
  preserveOnTimeout?: boolean;
  preserveOnAuthPrompt?: boolean;
}): Promise<TerminalWaitForExitResult> {
  const info = createTerminalSession(opts.createOpts);
  const session = sessions.get(info.id)!;
  const timeoutMs = Math.max(500, Math.min(opts.timeoutMs ?? 120_000, 600_000));
  const deadline = Date.now() + timeoutMs;
  let shouldKillOnFinally = true;
  try {
    while (Date.now() < deadline) {
      if (session.pendingAuthPrompt) {
        if (opts.preserveOnAuthPrompt) {
          shouldKillOnFinally = false;
        }
        return {
          alive: session.alive,
          authPrompt: session.pendingAuthPrompt,
          exitCode: null,
          id: info.id,
          output: getTerminalBuffer(info.id, MAX_BUFFER_BYTES)?.content ?? "",
          sessionKept: opts.preserveOnAuthPrompt === true,
          timedOut: false,
        };
      }
      if (!session.alive) {
        const slice = getTerminalBuffer(info.id, MAX_BUFFER_BYTES);
        return {
          alive: false,
          authPrompt: null,
          exitCode: session.exitCode,
          id: info.id,
          output: slice?.content ?? "",
          sessionKept: false,
          timedOut: false,
        };
      }
      await delay(120);
    }
    if (opts.preserveOnTimeout) {
      shouldKillOnFinally = false;
    }
    return {
      alive: session.alive,
      authPrompt: session.pendingAuthPrompt,
      exitCode: null,
      id: info.id,
      output: getTerminalBuffer(info.id, MAX_BUFFER_BYTES)?.content ?? "",
      sessionKept: opts.preserveOnTimeout === true,
      timedOut: true,
    };
  } finally {
    if (shouldKillOnFinally) {
      killTerminalSession(info.id);
    }
  }
}

function toInfo(s: Session): TerminalSessionInfo {
  return {
    alive: s.alive,
    bufferBytes: Buffer.byteLength(s.buffer, "utf8"),
    cols: s.cols,
    createdAt: s.createdAt,
    cwd: s.cwd,
    id: s.id,
    rows: s.rows,
    shell: s.shell,
    title: s.title,
  };
}

function defaultTitleForShell(shellPath: string): string {
  const base = shellPath.replace(/\\/g, "/").split("/").pop() ?? shellPath;
  return base.replace(/\.exe$/i, "");
}

function maybeHandleAuthPrompt(
  session: Session,
  chunk: string
): TerminalSessionAuthPrompt | null {
  session.recentOutputTail = appendTerminalAuthPromptTail(
    session.recentOutputTail,
    chunk
  );
  const detected = detectTerminalAuthPrompt(session.recentOutputTail);
  if (!detected) {
    session.pendingAuthPrompt = null;
    return null;
  }

  if (
    session.passwordAutofill &&
    session.passwordAutofillCount < MAX_PASSWORD_AUTOFILL_ATTEMPTS
  ) {
    try {
      session.passwordAutofillCount += 1;
      resetSessionAuthPromptState(session);
      session.pty.write(session.passwordAutofill + "\r");
      return null;
    } catch {
      /* ignore */
    }
  }

  const nextPrompt: TerminalSessionAuthPrompt = {
    kind: detected.kind,
    prompt: detected.prompt,
    seq: session.seq,
  };
  session.pendingAuthPrompt = nextPrompt;
  return nextPrompt;
}

function resetSessionAuthPromptState(session: Session): void {
  session.pendingAuthPrompt = null;
  session.recentOutputTail = "";
}
