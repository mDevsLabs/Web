import { spawn } from "node:child_process";
import { decodeShellOutput } from "../textEncoding.js";
import { createBashProviderWithPath } from "./bashProvider.js";
import { getShellProvider } from "./detectShell.js";
import { createPowerShellProviderWithPath } from "./powershellProvider.js";
import type { ShellProvider, ShellType } from "./shellProvider.js";

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 600_000;
const DEFAULT_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export type CommandExecutorOptions = {
  cwd?: string;
  shell?: string;
  args?: string[];
  env?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  maxOutputBytes?: number;
};

export type CommandExecutorResult = {
  command: string;
  executable: string;
  args: string[];
  shellType: ShellType | "external";
  cwd?: string;
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  truncated: boolean;
};

function clampTimeout(timeoutMs: number | undefined): number {
  if (!Number.isFinite(timeoutMs) || !timeoutMs || timeoutMs <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.max(500, Math.min(Math.floor(timeoutMs), MAX_TIMEOUT_MS));
}

function isPowerShellShell(shell: string): boolean {
  return (
    /(?:^|[\\/])(pwsh|powershell)(?:\.exe)?$/i.test(shell) ||
    /^(pwsh|powershell)(?:\.exe)?$/i.test(shell)
  );
}

function isBashLikeShell(shell: string): boolean {
  return (
    /(?:^|[\\/])(bash|zsh|sh)(?:\.exe)?$/i.test(shell) ||
    /^(bash|zsh|sh)(?:\.exe)?$/i.test(shell)
  );
}

async function resolveCommand(
  command: string,
  opts: CommandExecutorOptions
): Promise<{
  executable: string;
  args: string[];
  shellType: ShellType | "external";
}> {
  if (opts.args) {
    if (!opts.shell) {
      throw new Error("shell is required when args are provided.");
    }
    return { args: opts.args, executable: opts.shell, shellType: "external" };
  }

  let provider: ShellProvider;
  if (opts.shell && isPowerShellShell(opts.shell)) {
    provider = createPowerShellProviderWithPath(opts.shell);
  } else if (opts.shell && isBashLikeShell(opts.shell)) {
    provider = createBashProviderWithPath(opts.shell);
  } else if (opts.shell) {
    const shellType: ShellType = process.platform === "win32" ? "cmd" : "bash";
    const args =
      process.platform === "win32"
        ? ["/d", "/s", "/c", command]
        : ["-lc", command];
    return { args, executable: opts.shell, shellType };
  } else {
    provider = await getShellProvider();
  }

  const built = provider.buildCommand(command, { cwd: opts.cwd });
  return {
    args: built.args,
    executable: built.command,
    shellType: provider.type,
  };
}

function appendChunk(
  current: Buffer,
  chunk: Buffer | string,
  maxBytes: number
): { value: Buffer; truncated: boolean } {
  const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  const next =
    current.length === 0
      ? chunkBuffer
      : Buffer.concat(
          [current, chunkBuffer],
          current.length + chunkBuffer.length
        );
  if (next.length <= maxBytes) {
    return { truncated: false, value: next };
  }
  return {
    truncated: true,
    value: Buffer.from(next.subarray(next.length - maxBytes)),
  };
}

export async function executeShellCommand(
  command: string,
  opts: CommandExecutorOptions = {}
): Promise<CommandExecutorResult> {
  const built = await resolveCommand(command, opts);
  const timeoutMs = clampTimeout(opts.timeoutMs);
  const maxOutputBytes = Math.max(
    1024,
    Math.floor(opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES)
  );

  return await new Promise<CommandExecutorResult>((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    let stdoutBuffer: Buffer = Buffer.alloc(0);
    let stderrBuffer: Buffer = Buffer.alloc(0);
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child = spawn(built.executable, built.args, {
      cwd: opts.cwd,
      env: opts.env
        ? { ...(process.env as Record<string, string>), ...opts.env }
        : process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const cleanupFns: Array<() => void> = [];
    const finish = (
      exitCode: number | null,
      signal: NodeJS.Signals | null
    ): void => {
      if (settled) {
        return;
      }
      settled = true;
      for (const cleanup of cleanupFns) cleanup();
      const stdout = decodeShellOutput(stdoutBuffer);
      const stderr = decodeShellOutput(stderrBuffer);
      const output =
        stdout +
        (stderr ? `${stdout ? "\n--- stderr ---\n" : ""}${stderr}` : "");
      resolve({
        args: built.args,
        command,
        cwd: opts.cwd,
        executable: built.executable,
        exitCode,
        output,
        shellType: built.shellType,
        signal,
        stderr,
        stdout,
        timedOut,
        truncated,
      });
    };

    const killChild = (): void => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      killChild();
    }, timeoutMs);
    cleanupFns.push(() => clearTimeout(timeout));

    const abort = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      for (const cleanup of cleanupFns) cleanup();
      killChild();
      reject(new DOMException("Aborted", "AbortError"));
    };
    opts.signal?.addEventListener("abort", abort, { once: true });
    cleanupFns.push(() => opts.signal?.removeEventListener("abort", abort));

    child.stdout?.on("data", (chunk: Buffer | string) => {
      const next = appendChunk(stdoutBuffer, chunk, maxOutputBytes);
      stdoutBuffer = next.value;
      truncated ||= next.truncated;
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      const next = appendChunk(stderrBuffer, chunk, maxOutputBytes);
      stderrBuffer = next.value;
      truncated ||= next.truncated;
    });
    (child as any).once("error", (error: any) => {
      if (settled) return;
      settled = true;
      for (const cleanup of cleanupFns) cleanup();
      reject(error);
    });
    (child as any).once("close", finish);
    child.stdin?.end();
  });
}
