import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
} from "react";
import type { AppAppearanceSettings } from "../appearanceSettings";
import type { AppColorMode, ThemeTransitionOrigin } from "../colorMode";
import { useGitIntegration } from "../hooks/useGitIntegration";
import type { useSettings } from "../hooks/useSettings";
import type { useWorkspaceManager } from "../hooks/useWorkspaceManager";
import type { AppLocale, TFunction } from "../i18n";
import type { ShellLayoutMode } from "./shellLayoutStorage";

type SettingsHook = ReturnType<typeof useSettings>;

/** Chrome 核心：shell / i18n — 绝大多数叶组件只订阅这三个字段 */
export type AppShellChromeCoreValue = {
  shell: Window["maiShell"];
  t: TFunction;
  setLocale: (locale: AppLocale) => void;
  locale: AppLocale;
};

/** Chrome 布局：ipc 握手状态与 shell 布局标记 */
export type AppShellChromeLayoutValue = {
  ipcOk: string;
  setIpcOk: Dispatch<SetStateAction<string>>;
  layoutPinnedBySurface: boolean;
  appSurface: ShellLayoutMode | undefined;
  shellLayoutStorageKey: string;
  sidebarLayoutStorageKey: string;
};

/** Chrome 主题：颜色模式、外观偏好、主题切换动画 */
export type AppShellChromeThemeValue = {
  colorMode: AppColorMode;
  setColorMode: Dispatch<SetStateAction<AppColorMode>>;
  appearanceSettings: AppAppearanceSettings;
  setAppearanceSettings: Dispatch<SetStateAction<AppAppearanceSettings>>;
  effectiveScheme: "light" | "dark";
  setTransitionOrigin: (origin?: ThemeTransitionOrigin) => void;
  monacoChromeTheme: "void-light" | "void-dark";
};

/** 合并视图；保留以兼容 `useAppShellChrome()` 的既有消费者。新代码应直接用三个窄 hook。 */
export type AppShellChromeValue = AppShellChromeCoreValue &
  AppShellChromeLayoutValue &
  AppShellChromeThemeValue;

export type AppShellWorkspaceValue = ReturnType<typeof useWorkspaceManager>;

export type AppShellGitValue = ReturnType<typeof useGitIntegration>;

/** 回调与 setter：引用在 fullStatus 前后保持稳定，仅订阅此层的组件不会在 Git 大对象更新时重渲 */
export type AppShellGitActionsValue = Pick<
  AppShellGitValue,
  | "refreshGit"
  | "onGitBranchListFresh"
  | "setGitActionError"
  | "setGitBranchPickerOpen"
>;

/** 分支/列表/可用性等中等体积状态 */
export type AppShellGitMetaValue = Pick<
  AppShellGitValue,
  | "gitBranch"
  | "gitLines"
  | "gitStatusOk"
  | "gitBranchList"
  | "gitBranchListCurrent"
  | "diffLoading"
  | "gitActionError"
  | "treeEpoch"
  | "gitBranchPickerOpen"
>;

/** 工作区路径状态与 diff 预览等大对象 */
export type AppShellGitFilesValue = Pick<
  AppShellGitValue,
  | "gitPathStatus"
  | "gitChangedPaths"
  | "diffPreviews"
  | "diffTotals"
  | "loadGitDiffPreviews"
>;

export type AppShellSettingsValue = Pick<
  SettingsHook,
  | "modelProviders"
  | "defaultModel"
  | "modelEntries"
  | "enabledModelIds"
  | "thinkingByModelId"
  | "setThinkingByModelId"
  | "providerIdentity"
  | "setProviderIdentity"
  | "hasSelectedModel"
  | "modelPickerItems"
  | "modelPillLabel"
  | "agentCustomization"
  | "setAgentCustomization"
  | "refreshWorkspaceDiskSkills"
  | "mergedAgentCustomization"
  | "onChangeMergedAgentCustomization"
  | "editorSettings"
  | "setEditorSettings"
  | "mcpServers"
  | "setMcpServers"
  | "mcpStatuses"
  | "setMcpStatuses"
  | "settingsPageOpen"
  | "setSettingsPageOpen"
  | "settingsInitialNav"
  | "settingsOpenPending"
  | "onPickDefaultModel"
  | "onChangeModelEntries"
  | "onChangeModelProviders"
  | "onRefreshMcpStatuses"
  | "onStartMcpServer"
  | "onStopMcpServer"
  | "onRestartMcpServer"
  | "applyLoadedSettings"
  | "teamSettings"
  | "setTeamSettings"
  | "botIntegrations"
  | "setBotIntegrations"
  | "maiAccount"
  | "setMaiAccount"
  | "maiAccountModalOpen"
  | "setMaiAccountModalOpen"
  | "openMaiAccountModal"
  | "closeMaiAccountModal"
> & { openSettingsPageBase: SettingsHook["openSettingsPage"] };

export type AppShellFoundationMerged = AppShellChromeValue &
  AppShellWorkspaceValue &
  AppShellGitValue &
  AppShellSettingsValue;

const AppShellChromeCoreContext = createContext<AppShellChromeCoreValue | null>(
  null
);
const AppShellChromeLayoutContext =
  createContext<AppShellChromeLayoutValue | null>(null);
const AppShellChromeThemeContext =
  createContext<AppShellChromeThemeValue | null>(null);
const AppShellWorkspaceContext = createContext<AppShellWorkspaceValue | null>(
  null
);
const AppShellGitActionsContext = createContext<AppShellGitActionsValue | null>(
  null
);
const AppShellGitMetaContext = createContext<AppShellGitMetaValue | null>(null);
const AppShellGitFilesContext = createContext<AppShellGitFilesValue | null>(
  null
);
const AppShellSettingsContext = createContext<AppShellSettingsValue | null>(
  null
);

export function useAppShellChromeCore(): AppShellChromeCoreValue {
  const v = useContext(AppShellChromeCoreContext);
  if (!v) {
    throw new Error("useAppShellChromeCore: missing provider");
  }
  return v;
}

export function useAppShellChromeLayout(): AppShellChromeLayoutValue {
  const v = useContext(AppShellChromeLayoutContext);
  if (!v) {
    throw new Error("useAppShellChromeLayout: missing provider");
  }
  return v;
}

export function useAppShellChromeTheme(): AppShellChromeThemeValue {
  const v = useContext(AppShellChromeThemeContext);
  if (!v) {
    throw new Error("useAppShellChromeTheme: missing provider");
  }
  return v;
}

/**
 * 合并订阅：等价于订阅三层 Chrome context。仅适合仍需全量 Chrome 的遗留消费者；
 * 新代码请直接使用 `useAppShellChromeCore` / `useAppShellChromeLayout` / `useAppShellChromeTheme`。
 */
export function useAppShellChrome(): AppShellChromeValue {
  const core = useAppShellChromeCore();
  const layout = useAppShellChromeLayout();
  const theme = useAppShellChromeTheme();
  return useMemo(
    (): AppShellChromeValue => ({ ...core, ...layout, ...theme }),
    [core, layout, theme]
  );
}

export function useAppShellWorkspace(): AppShellWorkspaceValue {
  const v = useContext(AppShellWorkspaceContext);
  if (!v) {
    throw new Error("useAppShellWorkspace: missing provider");
  }
  return v;
}

export function useAppShellGitActions(): AppShellGitActionsValue {
  const v = useContext(AppShellGitActionsContext);
  if (!v) {
    throw new Error("useAppShellGitActions: missing provider");
  }
  return v;
}

export function useAppShellGitMeta(): AppShellGitMetaValue {
  const v = useContext(AppShellGitMetaContext);
  if (!v) {
    throw new Error("useAppShellGitMeta: missing provider");
  }
  return v;
}

export function useAppShellGitFiles(): AppShellGitFilesValue {
  const v = useContext(AppShellGitFilesContext);
  if (!v) {
    throw new Error("useAppShellGitFiles: missing provider");
  }
  return v;
}

/** 合并订阅；仅适合仍需全量 Git 的叶组件，避免在根工作区组件上使用。 */
export function useAppShellGit(): AppShellGitValue {
  const actions = useAppShellGitActions();
  const meta = useAppShellGitMeta();
  const files = useAppShellGitFiles();
  return useMemo(
    (): AppShellGitValue => ({
      ...actions,
      ...meta,
      ...files,
    }),
    [actions, meta, files]
  );
}

export function useAppShellSettings(): AppShellSettingsValue {
  const v = useContext(AppShellSettingsContext);
  if (!v) {
    throw new Error("useAppShellSettings: missing provider");
  }
  return v;
}

/**
 * Git 状态挂在 Workspace 之下，避免 fullStatus 等更新时整棵根 App 重跑。
 * 拆成 Actions / Meta / Files 三层：Actions 的 Context value 在 fullStatus 前后保持同一引用，仅订阅 Actions 的子树可跳过 reconcile。
 */
function AppShellGitContextBridge(props: {
  settings: AppShellSettingsValue;
  children: ReactNode;
}) {
  const { settings, children } = props;
  const { shell } = useAppShellChromeCore();
  const { workspace } = useAppShellWorkspace();
  const {
    gitBranch,
    gitLines,
    gitPathStatus,
    gitChangedPaths,
    gitStatusOk,
    gitBranchList,
    gitBranchListCurrent,
    diffPreviews,
    diffLoading,
    gitActionError,
    setGitActionError,
    treeEpoch,
    gitBranchPickerOpen,
    setGitBranchPickerOpen,
    diffTotals,
    refreshGit,
    loadGitDiffPreviews,
    onGitBranchListFresh,
  } = useGitIntegration(shell, workspace);

  const gitActionsValue = useMemo(
    (): AppShellGitActionsValue => ({
      onGitBranchListFresh,
      refreshGit,
      setGitActionError,
      setGitBranchPickerOpen,
    }),
    [
      refreshGit,
      onGitBranchListFresh,
      setGitActionError,
      setGitBranchPickerOpen,
    ]
  );

  const gitMetaValue = useMemo(
    (): AppShellGitMetaValue => ({
      diffLoading,
      gitActionError,
      gitBranch,
      gitBranchList,
      gitBranchListCurrent,
      gitBranchPickerOpen,
      gitLines,
      gitStatusOk,
      treeEpoch,
    }),
    [
      gitBranch,
      gitLines,
      gitStatusOk,
      gitBranchList,
      gitBranchListCurrent,
      diffLoading,
      gitActionError,
      treeEpoch,
      gitBranchPickerOpen,
    ]
  );

  const gitFilesValue = useMemo(
    (): AppShellGitFilesValue => ({
      diffPreviews,
      diffTotals,
      gitChangedPaths,
      gitPathStatus,
      loadGitDiffPreviews,
    }),
    [
      gitPathStatus,
      gitChangedPaths,
      diffPreviews,
      diffTotals,
      loadGitDiffPreviews,
    ]
  );

  return (
    <AppShellGitActionsContext.Provider value={gitActionsValue}>
      <AppShellGitMetaContext.Provider value={gitMetaValue}>
        <AppShellGitFilesContext.Provider value={gitFilesValue}>
          <AppShellSettingsContext.Provider value={settings}>
            {children}
          </AppShellSettingsContext.Provider>
        </AppShellGitFilesContext.Provider>
      </AppShellGitMetaContext.Provider>
    </AppShellGitActionsContext.Provider>
  );
}

export function AppShellProviders(props: {
  chromeCore: AppShellChromeCoreValue;
  chromeLayout: AppShellChromeLayoutValue;
  chromeTheme: AppShellChromeThemeValue;
  workspace: AppShellWorkspaceValue;
  settings: AppShellSettingsValue;
  children: ReactNode;
}) {
  const {
    chromeCore,
    chromeLayout,
    chromeTheme,
    workspace,
    settings,
    children,
  } = props;
  return (
    <AppShellChromeCoreContext.Provider value={chromeCore}>
      <AppShellChromeLayoutContext.Provider value={chromeLayout}>
        <AppShellChromeThemeContext.Provider value={chromeTheme}>
          <AppShellWorkspaceContext.Provider value={workspace}>
            <AppShellGitContextBridge settings={settings}>
              {children}
            </AppShellGitContextBridge>
          </AppShellWorkspaceContext.Provider>
        </AppShellChromeThemeContext.Provider>
      </AppShellChromeLayoutContext.Provider>
    </AppShellChromeCoreContext.Provider>
  );
}
