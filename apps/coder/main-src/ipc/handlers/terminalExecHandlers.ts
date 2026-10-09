import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ipcMain } from "electron";
import { windowsCmdUtf8Prefix } from "../../winUtf8.js";
import { senderWorkspaceRoot } from "../agentRuntime.js";

const execFileAsync = promisify(execFile);

/**
 * `terminal:execLine` IPC：在工作区目录下用宿主 shell 执行单行命令。
 *
 * Windows 走 cmd.exe + UTF-8 prefix；其他平台走 bash -lc。
 * 5 MB 输出上限、120 秒超时；行为与原 register.ts 完全一致。
 *
 * 注意：交互式 PTY 终端走 `terminalSessionIpc`，此 handler 仅用于 composer
 * 等"一次性命令片段执行"场景。
 */
export function registerTerminalExecHandlers(): void {
  ipcMain.handle("terminal:execLine", async (event, line: string) => {
    const root = senderWorkspaceRoot(event);
    if (!root) {
      return { error: "No workspace", ok: false as const };
    }
    const trimmed = line.trim();
    if (!trimmed) {
      return { ok: true as const, stderr: "", stdout: "" };
    }
    try {
      const isWin = process.platform === "win32";
      const shell = isWin ? process.env.ComSpec || "cmd.exe" : "/bin/bash";
      const cmdLine = isWin ? windowsCmdUtf8Prefix(trimmed) : trimmed;
      const args = isWin ? ["/d", "/s", "/c", cmdLine] : ["-lc", cmdLine];
      const { stdout, stderr } = await execFileAsync(shell, args, {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 5 * 1024 * 1024,
        timeout: 120_000,
        windowsHide: true,
      });
      return { ok: true as const, stderr: stderr || "", stdout: stdout || "" };
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      return {
        error: err.message ?? String(e),
        ok: false as const,
        stderr: err.stderr ?? "",
        stdout: err.stdout ?? "",
      };
    }
  });
}
