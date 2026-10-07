// Le terminal reste dans une fenêtre locale ; le web ne reçoit aucun accès PTY.
import { execFile } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import type { Event as ElectronEvent, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import * as pty from "node-pty";
import type { CliState } from "./cli-protocol";

const executeFile = promisify(execFile);
const sessions = new Map<number, CliSession>();
type CliSession = {
  window: BrowserWindow;
  terminal?: pty.IPty;
  state: CliState;
  busy: boolean;
};
const windows = process.platform === "win32";
const shellPath = windows ? (process.env.ComSpec || "cmd.exe") : (process.env.SHELL || "/bin/sh");
const terminalUrl = () => pathToFileURL(path.join(__dirname, "terminal/index.html")).href;

async function commandPath(command: "mai" | "npm" | "node"): Promise<string | null> {
  try {
    const { stdout } = windows
      ? await executeFile("where.exe", [command], { timeout: 6000, windowsHide: true })
      : await executeFile(shellPath, ["-ilc", "command -v " + command], { timeout: 6000 });
    const candidates = stdout.trim().split(/\r?\n/);
    return windows
      ? (candidates.find((item) => /\.(cmd|exe|bat)$/i.test(item)) ?? null)
      : (candidates.at(-1)?.trim() || null);
  } catch {
    return null;
  }
}

async function detectCommands() {
  const [mai, npm, node] = await Promise.all([
    commandPath("mai"), commandPath("npm"), commandPath("node"),
  ]);
  return { mai, npm, node };
}

function publish(session: CliSession, patch: Partial<CliState>) {
  session.state = { ...session.state, ...patch };
  if (!session.window.isDestroyed()) {
    session.window.webContents.send("cli:state", session.state);
  }
  return session.state;
}

function localSession(event: IpcMainEvent | IpcMainInvokeEvent) {
  const session = sessions.get(event.sender.id);
  if (!session || session.window.isDestroyed() ||
      event.senderFrame !== event.sender.mainFrame ||
      event.senderFrame?.url !== terminalUrl()) {
    throw new Error("Accès au terminal local refusé.");
  }
  return session;
}

function quoteCommand(file: string) {
  if (/[\r\n]/.test(file)) { throw new Error("Chemin de commande invalide."); }
  if (windows) {
    if (file.includes('"')) { throw new Error("Chemin de commande invalide."); }
    return '"' + file + '"';
  }
  return "'" + file.replaceAll("'", "'\\''") + "'";
}

function spawnTerminal(session: CliSession, args: string[]) {
  const terminal = pty.spawn(shellPath, args, {
    name: "xterm-256color", cols: 100, rows: 30,
    cwd: app.getPath("home"),
    env: { ...process.env, TERM: "xterm-256color" },
  });
  session.terminal = terminal;
  terminal.onData((data: string) => {
    if (!session.window.isDestroyed()) {
      session.window.webContents.send("cli:data", data);
    }
  });
  return terminal;
}

function launchMai(session: CliSession, mai: string) {
  const terminal = spawnTerminal(session, windows ? ["/d", "/q"] : ["-l"]);
  terminal.onExit(({ exitCode }: { exitCode: number }) => {
    if (session.terminal !== terminal || session.window.isDestroyed()) { return; }
    session.terminal = undefined;
    publish(session, { running: false, error: exitCode ? "Le terminal s'est fermé avec une erreur." : undefined });
  });
  terminal.write(quoteCommand(mai) + "\r");
  return publish(session, { running: true, installing: false, error: undefined });
}

ipcMain.handle("cli:start", async (event: IpcMainInvokeEvent) => {
  const session = localSession(event);
  if (session.busy || session.terminal) { return session.state; }
  session.busy = true;
  try {
    const commands = await detectCommands();
    if (session.window.isDestroyed()) { return session.state; }
    publish(session, {
      maiInstalled: Boolean(commands.mai), npmInstalled: Boolean(commands.npm),
      nodeInstalled: Boolean(commands.node), error: undefined,
    });
    if (commands.mai && commands.node) { return launchMai(session, commands.mai); }
    return session.state;
  } catch {
    return publish(session, { error: "Impossible de démarrer le terminal CLI." });
  } finally { session.busy = false; }
});

ipcMain.handle("cli:install", async (event: IpcMainInvokeEvent) => {
  const session = localSession(event);
  if (session.busy || session.terminal) { return session.state; }
  session.busy = true;
  try {
    const commands = await detectCommands();
    if (session.window.isDestroyed()) { return session.state; }
    if (commands.mai && commands.node) { return launchMai(session, commands.mai); }
    if (!commands.npm || !commands.node) {
      return publish(session, { npmInstalled: Boolean(commands.npm), nodeInstalled: Boolean(commands.node),
        error: "Installez Node.js et npm, puis relancez la détection." });
    }
    publish(session, { installing: true, error: undefined });
    const command = quoteCommand(commands.npm) + " install -g @mdevs/mai-cli";
    const terminal = spawnTerminal(session, windows ? ["/d", "/s", "/c", command] : ["-lc", command]);
    terminal.onExit(({ exitCode }: { exitCode: number }) => {
      if (session.terminal !== terminal || session.window.isDestroyed()) { return; }
      session.terminal = undefined;
      void (async () => {
        try {
          const installed = await detectCommands();
          if (session.window.isDestroyed()) { return; }
          publish(session, { installing: false, maiInstalled: Boolean(installed.mai) });
          if (exitCode === 0 && installed.mai) { launchMai(session, installed.mai); }
          else { publish(session, { error: "Installation incomplète. Consultez le terminal puis réessayez." }); }
        } catch {
          publish(session, { installing: false, error: "Impossible de lancer le CLI après l'installation." });
        }
      })();
    });
    return session.state;
  } catch {
    return publish(session, { installing: false, error: "Impossible de lancer l'installation du CLI." });
  } finally { session.busy = false; }
});

ipcMain.on("cli:write", (event: IpcMainEvent, data: unknown) => {
  try {
    const session = localSession(event);
    if (typeof data === "string" && data.length <= 65536 && (session.state.running || session.state.installing)) {
      session.terminal?.write(data);
    }
  } catch { /* Les messages d'une autre fenêtre sont ignorés. */ }
});
ipcMain.on("cli:resize", (event: IpcMainEvent, cols: unknown, rows: unknown) => {
  try {
    const session = localSession(event);
    if (typeof cols === "number" && typeof rows === "number" &&
        Number.isInteger(cols) && Number.isInteger(rows) &&
        cols >= 2 && cols <= 500 && rows >= 2 && rows <= 300) {
      session.terminal?.resize(cols, rows);
    }
  } catch { /* Une fenêtre distante ne peut pas redimensionner le PTY. */ }
});
ipcMain.handle("cli:help", (event: IpcMainInvokeEvent) => {
  localSession(event);
  return shell.openExternal("https://nodejs.org/fr/download");
});

export async function openCliWindow(): Promise<{ success: boolean; error?: string }> {
  let window: BrowserWindow | undefined;
  try {
    window = new BrowserWindow({
      width: 1100, height: 720, minWidth: 640, minHeight: 420,
      title: "mAI CLI", backgroundColor: "#0a0a0a", show: false,
      webPreferences: { preload: path.join(__dirname, "terminal-preload.js"),
        contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true },
    });
    const session: CliSession = { window, busy: false, state: {
      maiInstalled: false, npmInstalled: false, nodeInstalled: false, running: false, installing: false,
    }};
    sessions.set(window.webContents.id, session);
    const id = window.webContents.id;
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event: ElectronEvent) => { event.preventDefault(); });
    window.on("closed", () => {
      sessions.delete(id);
      try { session.terminal?.kill(); } catch { /* Le processus peut déjà être fermé. */ }
    });
    window.once("ready-to-show", () => { window?.show(); window?.focus(); });
    await window.loadURL(terminalUrl());
    return { success: true };
  } catch {
    window?.destroy();
    return { success: false, error: "Impossible d'ouvrir la fenêtre du terminal CLI." };
  }
}
