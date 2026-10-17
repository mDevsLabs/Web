import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppShellChromeCoreValue,
  AppShellChromeLayoutValue,
  AppShellChromeThemeValue,
  AppShellSettingsValue,
  AppShellWorkspaceValue,
} from "../app/appShellContexts";
import type { ShellLayoutMode } from "../app/shellLayoutStorage";
import {
  type AppAppearanceSettings,
  applyAppearanceSettingsToDom,
  applyThemePresetToAppearance,
  defaultAppearanceSettings,
  nativeWindowChromeFromAppearance,
  replaceBuiltinChromeColorsForScheme,
  shouldMigrateChromeWhenLeavingScheme,
} from "../appearanceSettings";
import {
  type AppColorMode,
  getVoidMonacoTheme,
  readStoredColorMode,
} from "../colorMode";
import type { AppLocale, TFunction } from "../i18n";
import {
  type InitialWindowThemeSnapshot,
  persistInitialWindowThemeSnapshot,
} from "../initialWindowTheme";
import { useAppColorScheme } from "../useAppColorScheme";
import type { useSettings } from "./useSettings";

type SettingsHook = ReturnType<typeof useSettings>;

export type UseAppShellSlicesParams = {
  shell: NonNullable<Window["maiShell"]> | undefined;
  t: TFunction;
  setLocale: (locale: AppLocale) => void;
  locale: AppLocale;

  initialThemeSnapshot: InitialWindowThemeSnapshot | null;

  layoutPinnedBySurface: boolean;
  appSurface: ShellLayoutMode | undefined;
  shellLayoutStorageKey: string;
  sidebarLayoutStorageKey: string;

  workspaceManager: AppShellWorkspaceValue;
  settings: SettingsHook;
};

export type UseAppShellSlicesResult = {
  chromeCoreSlice: AppShellChromeCoreValue;
  chromeLayoutSlice: AppShellChromeLayoutValue;
  chromeThemeSlice: AppShellChromeThemeValue;
  workspaceSlice: AppShellWorkspaceValue;
  settingsSlice: AppShellSettingsValue;

  colorMode: AppColorMode;
  setColorMode: Dispatch<SetStateAction<AppColorMode>>;
  appearanceSettings: AppAppearanceSettings;
  setAppearanceSettings: Dispatch<SetStateAction<AppAppearanceSettings>>;
  effectiveScheme: "light" | "dark";
};

/**
 * 顶层 `App` 组件中 5 个 slice 的组装与跨 slice 的主题级联 effect。
 *
 * 行为与原 App 函数体一致：
 *  - 自管 colorMode + appearanceSettings + 主题切换迁移；
 *  - 主题级联 effect：
 *      1. effectiveScheme 变化时迁移 appearance（保留 themePreset 重算颜色，或对自定义主题保留必要的浅/深迁移）；
 *      2. 同步 DOM CSS 变量 + 持久化窗口外观快照 + 通过 IPC 写入主进程 chrome；
 *  - 5 个 useMemo slice 按"窄 context"原则切分，避免 git 大对象更新触发外围组件重渲染。
 */
export function useAppShellSlices(
  params: UseAppShellSlicesParams
): UseAppShellSlicesResult {
  const {
    shell,
    t,
    setLocale,
    locale,
    initialThemeSnapshot,
    layoutPinnedBySurface,
    appSurface,
    shellLayoutStorageKey,
    sidebarLayoutStorageKey,
    workspaceManager,
    settings,
  } = params;

  const [colorMode, setColorMode] = useState<AppColorMode>(
    () => initialThemeSnapshot?.colorMode ?? readStoredColorMode()
  );
  const [appearanceSettings, setAppearanceSettings] =
    useState<AppAppearanceSettings>(
      () =>
        initialThemeSnapshot?.appearanceSettings ?? defaultAppearanceSettings()
    );
  const { effectiveScheme, setTransitionOrigin } = useAppColorScheme({
    colorMode,
  });
  const monacoChromeTheme = getVoidMonacoTheme(effectiveScheme);

  const effectiveSchemePrevRef = useRef(effectiveScheme);
  const shellRef = useRef(shell);
  shellRef.current = shell;

  useEffect(() => {
    const prevScheme = effectiveSchemePrevRef.current;
    if (prevScheme !== effectiveScheme) {
      effectiveSchemePrevRef.current = effectiveScheme;
      setAppearanceSettings((cur) => {
        if (cur.themePresetId !== "custom") {
          const next = applyThemePresetToAppearance(
            cur,
            cur.themePresetId,
            effectiveScheme
          );
          const s = shellRef.current;
          if (s) {
            queueMicrotask(() => {
              void s.invoke("settings:set", {
                ui: {
                  accentColor: next.accentColor,
                  backgroundColor: next.backgroundColor,
                  contrast: next.contrast,
                  foregroundColor: next.foregroundColor,
                  themePresetId: next.themePresetId,
                  translucentSidebar: next.translucentSidebar,
                },
              });
            });
          }
          return next;
        }
        if (!shouldMigrateChromeWhenLeavingScheme(cur, prevScheme)) {
          return cur;
        }
        const next = replaceBuiltinChromeColorsForScheme(cur, effectiveScheme);
        const s = shellRef.current;
        if (s) {
          queueMicrotask(() => {
            void s.invoke("settings:set", {
              ui: {
                accentColor: next.accentColor,
                backgroundColor: next.backgroundColor,
                contrast: next.contrast,
                foregroundColor: next.foregroundColor,
                themePresetId: next.themePresetId,
                translucentSidebar: next.translucentSidebar,
              },
            });
          });
        }
        return next;
      });
    }
  }, [effectiveScheme]);

  // 合并 appearanceSettings 相关的 DOM 更新，减少级联渲染
  useEffect(() => {
    applyAppearanceSettingsToDom(appearanceSettings, effectiveScheme);
    persistInitialWindowThemeSnapshot({
      appearanceSettings,
      colorMode,
      effectiveScheme,
    });
    if (!shell) {
      return;
    }
    const c = nativeWindowChromeFromAppearance(
      appearanceSettings,
      effectiveScheme,
      {
        settingsPageOpen: settings.settingsPageOpen,
      }
    );
    void shell.invoke("theme:applyChrome", {
      backgroundColor: c.backgroundColor,
      scheme: effectiveScheme,
      symbolColor: c.symbolColor,
      titleBarColor: c.titleBarColor,
    });
  }, [
    shell,
    colorMode,
    appearanceSettings,
    effectiveScheme,
    settings.settingsPageOpen,
  ]);

  const [ipcOk, setIpcOk] = useState<string>("…");

  const {
    workspace,
    setWorkspace,
    workspaceFileListRef,
    workspaceFileListVersion,
    ensureWorkspaceFileListLoaded,
    searchFiles,
    homeRecents,
    setHomeRecents,
    folderRecents,
    setFolderRecents,
    workspaceAliases,
    setWorkspaceAliases,
    hiddenAgentWorkspacePaths,
    setHiddenAgentWorkspacePaths,
    collapsedAgentWorkspacePaths,
    setCollapsedAgentWorkspacePaths,
  } = workspaceManager;

  const {
    modelProviders,
    defaultModel,
    modelEntries,
    enabledModelIds,
    thinkingByModelId,
    setThinkingByModelId,
    providerIdentity,
    setProviderIdentity,
    hasSelectedModel,
    modelPickerItems,
    modelPillLabel,
    agentCustomization,
    setAgentCustomization,
    refreshWorkspaceDiskSkills,
    mergedAgentCustomization,
    onChangeMergedAgentCustomization,
    editorSettings,
    setEditorSettings,
    mcpServers,
    setMcpServers,
    mcpStatuses,
    setMcpStatuses,
    settingsPageOpen,
    setSettingsPageOpen,
    settingsInitialNav,
    settingsOpenPending,
    openSettingsPage: openSettingsPageBase,
    onPickDefaultModel,
    onChangeModelEntries,
    onChangeModelProviders,
    onRefreshMcpStatuses,
    onStartMcpServer,
    onStopMcpServer,
    onRestartMcpServer,
    applyLoadedSettings,
    teamSettings,
    setTeamSettings,
    botIntegrations,
    setBotIntegrations,
    maiAccount,
    setMaiAccount,
    maiAccountModalOpen,
    setMaiAccountModalOpen,
    openMaiAccountModal,
    closeMaiAccountModal,
  } = settings;

  const chromeCoreSlice = useMemo(
    (): AppShellChromeCoreValue => ({ locale, setLocale, shell, t }),
    [shell, t, setLocale, locale]
  );

  const chromeLayoutSlice = useMemo(
    (): AppShellChromeLayoutValue => ({
      appSurface,
      ipcOk,
      layoutPinnedBySurface,
      setIpcOk,
      shellLayoutStorageKey,
      sidebarLayoutStorageKey,
    }),
    [
      ipcOk,
      setIpcOk,
      layoutPinnedBySurface,
      appSurface,
      shellLayoutStorageKey,
      sidebarLayoutStorageKey,
    ]
  );

  const chromeThemeSlice = useMemo(
    (): AppShellChromeThemeValue => ({
      appearanceSettings,
      colorMode,
      effectiveScheme,
      monacoChromeTheme,
      setAppearanceSettings,
      setColorMode,
      setTransitionOrigin,
    }),
    [
      colorMode,
      setColorMode,
      appearanceSettings,
      setAppearanceSettings,
      effectiveScheme,
      setTransitionOrigin,
      monacoChromeTheme,
    ]
  );

  const workspaceSlice = useMemo(
    (): AppShellWorkspaceValue => ({
      collapsedAgentWorkspacePaths,
      ensureWorkspaceFileListLoaded,
      folderRecents,
      hiddenAgentWorkspacePaths,
      homeRecents,
      searchFiles,
      setCollapsedAgentWorkspacePaths,
      setFolderRecents,
      setHiddenAgentWorkspacePaths,
      setHomeRecents,
      setWorkspace,
      setWorkspaceAliases,
      workspace,
      workspaceAliases,
      workspaceFileListRef,
      workspaceFileListVersion,
    }),
    [
      workspace,
      setWorkspace,
      workspaceFileListRef,
      workspaceFileListVersion,
      ensureWorkspaceFileListLoaded,
      searchFiles,
      homeRecents,
      setHomeRecents,
      folderRecents,
      setFolderRecents,
      workspaceAliases,
      setWorkspaceAliases,
      hiddenAgentWorkspacePaths,
      setHiddenAgentWorkspacePaths,
      collapsedAgentWorkspacePaths,
      setCollapsedAgentWorkspacePaths,
    ]
  );

  const settingsSlice = useMemo(
    (): AppShellSettingsValue => ({
      agentCustomization,
      applyLoadedSettings,
      botIntegrations,
      closeMaiAccountModal,
      defaultModel,
      editorSettings,
      enabledModelIds,
      hasSelectedModel,
      maiAccount,
      maiAccountModalOpen,
      mcpServers,
      mcpStatuses,
      mergedAgentCustomization,
      modelEntries,
      modelPickerItems,
      modelPillLabel,
      modelProviders,
      onChangeMergedAgentCustomization,
      onChangeModelEntries,
      onChangeModelProviders,
      onPickDefaultModel,
      onRefreshMcpStatuses,
      onRestartMcpServer,
      onStartMcpServer,
      onStopMcpServer,
      openMaiAccountModal,
      openSettingsPageBase,
      providerIdentity,
      refreshWorkspaceDiskSkills,
      setAgentCustomization,
      setBotIntegrations,
      setEditorSettings,
      setMaiAccount,
      setMaiAccountModalOpen,
      setMcpServers,
      setMcpStatuses,
      setProviderIdentity,
      setSettingsPageOpen,
      setTeamSettings,
      setThinkingByModelId,
      settingsInitialNav,
      settingsOpenPending,
      settingsPageOpen,
      teamSettings,
      thinkingByModelId,
    }),
    [
      modelProviders,
      defaultModel,
      modelEntries,
      enabledModelIds,
      thinkingByModelId,
      setThinkingByModelId,
      providerIdentity,
      setProviderIdentity,
      hasSelectedModel,
      modelPickerItems,
      modelPillLabel,
      agentCustomization,
      setAgentCustomization,
      refreshWorkspaceDiskSkills,
      mergedAgentCustomization,
      onChangeMergedAgentCustomization,
      botIntegrations,
      setBotIntegrations,
      maiAccount,
      setMaiAccount,
      maiAccountModalOpen,
      setMaiAccountModalOpen,
      openMaiAccountModal,
      closeMaiAccountModal,
      editorSettings,
      setEditorSettings,
      mcpServers,
      setMcpServers,
      mcpStatuses,
      setMcpStatuses,
      settingsPageOpen,
      setSettingsPageOpen,
      settingsInitialNav,
      settingsOpenPending,
      openSettingsPageBase,
      onPickDefaultModel,
      onChangeModelEntries,
      onChangeModelProviders,
      onRefreshMcpStatuses,
      onStartMcpServer,
      onStopMcpServer,
      onRestartMcpServer,
      applyLoadedSettings,
      teamSettings,
      setTeamSettings,
    ]
  );

  return {
    appearanceSettings,
    chromeCoreSlice,
    chromeLayoutSlice,
    chromeThemeSlice,
    colorMode,
    effectiveScheme,
    setAppearanceSettings,
    setColorMode,
    settingsSlice,
    workspaceSlice,
  };
}
