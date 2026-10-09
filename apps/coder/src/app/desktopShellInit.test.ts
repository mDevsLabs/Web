import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TFunction } from "../i18n";

vi.mock("../bootSplash", () => ({
  hideBootSplash: vi.fn(),
}));

import { runDesktopShellInit } from "./desktopShellInit";

describe("runDesktopShellInit", () => {
  const store: Record<string, string> = {};
  let previousWindow: unknown;
  let previousLocalStorage: unknown;
  let previousRequestIdleCallback: unknown;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    previousWindow = (globalThis as { window?: unknown }).window;
    previousLocalStorage = (globalThis as { localStorage?: unknown })
      .localStorage;
    previousRequestIdleCallback = (
      globalThis as { requestIdleCallback?: unknown }
    ).requestIdleCallback;
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const memory: Storage = {
      clear() {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      getItem(key) {
        return Object.hasOwn(store, key) ? store[key]! : null;
      },
      key(index) {
        return Object.keys(store)[index] ?? null;
      },
      get length() {
        return Object.keys(store).length;
      },
      removeItem(key) {
        delete store[key];
      },
      setItem(key, value) {
        store[key] = String(value);
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memory,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        clearTimeout,
        innerWidth: 1280,
        location: { hash: "", search: "" },
        matchMedia: () => ({ matches: true }),
        setTimeout,
      },
    });
    Object.defineProperty(globalThis, "requestIdleCallback", {
      configurable: true,
      value: (cb: IdleRequestCallback) => {
        cb({ didTimeout: true, timeRemaining: () => 0 } as IdleDeadline);
        return 1;
      },
    });
  });

  afterEach(() => {
    if (previousWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
    if (previousLocalStorage === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previousLocalStorage,
      });
    }
    if (previousRequestIdleCallback === undefined) {
      delete (globalThis as { requestIdleCallback?: unknown })
        .requestIdleCallback;
    } else {
      Object.defineProperty(globalThis, "requestIdleCallback", {
        configurable: true,
        value: previousRequestIdleCallback,
      });
    }
    vi.restoreAllMocks();
  });

  it("still applies model settings when the initial thread refresh fails", async () => {
    const settings = {
      defaultModel: "model-1",
      language: "zh-CN",
      models: {
        enabledIds: ["model-1"],
        entries: [
          {
            displayName: "Model 1",
            id: "model-1",
            providerId: "provider-1",
            requestName: "model-1",
          },
        ],
        providers: [
          {
            displayName: "Provider",
            id: "provider-1",
            paradigm: "openai-compatible",
          },
        ],
        thinkingByModelId: { "model-1": "medium" },
      },
      ui: { colorMode: "dark", sidebarLayout: { left: 280, right: 360 } },
    };
    const shell = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === "mai-coder:ping") return { message: "pong", ok: true };
        if (channel === "workspace:get") return { root: "D:/work/app" };
        if (channel === "app:getPaths") return { home: "D:/Users/me" };
        if (channel === "settings:get") return settings;
        if (channel === "mcp:getServers") return { servers: [] };
        if (channel === "mcp:getStatuses") return { statuses: [] };
        if (channel === "settings:set") return settings;
        return {};
      }),
    } as unknown as NonNullable<Window["maiShell"]>;
    const applyLoadedSettings = vi.fn();
    const refreshThreads = vi.fn(async () => {
      throw new Error("thread list unavailable");
    });

    await runDesktopShellInit({
      applyLoadedSettings,
      layoutPinnedBySurface: false,
      refreshGit: vi.fn(),
      refreshThreads,
      setAppearanceSettings: vi.fn(),
      setColorMode: vi.fn(),
      setHomePath: vi.fn(),
      setIpcOk: vi.fn(),
      setLayoutMode: vi.fn(),
      setLocale: vi.fn(),
      setMcpServers: vi.fn(),
      setMcpStatuses: vi.fn(),
      setRailWidths: vi.fn(),
      setWorkspace: vi.fn(),
      shell,
      shellLayoutStorageKey: "test-layout-mode",
      sidebarLayoutStorageKey: "test-sidebar-layout",
      t: ((key: string, vars?: Record<string, unknown>) =>
        String(vars?.message ?? key)) as TFunction,
    });

    expect(refreshThreads).toHaveBeenCalledTimes(1);
    expect(applyLoadedSettings).toHaveBeenCalledWith(settings);
  });
});
