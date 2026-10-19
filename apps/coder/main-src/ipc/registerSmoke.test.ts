import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * IPC handler smoke tests.
 *
 * Why this file exists: register.ts and the handler files in ./handlers/ wire
 * up ~130 ipcMain.handle('...', fn) calls. Several of those handlers reference
 * cross-cutting helpers (`senderWorkspaceRoot`, `workspaceRootsEqual`,
 * `runChatStream`, `abortByThread`, …) that live in agentRuntime.ts /
 * chatRuntime.ts. When we extract one of those helpers to a sibling module
 * but forget to add the import back to register.ts, esbuild does not catch
 * it (free identifiers in JS are only resolved at runtime) and tsc does not
 * catch it either (main-src is currently outside `tsconfig.json` `include`).
 * The bug only surfaces the first time the actual IPC channel fires —
 * exactly how a `ReferenceError: workspaceRootsEqual is not defined`
 * shipped in `ref/app`.
 *
 * This test loads every IPC handler module and invokes its `register*`
 * function with a stubbed `electron` module. ipcMain.handle is captured
 * into an array; we assert no throw, and that each module registers at
 * least one handler. We then invoke every captured handler with a stub
 * event so any free identifier inside the body surfaces as ReferenceError
 * at test time rather than at first IPC call in production.
 */

type CapturedHandler = { channel: string; fn: (...args: unknown[]) => unknown };
let capturedHandlers: CapturedHandler[] = [];

const HANDLER_SMOKE_TIMEOUT_MS = 1000;

// This smoke test cares about immediate ReferenceErrors, not completion of
// long-running IPC side effects such as login flows or network operations.
async function invokeHandlerWithTimeout(
  channel: string,
  fn: (...args: unknown[]) => unknown,
  args: unknown[],
  timeoutMs = HANDLER_SMOKE_TIMEOUT_MS
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new Error(`Handler '${channel}' did not settle within ${timeoutMs}ms`)
      );
    }, timeoutMs);
  });
  try {
    await Promise.race([Promise.resolve(fn(...args)), timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function createSmokeWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "async-shell-ipc-smoke-"));
}

function removeSmokeWorkspace(workspaceRoot: string): void {
  try {
    fs.rmSync(workspaceRoot, {
      force: true,
      maxRetries: 3,
      recursive: true,
      retryDelay: 50,
    });
  } catch {
    // Best effort only; Windows can briefly hold handles after mocked IPC flows.
  }
}

vi.mock("electron", () => {
  const ipcMain = {
    handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
      capturedHandlers.push({ channel, fn });
    },
    on: () => {},
    removeAllListeners: () => {},
  };
  const noop = () => {};
  const app = {
    getPath: () => "/tmp/async-shell-smoke",
    getVersion: () => "0.0.0-test",
    quit: noop,
    setBadgeCount: noop,
  };
  const BrowserWindow = Object.assign(
    function BrowserWindow() {
      throw new Error(
        "BrowserWindow constructor should not run during smoke test"
      );
    },
    {
      fromWebContents: () => null,
      getAllWindows: () => [],
    }
  );
  const dialog = {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async () => ({ canceled: true, filePath: undefined }),
  };
  const shell = {
    openExternal: async () => {},
    openPath: async () => "",
    showItemInFolder: noop,
  };
  const clipboard = { readText: () => "", writeText: noop };
  const webContents = { fromId: () => null };
  const nativeImage = {
    createEmpty: () => ({}),
    createFromDataURL: () => ({}),
  };
  const nativeTheme = { on: noop, shouldUseDarkColors: false };
  return {
    app,
    BrowserWindow,
    clipboard,
    default: {
      app,
      BrowserWindow,
      clipboard,
      dialog,
      ipcMain,
      nativeImage,
      nativeTheme,
      shell,
      webContents,
    },
    dialog,
    ipcMain,
    nativeImage,
    nativeTheme,
    shell,
    webContents,
  };
});

vi.mock("../appWindow.js", () => {
  const fakeWindow = {
    close: () => {},
    isDestroyed: () => false,
    once: () => {},
    webContents: { id: 999, once: () => {} },
  };
  return {
    createAppWindow: vi.fn(() => fakeWindow),
    findAppWindowBySurface: vi.fn(() => null),
    focusAppWindow: vi.fn(),
  };
});

vi.mock("../autoUpdate.js", () => ({
  checkForUpdates: vi.fn(async () => ({ state: "idle" })),
  downloadUpdate: vi.fn(async () => {}),
  getStatus: vi.fn(() => ({ state: "idle" })),
  openUpdateFolder: vi.fn(),
  quitAndInstall: vi.fn(),
}));

vi.mock("../gitService.js", () => ({
  buildDiffPreviewsMap: vi.fn(async () => ({})),
  getDiffPreview: vi.fn(async () => null),
  gitBranch: vi.fn(async () => "main"),
  gitCommit: vi.fn(async () => {}),
  gitCreateBranchAndSwitch: vi.fn(async () => {}),
  gitDiffHeadUnified: vi.fn(async () => ""),
  gitListLocalBranches: vi.fn(async () => ({
    branches: ["main"],
    current: "main",
  })),
  gitProbeContext: vi.fn(async () => ({ ok: true, topLevel: process.cwd() })),
  gitPush: vi.fn(async () => {}),
  gitStageAll: vi.fn(async () => {}),
  gitStatusPorcelain: vi.fn(async () => ""),
  gitSwitchBranch: vi.fn(async () => {}),
  listPorcelainPaths: vi.fn(() => []),
  normalizeGitFailureMessage: vi.fn(
    (error: unknown, fallback = "Git command failed") =>
      error instanceof Error ? error.message : fallback
  ),
  parseGitPathStatus: vi.fn(() => ({})),
  withGitWorkspaceRootAsync: vi.fn(
    async (_root: string, fn: () => Promise<unknown>) => await fn()
  ),
  workspaceRelativeFromRepoRelative: vi.fn((repoRel: string) => repoRel),
}));

vi.mock("../llm/providerOAuthLogin.js", () => ({
  cancelActiveProviderOAuthLogin: vi.fn(() => true),
  discoverProviderOAuthModels: vi.fn(async () => []),
  ensureFreshOAuthAuthForRequest: vi.fn(
    async (_providerId: string, auth: unknown) => auth
  ),
  fetchProviderOAuthUsageSummary: vi.fn(async () => undefined),
  providerOAuthLabel: vi.fn((provider: string) => provider),
  runProviderOAuthLogin: vi.fn(async () => {
    throw new Error("OAuth login is disabled in IPC smoke tests.");
  }),
}));

vi.mock("../workspaceFileIndex.js", () => ({
  acquireWorkspaceFileIndexRef: vi.fn(),
  ensureWorkspaceFileIndex: vi.fn(async () => []),
  registerKnownWorkspaceRelPath: vi.fn(),
  releaseWorkspaceFileIndexRef: vi.fn(),
  searchWorkspaceFiles: vi.fn(async () => []),
  setWorkspaceFileIndexReadyBroadcaster: vi.fn(),
  setWorkspaceFsTouchNotifier: vi.fn(),
}));

vi.mock("../workspaceSymbolIndex.js", () => ({
  ensureSymbolIndexLoaded: vi.fn(async () => {}),
  searchWorkspaceSymbols: vi.fn(() => []),
}));

vi.mock("../browser/browserCaInstaller.js", () => ({
  CaInstaller: {
    install: vi.fn(async () => ({ ok: true })),
    isInstalled: vi.fn(async () => false),
    uninstall: vi.fn(async () => ({ ok: true })),
  },
}));

beforeEach(() => {
  capturedHandlers = [];
});

const handlerCases: Array<{
  name: string;
  load: () => Promise<{ register: () => void }>;
}> = [
  {
    load: async () => ({
      register: (await import("./handlers/appHandlers.js")).registerAppHandlers,
    }),
    name: "appHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/workspaceHandlers.js"))
        .registerWorkspaceHandlers,
    }),
    name: "workspaceHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/fsHandlers.js")).registerFsHandlers,
    }),
    name: "fsHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/shellHandlers.js"))
        .registerShellHandlers,
    }),
    name: "shellHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/gitHandlers.js")).registerGitHandlers,
    }),
    name: "gitHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/browserHandlers.js"))
        .registerBrowserHandlers,
    }),
    name: "browserHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/mcpHandlers.js")).registerMcpHandlers,
    }),
    name: "mcpHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/pluginsHandlers.js"))
        .registerPluginsHandlers,
    }),
    name: "pluginsHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/settingsHandlers.js"))
        .registerSettingsHandlers,
    }),
    name: "settingsHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/terminalExecHandlers.js"))
        .registerTerminalExecHandlers,
    }),
    name: "terminalExecHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/clipboardHandlers.js"))
        .registerClipboardHandlers,
    }),
    name: "clipboardHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/lspHandlers.js")).registerLspHandlers,
    }),
    name: "lspHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/usageStatsHandlers.js"))
        .registerUsageStatsHandlers,
    }),
    name: "usageStatsHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/autoUpdateHandlers.js"))
        .registerAutoUpdateHandlers,
    }),
    name: "autoUpdateHandlers",
  },
  {
    load: async () => ({
      register: (await import("./handlers/maiAuthHandlers.js"))
        .registerMaiAuthHandlers,
    }),
    name: "maiAuthHandlers",
  },
  {
    load: async () => ({
      register: (await import("./register.js")).registerIpc,
    }),
    // register.ts is the central dispatcher; its IPC handlers reference
    // helpers from agentRuntime.ts and chatRuntime.ts that have repeatedly
    // been the source of "forgot to add the import back" bugs. The whole
    // reason this smoke test exists is the workspaceRootsEqual ReferenceError
    // that shipped from a register.ts handler.
    name: "register (full registerIpc)",
  },
];

describe("IPC register smoke", () => {
  for (const { name, load } of handlerCases) {
    it(`${name} registers handlers without ReferenceError`, async () => {
      const { register } = await load();
      expect(() => register()).not.toThrow();
      expect(capturedHandlers.length).toBeGreaterThan(0);
      for (const { channel, fn } of capturedHandlers) {
        expect(typeof channel).toBe("string");
        expect(typeof fn).toBe("function");
      }
    }, 60_000);
  }

  /**
   * Invoke every captured handler with a stub event + sentinel args. Any
   * `ReferenceError: X is not defined` inside a handler body — the exact
   * shape of the bug this file exists to catch — surfaces here even though
   * the handler's downstream effects are mocked.
   *
   * We do NOT validate handler return values; downstream services are
   * mocked aggressively, and most handlers will return `{ ok: false, ... }`.
   * The only assertion that matters is "did the function body evaluate
   * without throwing a ReferenceError".
   *
   * Some handlers short-circuit when there is no workspace bound to the
   * sender. To make sure we still execute the *interesting* branch (the
   * one that historically referenced `workspaceRootsEqual`), we bind the
   * fake sender to a real directory (process.cwd()) and pass payloads that
   * push the handler past the early `if (!root) return ...` guard.
   */
  it("every handler body evaluates without ReferenceError", async () => {
    const { bindWorkspaceRootToWebContents } = await import("../workspace.js");
    const workspaceRoot = createSmokeWorkspace();

    // Per-channel payload nudges: these are channels whose interesting code
    // path only runs when given non-empty input (e.g. threads:listAgentSidebar
    // has to be given an array of paths to even try `workspaceRootsEqual`).
    // Add new entries here whenever a handler grows a branch that early-out
    // on default empty args.
    const channelPayloads: Record<string, unknown[]> = {
      "threads:listAgentSidebar": [[workspaceRoot]],
      "workspace:openPath": [workspaceRoot],
    };

    try {
      for (const { load } of handlerCases) {
        const { register } = await load();
        capturedHandlers = [];
        register();
        const sender = {
          id: 1,
          isDestroyed: () => false,
          send: () => {},
        };
        const fakeEvent = { sender };
        for (const { channel, fn } of capturedHandlers) {
          // Re-bind workspace root before every call: some handlers
          // (e.g. workspace:closeFolder) intentionally clear the binding.
          bindWorkspaceRootToWebContents(sender as never, workspaceRoot);
          const extraArgs = channelPayloads[channel] ?? ["", "", "", ""];
          try {
            await invokeHandlerWithTimeout(channel, fn, [
              fakeEvent,
              ...extraArgs,
            ]);
          } catch (err) {
            if (err instanceof ReferenceError) {
              throw new Error(
                `Handler '${channel}' threw ReferenceError: ${err.message}`
              );
            }
            /* other errors are expected — downstream services are mocked */
          }
        }
        bindWorkspaceRootToWebContents(sender as never, null);
      }
    } finally {
      removeSmokeWorkspace(workspaceRoot);
    }
  }, 60_000);
});
