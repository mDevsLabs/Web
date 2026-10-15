import { useEffect } from "react";
import type { InitialWindowThemeSnapshot } from "./initialWindowTheme";
import {
  DEFAULT_SHELL_LAYOUT_MODE_KEY,
  DEFAULT_SIDEBAR_LAYOUT_KEY,
  type ShellLayoutMode,
} from "./app/shellLayoutStorage";
import { AppBrowserWindow } from "./app/AppBrowserWindow";
import { AppMainWorkspace } from "./app/AppMainWorkspace";
import { AppTerminalWindow } from "./app/AppTerminalWindow";
import { AppShellProviders } from "./app/appShellContexts";
import { useAppShellSlices } from "./hooks/useAppShellSlices";
import { useSettings } from "./hooks/useSettings";
import { useWorkspaceManager } from "./hooks/useWorkspaceManager";
import { useI18n } from "./i18n";
import {
  loadTerminalSettings,
  subscribeTerminalSettings,
  syncTerminalSettingsToMain,
} from "./terminalWindow/terminalSettings";

function useAsyncShell() {
  return window.maiShell;
}

export type LayoutMode = ShellLayoutMode;

export default function App({
  appSurface,
  browserWindow = false,
  initialThemeSnapshot = null,
  terminalWindow = false,
  terminalStartPage = false,
}: {
  appSurface?: LayoutMode;
  browserWindow?: boolean;
  initialThemeSnapshot?: InitialWindowThemeSnapshot | null;
  terminalWindow?: boolean;
  terminalStartPage?: boolean;
} = {}) {
  const shell = useAsyncShell();
  const layoutPinnedBySurface = appSurface !== undefined;
  const shellLsPrefix = appSurface === "editor" ? "void-shell:editor:" : "";
  const shellLayoutStorageKey = `${shellLsPrefix}${DEFAULT_SHELL_LAYOUT_MODE_KEY}`;
  const sidebarLayoutStorageKey = `${shellLsPrefix}${DEFAULT_SIDEBAR_LAYOUT_KEY}`;

  useEffect(() => {
    if (!shell) {
      return;
    }
    syncTerminalSettingsToMain(loadTerminalSettings());
    return subscribeTerminalSettings(() => {
      syncTerminalSettingsToMain(loadTerminalSettings());
    });
  }, [shell]);

  const { t, setLocale, locale } = useI18n();
  const workspaceManager = useWorkspaceManager(shell);
  const settings = useSettings(shell, workspaceManager.workspace, t);

  const {
    chromeCoreSlice,
    chromeLayoutSlice,
    chromeThemeSlice,
    workspaceSlice,
    settingsSlice,
  } = useAppShellSlices({
    appSurface,
    initialThemeSnapshot,
    layoutPinnedBySurface,
    locale,
    setLocale,
    settings,
    shell,
    shellLayoutStorageKey,
    sidebarLayoutStorageKey,
    t,
    workspaceManager,
  });

  return (
    <AppShellProviders
      chromeCore={chromeCoreSlice}
      chromeLayout={chromeLayoutSlice}
      chromeTheme={chromeThemeSlice}
      settings={settingsSlice}
      workspace={workspaceSlice}
    >
      {terminalWindow ? (
        <AppTerminalWindow terminalStartPage={terminalStartPage} />
      ) : browserWindow ? (
        <AppBrowserWindow />
      ) : (
        <AppMainWorkspace />
      )}
    </AppShellProviders>
  );
}
