// Les tests simulent le système : aucune installation globale ni commande utilisateur n'est exécutée.
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detected: new Set<string>(),
  handlers: new Map<string, (...args: any[]) => any>(),
  listeners: new Map<string, (...args: any[]) => any>(),
  openExternal: vi.fn(),
  spawn: vi.fn(),
  windows: [] as any[],
}));
vi.mock("electron", () => {
  class BrowserWindow {
    webContents: any;
    events = new Map<string, (...args: any[]) => void>();
    destroyed = false;
    constructor() {
      const mainFrame = { url: "" };
      this.webContents = {
        id: mocks.windows.length + 1,
        mainFrame,
        on: vi.fn(),
        send: vi.fn(),
        setWindowOpenHandler: vi.fn(),
      };
      mocks.windows.push(this);
    }
    on(event: string, listener: (...args: any[]) => void) {
      this.events.set(event, listener);
    }
    once(event: string, listener: (...args: any[]) => void) {
      this.events.set(event, listener);
    }
    async loadURL(url: string) {
      this.webContents.mainFrame.url = url;
    }
    isDestroyed() {
      return this.destroyed;
    }
    show() {}
    focus() {}
    destroy() {
      this.destroyed = true;
      this.events.get("closed")?.();
    }
  }
  const mockElectron = {
    app: { getPath: () => process.cwd() },
    BrowserWindow,
    ipcMain: {
      handle: (channel: string, callback: (...args: any[]) => any) =>
        mocks.handlers.set(channel, callback),
      on: (channel: string, callback: (...args: any[]) => any) =>
        mocks.listeners.set(channel, callback),
    },
    shell: { openExternal: mocks.openExternal },
  };
  return {
    ...mockElectron,
    default: mockElectron,
  };
});
vi.mock("node:child_process", () => {
  const execFile: any = (
    _file: string,
    args: string[],
    _options: unknown,
    callback: (...args: any[]) => void
  ) => {
    const command = args.at(-1)?.split(" ").at(-1) || "";
    if (!mocks.detected.has(command)) {
      callback(new Error("Commande absente"));
      return;
    }
    const file =
      process.platform === "win32"
        ? path.join("C:", "outils", `${command}.cmd`)
        : `/usr/bin/${command}`;
    callback(null, `${file}\n`, "");
  };
  execFile[Symbol.for("nodejs.util.promisify.custom")] = async (
    _file: string,
    args: string[],
    _options: unknown
  ) => {
    const command = args.at(-1)?.split(" ").at(-1) || "";
    if (!mocks.detected.has(command)) {
      throw new Error("Commande absente");
    }
    const file =
      process.platform === "win32"
        ? path.join("C:", "outils", `${command}.cmd`)
        : `/usr/bin/${command}`;
    return { stderr: "", stdout: `${file}\n` };
  };
  return { execFile };
});
vi.mock("node-pty", () => ({ spawn: mocks.spawn }));

// Chargement dynamique via variable pour isoler le typecheck Web des dépendances natives Electron
const desktopCliModule = "../../apps/desktop/src/cli-window";
const { openCliWindow } = (await import(desktopCliModule)) as {
  openCliWindow: () => Promise<{ success: boolean; error?: string }>;
};

function sender(window: any) {
  return {
    sender: window.webContents,
    senderFrame: window.webContents.mainFrame,
  };
}
function fakeTerminal() {
  const terminal = {
    kill: vi.fn(),
    onData: vi.fn(),
    onExit: vi.fn(),
    resize: vi.fn(),
    write: vi.fn(),
  };
  mocks.spawn.mockReturnValue(terminal);
  return terminal;
}
beforeEach(() => {
  mocks.detected.clear();
  mocks.spawn.mockReset();
  mocks.openExternal.mockReset();
  for (const window of mocks.windows) {
    if (!window.destroyed) {
      window.destroy();
    }
  }
  mocks.windows.length = 0;
});
describe("fenêtre CLI bureau", () => {
  it("ouvre une nouvelle fenêtre à chaque clic", async () => {
    expect(await openCliWindow()).toEqual({ success: true });
    expect(await openCliWindow()).toEqual({ success: true });
    expect(mocks.windows).toHaveLength(2);
    expect(mocks.windows[0].webContents.mainFrame.url).toContain(
      "/terminal/index.html"
    );
  });
  it("détecte un CLI absent sans installer automatiquement", async () => {
    mocks.detected.add("npm");
    mocks.detected.add("node");
    await openCliWindow();
    const state = await mocks.handlers.get("cli:start")!(
      sender(mocks.windows[0])
    );
    expect(state.maiInstalled).toBe(false);
    expect(state.npmInstalled).toBe(true);
    expect(state.running).toBe(false);
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("lance la commande existante et ferme son PTY avec la fenêtre", async () => {
    for (const command of ["mai", "node"]) {
      mocks.detected.add(command);
    }
    const terminal = fakeTerminal();
    await openCliWindow();
    const state = await mocks.handlers.get("cli:start")!(
      sender(mocks.windows[0])
    );
    expect(state.running).toBe(true);
    expect(terminal.write).toHaveBeenCalledWith(expect.stringContaining("mai"));
    mocks.windows[0].destroy();
    expect(terminal.kill).toHaveBeenCalledOnce();
  });
  it("ne propose pas une installation réalisable lorsque npm manque", async () => {
    await openCliWindow();
    const state = await mocks.handlers.get("cli:install")!(
      sender(mocks.windows[0])
    );
    expect(state.error).toContain("Node.js");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("installe uniquement après une demande explicite", async () => {
    for (const command of ["npm", "node"]) {
      mocks.detected.add(command);
    }
    fakeTerminal();
    await openCliWindow();
    const state = await mocks.handlers.get("cli:install")!(
      sender(mocks.windows[0])
    );
    expect(state.installing).toBe(true);
    expect(JSON.stringify(mocks.spawn.mock.calls[0])).toContain(
      "install -g @mdevs/mai-cli"
    );
  });
  it("refuse les commandes provenant d'une frame distante", async () => {
    await openCliWindow();
    const event = {
      ...sender(mocks.windows[0]),
      senderFrame: { url: "https://example.com" },
    };
    await expect(mocks.handlers.get("cli:start")!(event)).rejects.toThrow(
      "refusé"
    );
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("borne le redimensionnement du terminal", async () => {
    for (const command of ["mai", "node"]) {
      mocks.detected.add(command);
    }
    const terminal = fakeTerminal();
    await openCliWindow();
    const event = sender(mocks.windows[0]);
    await mocks.handlers.get("cli:start")!(event);
    mocks.listeners.get("cli:resize")!(event, 80, 24);
    mocks.listeners.get("cli:resize")!(event, 0, 99_999);
    expect(terminal.resize).toHaveBeenCalledExactlyOnceWith(80, 24);
  });
});
