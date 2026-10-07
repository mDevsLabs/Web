import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { ipcMain, shell } from "electron";
import { resolveWorkspacePath } from "../../workspace.js";
import { senderWorkspaceRoot } from "../agentRuntime.js";

const execFileAsync = promisify(execFile);

/**
 * `shell:*` IPC：在系统资源管理器、外部应用、浏览器中打开本地文件 / URL。
 * 与原 register.ts 行为完全一致。
 */
export function registerShellHandlers(): void {
  ipcMain.handle("shell:revealInFolder", (event, relPath: string) => {
    try {
      const root = senderWorkspaceRoot(event);
      if (!root) {
        return { error: "No workspace", ok: false as const };
      }
      const rel = String(relPath ?? "").trim();
      if (!rel) {
        return { error: "empty path", ok: false as const };
      }
      const full = resolveWorkspacePath(rel, root);
      if (!fs.existsSync(full)) {
        return { error: "not found", ok: false as const };
      }
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        void shell.openPath(full);
      } else {
        shell.showItemInFolder(full);
      }
      return { ok: true as const };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        ok: false as const,
      };
    }
  });

  ipcMain.handle("shell:revealAbsolutePath", async (event, rawPath: string) => {
    try {
      // Durci: n'accepte que les chemins à l'intérieur du workspace du sender.
      // L'ancienne version acceptait tout chemin absolu (oracle d'existence + ouverture arbitraire).
      const root = senderWorkspaceRoot(event);
      const target = String(rawPath ?? "")
        .trim()
        .slice(0, 1024);
      if (!target) {
        return { error: "empty path", ok: false as const };
      }
      if (!root) {
        return { error: "no-workspace", ok: false as const };
      }
      let full: string;
      try {
        full = resolveWorkspacePath(target, root);
      } catch {
        return { error: "outside-workspace", ok: false as const };
      }
      if (!fs.existsSync(full)) {
        return { error: "not found", ok: false as const };
      }
      const st = fs.statSync(full);
      if (process.platform === "win32") {
        try {
          const args = st.isDirectory() ? [full] : [`/select,${full}`];
          const child = spawn("explorer.exe", args, {
            detached: true,
            stdio: "ignore",
            windowsHide: false,
          });
          child.unref();
          return { ok: true as const };
        } catch {
          /* fall through */
        }
      }
      if (process.platform === "darwin" && !st.isDirectory()) {
        try {
          await execFileAsync("open", ["-R", full], { windowsHide: true });
          return { ok: true as const };
        } catch {
          /* fall through */
        }
      }
      if (st.isDirectory()) {
        const err = await shell.openPath(full);
        return err
          ? ({ error: err, ok: false as const } as const)
          : ({ ok: true as const } as const);
      }
      shell.showItemInFolder(full);
      return { ok: true as const };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        ok: false as const,
      };
    }
  });

  ipcMain.handle("shell:openDefault", async (event, relPath: string) => {
    try {
      const root = senderWorkspaceRoot(event);
      const rel = String(relPath ?? "").trim();
      if (!rel) {
        return { error: "empty path", ok: false as const };
      }
      let full = rel;
      if (!path.isAbsolute(full)) {
        if (!root) {
          return { error: "No workspace", ok: false as const };
        }
        full = resolveWorkspacePath(rel, root);
      }
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
        return { error: "not a file", ok: false as const };
      }
      const err = await shell.openPath(full);
      return err
        ? ({ error: err, ok: false as const } as const)
        : ({ ok: true as const } as const);
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        ok: false as const,
      };
    }
  });

  ipcMain.handle("shell:openInBrowser", async (event, relPath: string) => {
    try {
      const root = senderWorkspaceRoot(event);
      if (!root) {
        return { error: "No workspace", ok: false as const };
      }
      const rel = String(relPath ?? "").trim();
      if (!rel) {
        return { error: "empty path", ok: false as const };
      }
      const full = resolveWorkspacePath(rel, root);
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
        return { error: "not a file", ok: false as const };
      }
      const ext = path.extname(full).toLowerCase();
      if (![".html", ".htm", ".svg"].includes(ext)) {
        return { error: "unsupported type", ok: false as const };
      }
      await shell.openExternal(pathToFileURL(full).href);
      return { ok: true as const };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        ok: false as const,
      };
    }
  });

  ipcMain.handle("shell:openExternalUrl", async (_event, url: string) => {
    try {
      const trimmed = String(url ?? "")
        .trim()
        .slice(0, 2048);
      if (!trimmed) {
        return { error: "empty url", ok: false as const };
      }
      let parsed: URL;
      try {
        parsed = new URL(trimmed);
      } catch {
        return { error: "invalid url", ok: false as const };
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "unsupported protocol", ok: false as const };
      }
      // Anti-phishing: bloque credentials dans l'URL, limite la longueur,
      // n'ouvre que http/https (mailto retiré: vecteur phishing).
      if (parsed.username || parsed.password) {
        return { error: "url-with-credentials-blocked", ok: false as const };
      }
      await shell.openExternal(parsed.toString());
      return { ok: true as const };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
        ok: false as const,
      };
    }
  });
}
