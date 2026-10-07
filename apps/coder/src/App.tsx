import type { editor as MonacoEditorNS } from "monaco-editor";
import {
  lazy,
  memo,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { agentChangeKeyFromDiff } from "./agentChatSegments";
import {
  normalizeWorkspaceRelPath,
  workspaceRelPathsEqual,
} from "./agentFileChangesFromGit";
import {
  clearPersistedAgentFileChanges,
  hashAgentAssistantContent,
  readPersistedAgentFileChanges,
} from "./agentFileChangesPersist";
import { normalizeAppearanceSettings } from "./appearanceSettings";
import { ChatMarkdown } from "./ChatMarkdown";
// modelCatalog types are re-exported via useSettings hook return type
import type { ComposerMode } from "./ComposerPlusMenu";
import {
  readPrefersDark,
  readStoredColorMode,
  resolveEffectiveScheme,
  writeStoredColorMode,
} from "./colorMode";
import { getAtMentionRange } from "./composerAtMention";
import { textBeforeCaretForAt } from "./composerRichDom";
import {
  getLeadingWizardCommand,
  newSegmentId,
  segmentsToWireText,
  segmentsTrimmedEmpty,
  userMessageToSegments,
} from "./composerSegments";
import {
  computeComposerContextUsedEstimate,
  DEFAULT_CONTEXT_WINDOW_TOKENS_UI,
} from "./contextMeterFormat";
import type { InitialWindowThemeSnapshot } from "./initialWindowTheme";
import type {
  AgentPendingPatch,
  AutoUpdateStatus,
  ChatPlanExecutePayload,
  TurnTokenUsage,
} from "./ipcTypes";
import { partsToSegments, type UserMessagePart } from "./messageParts";
import { pendingPlanQuestionFromMessages } from "./planParser";
import {
  ALL_SETTINGS_NAV_IDS,
  type SettingsNavId,
  type SettingsPageProps,
} from "./SettingsPage";
import {
  type AtComposerSlot,
  useComposerAtMention,
} from "./useComposerAtMention";
import { useComposerSkillInvoke } from "./useComposerSkillInvoke";
import { useComposerSlashCommand } from "./useComposerSlashCommand";

const EMPTY_AGENT_PENDING_PATCHES: AgentPendingPatch[] = [];
const EMPTY_SNAPSHOT_PATHS: ReadonlySet<string> = new Set<string>();

const CAPTURE_ANALYSIS_MODE_LABELS: Record<string, string> = {
  "api-reverse": "API reverse",
  auto: "Auto-detect",
  "crypto-reverse": "Crypto reverse",
  performance: "Performance",
  "security-audit": "Security audit",
};

function safeHostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

import { AppProvider } from "./AppContext";
import type { AgentUserInputRequest } from "./agentSessionTypes";
import { AgentAgentCenterColumn } from "./app/AgentAgentCenterColumn";
import { AgentSidebarThreadItem } from "./app/AgentSidebarThreadItem";
import { AppShellMenubar } from "./app/AppShellMenubar";
import { AppShellOverlays } from "./app/AppShellOverlays";
import { AppWorkspaceWelcome } from "./app/AppWorkspaceWelcome";
import {
  isAgentWorkspaceCollapsed,
  selectAgentSidebarThreadPaths,
} from "./app/agentSidebarWorkspaceList";
import {
  AppShellProviders,
  useAppShellChromeCore,
  useAppShellChromeLayout,
  useAppShellChromeTheme,
  useAppShellGitActions,
  useAppShellGitFiles,
  useAppShellGitMeta,
  useAppShellSettings,
  useAppShellWorkspace,
} from "./app/appShellContexts";
import { runDesktopShellInit } from "./app/desktopShellInit";
import type {
  ShellCenterRightGroupProps,
  ShellLeftRailGroupProps,
} from "./app/ShellWorkspaceColumns";
import { ShellWorkspaceGrid } from "./app/ShellWorkspaceGrid";
import {
  clampSidebarLayout,
  DEFAULT_SHELL_LAYOUT_MODE_KEY,
  DEFAULT_SIDEBAR_LAYOUT_KEY,
  readSidebarLayout,
  type ShellLayoutMode,
} from "./app/shellLayoutStorage";
import { ThreadItem } from "./app/ThreadItem";
import { displayThreadTitle } from "./app/threadRowUi";
import {
  readStoredWorkspaceLauncher,
  type WorkspaceLauncherTool,
  workspaceLauncherLabel,
} from "./app/workspaceLaunchers";
import type { ComposerAnchorSlot } from "./ChatComposer";
import { ComposerActionsProvider } from "./ComposerActionsContext";
import { DevProfiler } from "./devProfiler";
import { useAgentChatPanelProps } from "./hooks/useAgentChatPanelProps";
import { useAgentFileReview } from "./hooks/useAgentFileReview";
import { useAgentLeftSidebarProps } from "./hooks/useAgentLeftSidebarProps";
import { useAgentPatchActions } from "./hooks/useAgentPatchActions";
import { useAgentRightSidebarProps } from "./hooks/useAgentRightSidebarProps";
import { useAgentSession } from "./hooks/useAgentSession";
import { useAgentSessionActions } from "./hooks/useAgentSessionActions";
import { useAgentSidebarFilePreview } from "./hooks/useAgentSidebarFilePreview";
import { useAppShellSlices } from "./hooks/useAppShellSlices";
import { useComposer } from "./hooks/useComposer";
import { useComposerAttachments } from "./hooks/useComposerAttachments";
import { useEditCommands } from "./hooks/useEditCommands";
import { useEditorCenterDerived } from "./hooks/useEditorCenterDerived";
import { useEditorMainPanelProps } from "./hooks/useEditorMainPanelProps";
import {
  clampEditorTerminalHeight,
  type EditorInlineDiffState,
  useEditorTabs,
} from "./hooks/useEditorTabs";
import {
  type AgentConversationFileOpenOptions,
  useFileOperations,
} from "./hooks/useFileOperations";
import { useLayoutWindows } from "./hooks/useLayoutWindows";
import { useMenubarMenuReducer } from "./hooks/useMenubarMenuReducer";
import { useMessagesScroll } from "./hooks/useMessagesScroll";
import { usePlanSystem } from "./hooks/usePlanSystem";
import { usePlanWizardActions } from "./hooks/usePlanWizardActions";
import { useResizeRails } from "./hooks/useResizeRails";
import { useSettings } from "./hooks/useSettings";
import { useSettingsPersistence } from "./hooks/useSettingsPersistence";
import {
  useStreamingChat,
  useStreamingChatControls,
  useStreamingChatSubscription,
} from "./hooks/useStreamingChat";
import { useTeamSession } from "./hooks/useTeamSession";
import { useTeamSessionActions } from "./hooks/useTeamSessionActions";
import { useThreadActions } from "./hooks/useThreadActions";
import { useThreads } from "./hooks/useThreads";
import { useUiZoom } from "./hooks/useUiZoom";
import { useWizardPending } from "./hooks/useWizardPending";
import { useWizardSends } from "./hooks/useWizardSends";
import { useWorkspaceActions } from "./hooks/useWorkspaceActions";
import { useWorkspaceExplorerActions } from "./hooks/useWorkspaceExplorerActions";
import { useWorkspaceManager } from "./hooks/useWorkspaceManager";
import { MaiAccountModal } from "./MaiAccountModal";
import { isPlanMdPath } from "./planExecutedKey";
import { ensureDraftHasLiveBlocks } from "./streamInflightSnapshot";
import { streamingStore, useStreaming } from "./streamingStore";
import { TerminalWindowSurface } from "./TerminalWindowSurface";
import { buildTeamWorkflowItems } from "./teamWorkflowItems";
import {
  loadTerminalSettings,
  subscribeTerminalSettings,
  syncTerminalSettingsToMain,
} from "./terminalWindow/terminalSettings";
import type { ChatMessage, ThreadInfo } from "./threadTypes";
import { normWorkspaceRootKey } from "./workspaceRootKey";

const EditorMainPanel = lazy(() =>
  import("./EditorMainPanel").then((m) => ({ default: m.EditorMainPanel }))
);
const AgentBrowserWindowSurface = lazy(() =>
  import("./AgentBrowserWindowSurface").then((m) => ({
    default: m.AgentBrowserWindowSurface,
  }))
);

type LayoutMode = ShellLayoutMode;
type AgentRightSidebarView =
  | "git"
  | "plan"
  | "file"
  | "team"
  | "browser"
  | "agents";
type EditorLeftSidebarView = "explorer" | "search" | "git";

import { diffCreatesNewFile, sameStringArray } from "./appDiffUtils";
import { hideBootSplash } from "./bootSplash";
import { normalizeLocale, useI18n } from "./i18n";

function workspacePathDisplayName(full: string): string {
  const norm = full.replace(/\\/g, "/");
  const parts = norm.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? full;
}

function workspacePathParent(full: string): string {
  const norm = full.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  if (i <= 0) {
    return "";
  }
  return norm.slice(0, i);
}

function buildAutogeneratedCommitMessage(
  changedPaths: readonly string[]
): string {
  const paths = changedPaths.map((path) => path.trim()).filter(Boolean);
  if (paths.length === 0) {
    return "chore: update workspace changes";
  }
  const first = paths[0]!.split(/[\\/]/).filter(Boolean).pop() ?? paths[0]!;
  if (paths.length === 1) {
    return `chore: update ${first}`.slice(0, 72);
  }
  return `chore: update ${first} and ${paths.length - 1} more`.slice(0, 72);
}

function useAsyncShell() {
  return window.maiShell;
}

function isEditableDomTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

type OnSendOptions = {
  threadId?: string;
  modeOverride?: ComposerMode;
  modelIdOverride?: string;
  planExecute?: ChatPlanExecutePayload;
  /** 非空时在本轮 stream 成功 done 后标记该计划文件已执行 Build */
  planBuildPathKey?: string;
};

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

function AppTerminalWindow({
  terminalStartPage = false,
}: {
  terminalStartPage?: boolean;
}) {
  const { shell, t, setLocale } = useAppShellChromeCore();
  const { setColorMode, setAppearanceSettings } = useAppShellChromeTheme();

  useEffect(() => {
    if (!shell) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const settings = (await shell.invoke("settings:get")) as {
          language?: string;
          ui?: { colorMode?: string } & Record<string, unknown>;
        };
        if (cancelled) {
          return;
        }
        setLocale(normalizeLocale(settings.language));
        const colorMode =
          settings.ui?.colorMode === "light" ||
          settings.ui?.colorMode === "dark" ||
          settings.ui?.colorMode === "system"
            ? settings.ui.colorMode
            : readStoredColorMode();
        setColorMode(colorMode);
        const scheme = resolveEffectiveScheme(colorMode, readPrefersDark());
        setAppearanceSettings(normalizeAppearanceSettings(settings.ui, scheme));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell, setAppearanceSettings, setColorMode, setLocale]);

  useEffect(() => {
    hideBootSplash();
  }, []);

  return <TerminalWindowSurface forceStartPage={terminalStartPage} t={t} />;
}

function AppBrowserWindow() {
  const { shell, setLocale } = useAppShellChromeCore();
  const { setColorMode, setAppearanceSettings } = useAppShellChromeTheme();

  useEffect(() => {
    if (!shell) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const settings = (await shell.invoke("settings:get")) as {
          language?: string;
          ui?: {
            colorMode?: string;
          } & Record<string, unknown>;
        };
        if (cancelled) {
          return;
        }
        setLocale(normalizeLocale(settings.language));
        const colorMode =
          settings.ui?.colorMode === "light" ||
          settings.ui?.colorMode === "dark" ||
          settings.ui?.colorMode === "system"
            ? settings.ui.colorMode
            : readStoredColorMode();
        setColorMode(colorMode);
        const scheme = resolveEffectiveScheme(colorMode, readPrefersDark());
        setAppearanceSettings(normalizeAppearanceSettings(settings.ui, scheme));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell, setAppearanceSettings, setColorMode, setLocale]);

  return (
    <Suspense
      fallback={<div aria-busy="true" className="ref-browser-window-root" />}
    >
      <AgentBrowserWindowSurface />
    </Suspense>
  );
}

/**
 * 流式跟随滚动：订阅 streamingStore 的 streaming 字段，仅该子组件按 token 重渲染，
 * 粘底时每次 token 变化都调度一帧合并滚动，App 根不再因 streaming 重渲染。
 */
const MessagesScrollSync = memo(function MessagesScrollSync({
  hasConversation,
  pinMessagesToBottomRef,
  scheduleMessagesScrollToBottom,
  syncMessagesScrollIndicators,
}: {
  hasConversation: boolean;
  pinMessagesToBottomRef: RefObject<boolean>;
  scheduleMessagesScrollToBottom: () => void;
  syncMessagesScrollIndicators: () => void;
}) {
  const streaming = useStreaming();
  useLayoutEffect(() => {
    if (!hasConversation) return;
    if (pinMessagesToBottomRef.current) {
      scheduleMessagesScrollToBottom();
    }
    const rafId = requestAnimationFrame(() => {
      syncMessagesScrollIndicators();
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    hasConversation,
    streaming,
    pinMessagesToBottomRef,
    scheduleMessagesScrollToBottom,
    syncMessagesScrollIndicators,
  ]);
  return null;
});

function AppMainWorkspaceInner() {
  const { shell, t, setLocale, locale } = useAppShellChromeCore();
  const {
    ipcOk,
    setIpcOk,
    layoutPinnedBySurface,
    appSurface,
    shellLayoutStorageKey,
    sidebarLayoutStorageKey,
  } = useAppShellChromeLayout();
  const {
    colorMode,
    setColorMode,
    appearanceSettings,
    setAppearanceSettings,
    effectiveScheme,
    setTransitionOrigin,
    monacoChromeTheme,
  } = useAppShellChromeTheme();

  const {
    workspace,
    setWorkspace,
    workspaceFileListRef,
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
  } = useAppShellWorkspace();

  const [atFileIndexReadyTick, setAtFileIndexReadyTick] = useState(0);
  useEffect(() => {
    const sub = shell?.subscribeWorkspaceFileIndexReady;
    if (!sub || !workspace) {
      return;
    }
    return sub((rootNorm) => {
      const a = workspace.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
      const b = String(rootNorm)
        .replace(/\\/g, "/")
        .replace(/\/+$/, "")
        .toLowerCase();
      if (a === b) {
        setAtFileIndexReadyTick((k) => k + 1);
      }
    });
  }, [shell, workspace]);

  const { refreshGit, setGitActionError, setGitBranchPickerOpen } =
    useAppShellGitActions();
  const { gitStatusOk } = useAppShellGitMeta();
  const { gitChangedPaths, diffPreviews } = useAppShellGitFiles();

  /** Git 大对象经 ref 供长生命周期回调读取，避免 fullStatus 引用抖动连带 chat/composer props 失效 */
  const agentGitPackRef = useRef({
    diffPreviews,
    gitChangedPaths,
    gitStatusOk,
  });
  agentGitPackRef.current = { diffPreviews, gitChangedPaths, gitStatusOk };

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
    botIntegrations,
    setBotIntegrations,
    maiAccount,
    setMaiAccount,
    maiAccountModalOpen,
    openMaiAccountModal,
    closeMaiAccountModal,
  } = useAppShellSettings();

  const {
    threads,
    threadSearch,
    setThreadSearch,
    currentId,
    setCurrentId,
    currentIdRef,
    editingThreadId,
    setEditingThreadId,
    editingThreadTitleDraft,
    setEditingThreadTitleDraft,
    threadTitleDraftRef,
    threadTitleInputRef,
    confirmDeleteId,
    setConfirmDeleteId,
    confirmDeleteTimerRef,
    messages,
    setMessages,
    messagesRef,
    messagesThreadId,
    setMessagesThreadId,
    resendFromUserIndex,
    setResendFromUserIndex,
    resendIdxRef,
    threadNavigation,
    setThreadNavigation,
    skipThreadNavigationRecordRef,
    refreshThreads,
    refreshAgentSidebarThreads,
    sidebarThreadsByPathKey,
    loadMessages,
    cacheThreadStateForWorkspace,
    restoreThreadStateForWorkspace,
    getCachedThreadsForWorkspace,
    resetThreadState,
  } = useThreads(shell);

  /** onSelectThread 内读取最新值：工作区打开路径已 loadMessages 后避免同线程重复 IPC */
  const messagesThreadIdRef = useRef(messagesThreadId);
  messagesThreadIdRef.current = messagesThreadId;
  const [unreadAgentThreadIds, setUnreadAgentThreadIds] = useState<Set<string>>(
    () => new Set()
  );
  const markAgentThreadUnread = useCallback((threadId: string) => {
    setUnreadAgentThreadIds((prev) => {
      if (prev.has(threadId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(threadId);
      return next;
    });
  }, []);
  const clearAgentThreadUnread = useCallback((threadId: string) => {
    setUnreadAgentThreadIds((prev) => {
      if (!prev.has(threadId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(threadId);
      return next;
    });
  }, []);
  useEffect(() => {
    const shellApi = window.maiShell;
    if (!shellApi) {
      return;
    }
    const count = unreadAgentThreadIds.size;
    void (
      shellApi.setUnreadBadgeCount?.(count) ??
      shellApi.invoke("app:setUnreadBadgeCount", count)
    ).catch(() => {});
  }, [unreadAgentThreadIds]);

  // 开发环境：记录阻塞主线程 ≥50ms 的任务（与窗口拖动卡顿强相关）
  useEffect(() => {
    if (!import.meta.env.DEV || typeof PerformanceObserver === "undefined") {
      return;
    }
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < 50) {
            continue;
          }
          const lt = entry as PerformanceEntry & {
            attribution?: ReadonlyArray<{
              name?: string;
              containerType?: string;
            }>;
          };
          const attr = lt.attribution?.[0];
          console.warn(
            `[perf] longtask ${entry.duration.toFixed(0)}ms name=${entry.name}` +
              (attr?.name ? ` src=${attr.name}` : "")
          );
        }
      });
      obs.observe({
        buffered: true,
        type: "longtask",
      } as PerformanceObserverInit);
      return () => obs.disconnect();
    } catch {
      /* Long Task API 不可用 */
    }
  }, []);

  const [editingThreadWorkspacePath, setEditingThreadWorkspacePath] = useState<
    string | null
  >(null);
  // ─────────────────────────────────────────────────────────────────────────

  const {
    awaitingReply,
    streamingThreadId,
    setStreamingThreadId,
    thoughtSecondsByThread,
    subAgentBgToast,
    showTransientToast,
    beginStream,
    markFirstToken,
    recordThoughtSeconds,
    resetStreamingSession,
    clearInFlightIpcRouting,
    streamThreadRef,
    ipcInFlightChatThreadIdRef,
    ipcStreamNonceRef,
    offThreadStreamDraftsRef,
    streamStartedAtRef,
    firstTokenAtRef,
    setStreaming,
    setAwaitingReply,
  } = useStreamingChat();
  const {
    applyTeamPayload,
    getTeamSession,
    setSelectedTask,
    clearTeamSession,
    clearPendingQuestion: clearTeamPendingQuestion,
    clearPendingUserInput: clearTeamPendingUserInput,
    abortTeamSession,
    startTeamSession,
    restoreTeamSession,
    markTeamPlanProposalDecided,
  } = useTeamSession();
  const {
    restoreAgentSession,
    clearAgentSession,
    setSelectedAgent,
    getAgentSession,
  } = useAgentSession();
  const {
    agentReviewPendingByThread,
    setAgentReviewPendingByThread,
    agentReviewBusy,
    setAgentReviewBusy,
    fileChangesDismissed,
    setFileChangesDismissed,
    fileChangesDismissedRef,
    dismissedFiles,
    setDismissedFiles,
    dismissedFilesRef,
    revertedFiles,
    setRevertedFiles,
    revertedFilesRef,
    revertedChangeKeys,
    setRevertedChangeKeys,
    revertedChangeKeysRef,
    revertableSnapshotPaths,
    setRevertableSnapshotPaths,
    revertableSnapshotPathsRef,
    revertNotice,
    setRevertNotice,
    agentFilePreview,
    setAgentFilePreview,
    agentFilePreviewBusyPatch,
    setAgentFilePreviewBusyPatch,
    agentFilePreviewRequestRef,
    clearAgentReviewForThread,
    resetAgentReviewState,
  } = useAgentFileReview();

  const agentReviewPendingByThreadRef = useRef(agentReviewPendingByThread);
  agentReviewPendingByThreadRef.current = agentReviewPendingByThread;

  const {
    setParsedPlan,
    planFilePath,
    setPlanFilePath,
    planFileRelPath,
    setPlanFileRelPath,
    executedPlanKeys,
    setExecutedPlanKeys,
    planQuestion,
    setPlanQuestion,
    planQuestionRequestId,
    setPlanQuestionRequestId,
    planQuestionDismissedByThreadRef,
    agentPlanBuildModelId,
    setAgentPlanBuildModelId,
    editorPlanBuildModelId,
    setEditorPlanBuildModelId,
    editorPlanReviewDismissed,
    setEditorPlanReviewDismissed,
    planTodoDraftOpen,
    planTodoDraftText,
    setPlanTodoDraftText,
    planTodoDraftInputRef,
    planBuildPendingMarkerRef,
    agentPlanPreviewMarkdown,
    agentPlanEffectivePlan,
    agentPlanPreviewTitle,
    agentPlanDocumentMarkdown,
    agentPlanGoalMarkdown,
    agentPlanTodos,
    agentPlanTodoDoneCount,
    agentPlanGoalSummary,
    hasAgentPlanSidebarContent,
    planReviewIsBuilt,
    getLatestAgentPlan,
    onPlanTodoToggle,
    onPlanAddTodo,
    onPlanAddTodoCancel,
    onPlanAddTodoSubmit,
    onPlanQuestionSkip: recordPlanQuestionDismissed,
    resetPlanState,
  } = usePlanSystem(
    shell,
    currentId,
    currentIdRef,
    messages,
    messagesThreadId,
    messagesRef,
    workspace,
    defaultModel
  );

  const [rootUserInputRequestsByThread, setRootUserInputRequestsByThread] =
    useState<Record<string, AgentUserInputRequest>>({});
  const { wizardPending, setWizardPending } = useWizardPending();
  const [agentRightSidebarOpen, setAgentRightSidebarOpen] = useState(false);
  const [agentRightSidebarView, setAgentRightSidebarView] =
    useState<AgentRightSidebarView>("git");
  const [commitMsg, setCommitMsg] = useState("");
  const [lastTurnUsage, setLastTurnUsage] = useState<TurnTokenUsage | null>(
    null
  );
  const [layoutSwitchPending] = useTransition();
  const [layoutSwitchTarget, setLayoutSwitchTarget] =
    useState<LayoutMode | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<AutoUpdateStatus | null>(
    null
  );
  useEffect(() => {
    if (plusMenuOpen || modelPickerOpen) {
      setGitBranchPickerOpen(false);
    }
  }, [plusMenuOpen, modelPickerOpen, setGitBranchPickerOpen]);
  useEffect(() => {
    const unsubscribe = shell?.subscribeAutoUpdateStatus?.((status) => {
      if (status?.state === "downloaded") {
        setUpdateStatus(status as AutoUpdateStatus);
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [shell]);
  const onInstallUpdate = useCallback(() => {
    shell?.invoke("auto-update:install").catch(() => {
      /* ignore */
    });
  }, [shell]);
  const onOpenUpdateFolder = useCallback(() => {
    shell?.invoke("auto-update:open-folder").catch(() => {
      /* ignore */
    });
  }, [shell]);
  const {
    composerSegments,
    setComposerSegments,
    inlineResendSegments,
    setInlineResendSegments,
    composerMode,
    setComposerMode,
    composerAttachErr,
    setStreamingThinking,
    setStreamingToolPreview,
    streamingToolPreviewClearTimerRef,
    setLiveAssistantBlocks,
    toolApprovalRequest,
    setToolApprovalRequest,
    mistakeLimitRequest,
    setMistakeLimitRequest,
    clearStreamingToolPreviewNow,
    resetLiveAgentBlocks,
    flashComposerAttachErr,
    resetComposerState,
  } = useComposer();
  useEffect(() => {
    if (composerMode === "team") {
      setModelPickerOpen(false);
    }
  }, [composerMode]);

  /** 切回仍在后台运行的线程时，恢复暂停态；若有离屏累积草稿则一并铺回 UI */
  const restoreInFlightThreadUiIfNeeded = useCallback(
    (threadId: string) => {
      if (ipcInFlightChatThreadIdRef.current !== threadId) {
        return;
      }
      const draft = offThreadStreamDraftsRef.current[threadId];
      if (draft) {
        streamingStore.flush();
        setStreaming(draft.streaming);
        setStreamingThinking(draft.streamingThinking);
        const normalized = ensureDraftHasLiveBlocks(draft);
        setLiveAssistantBlocks(() =>
          structuredClone(normalized.liveAssistantBlocks)
        );
        delete offThreadStreamDraftsRef.current[threadId];
      }
      setAwaitingReply(true);
      setStreamingThreadId(threadId);
    },
    [
      setStreaming,
      setStreamingThinking,
      setLiveAssistantBlocks,
      setAwaitingReply,
      setStreamingThreadId,
    ]
  );

  const clearPlanQuestion = useCallback(() => {
    setPlanQuestion(null);
    setPlanQuestionRequestId(null);
  }, [setPlanQuestion, setPlanQuestionRequestId]);

  const setRootUserInputRequest = useCallback(
    (threadId: string, request: AgentUserInputRequest | null) => {
      if (!threadId) {
        return;
      }
      setRootUserInputRequestsByThread((prev) => {
        if (!request) {
          if (!prev[threadId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[threadId];
          return next;
        }
        return {
          ...prev,
          [threadId]: request,
        };
      });
    },
    []
  );

  const clearRootUserInputRequest = useCallback(
    (threadId?: string | null) => {
      if (!threadId) {
        setRootUserInputRequestsByThread({});
        return;
      }
      setRootUserInputRequest(threadId, null);
    },
    [setRootUserInputRequest]
  );

  const { sendMessage, abortActiveStream } = useStreamingChatControls({
    beginStream,
    clearAgentReviewForThread,
    clearInFlightIpcRouting,
    clearMistakeLimitRequest: () => setMistakeLimitRequest(null),
    clearPlanQuestion,
    clearRootUserInputRequest,
    clearStreamingToolPreviewNow,
    composerMode,
    currentId,
    defaultModel,
    flashComposerAttachErr,
    ipcInFlightChatThreadIdRef,
    loadMessages,
    modelEntries,
    offThreadStreamDraftsRef,
    planBuildPendingMarkerRef,
    refreshThreads,
    resendFromUserIndex,
    resetLiveAgentBlocks,
    resetStreamingSession,
    restoreAgentSession,
    setAwaitingReply,
    setComposerSegments,
    setCurrentId,
    setInlineResendSegments,
    setMessages,
    setResendFromUserIndex,
    setStreamingThinking,
    setStreamingThreadId,
    shell,
    startTeamSession,
    streamStartedAtRef,
    t,
    teamSettings,
  });

  useStreamingChatSubscription({
    applyTeamPayload,
    clearRootUserInputRequest,
    clearStreamingToolPreviewNow,
    composerMode,
    currentIdRef,
    ipcInFlightChatThreadIdRef,
    ipcStreamNonceRef,
    loadMessages,
    markFirstToken,
    markThreadUnread: markAgentThreadUnread,
    offThreadStreamDraftsRef,
    planBuildPendingMarkerRef,
    recordThoughtSeconds,
    refreshThreads,
    resetLiveAgentBlocks,
    resetStreamingSession,
    restoreAgentSession,
    setAgentReviewPendingByThread,
    setDismissedFiles,
    setExecutedPlanKeys,
    setFileChangesDismissed,
    setLastTurnUsage,
    setLiveAssistantBlocks,
    setMessages,
    setMistakeLimitRequest,
    setParsedPlan,
    setPlanFilePath,
    setPlanFileRelPath,
    setPlanQuestion,
    setPlanQuestionRequestId,
    setRootUserInputRequest,
    setStreaming,
    setStreamingThinking,
    setStreamingToolPreview,
    setToolApprovalRequest,
    shell,
    showTransientToast,
    streamingToolPreviewClearTimerRef,
    streamThreadRef,
    t,
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() =>
    layoutPinnedBySurface && appSurface ? appSurface : "agent"
  );
  const [layoutWindowAvailability, setLayoutWindowAvailability] = useState<
    Record<LayoutMode, boolean>
  >({
    agent: false,
    editor: false,
  });
  const [editorLeftSidebarView, setEditorLeftSidebarView] =
    useState<EditorLeftSidebarView>("explorer");
  const [editorExplorerCollapsed, setEditorExplorerCollapsed] = useState(false);
  const [editorSidebarSearchQuery, setEditorSidebarSearchQuery] = useState("");
  const editorSidebarSearchInputRef = useRef<HTMLInputElement>(null);
  const editorExplorerScrollRef = useRef<HTMLDivElement>(null);
  const scrollEditorExplorerToTop = useCallback(() => {
    const node = editorExplorerScrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = 0;
  }, []);
  const toggleEditorExplorerCollapsed = useCallback(() => {
    scrollEditorExplorerToTop();
    setEditorExplorerCollapsed((prev) => !prev);
    window.requestAnimationFrame(scrollEditorExplorerToTop);
  }, [scrollEditorExplorerToTop]);
  const [agentWorkspaceOrder, setAgentWorkspaceOrder] = useState<string[]>([]);
  const [uiZoom, setUiZoom] = useState(1);
  const {
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    filePath,
    setFilePath,
    editorValue,
    setEditorValue,
    editorInlineDiffByPath,
    setEditorInlineDiffByPath,
    saveToastKey,
    setSaveToastKey,
    saveToastVisible,
    setSaveToastVisible,
    editorTerminalVisible,
    setEditorTerminalVisible,
    editorTerminalHeightPx,
    setEditorTerminalHeightPx,
    editorTerminalSessions,
    setEditorTerminalSessions,
    activeEditorTerminalId,
    setActiveEditorTerminalId,
    monacoEditorRef,
    editorLoadRequestRef,
    pendingEditorHighlightRangeRef,
    editorTerminalHeightLsKey,
  } = useEditorTabs({ isolatedEditorSurface: appSurface === "editor" });
  const monacoDiffChangeDisposableRef = useRef<{ dispose(): void } | null>(
    null
  );
  useEffect(() => () => monacoDiffChangeDisposableRef.current?.dispose(), []);

  const [workspaceToolsOpen, setWorkspaceToolsOpen] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [quickOpenOpen, setQuickOpenOpen] = useState(false);
  const [quickOpenSeed, setQuickOpenSeed] = useState("");

  useEffect(() => {
    if (!quickOpenOpen || !workspace) {
      return;
    }
    void ensureWorkspaceFileListLoaded();
  }, [quickOpenOpen, workspace, ensureWorkspaceFileListLoaded]);
  const [, setSidebarSearchDraft] = useState("");
  const editorTerminalCreateLockRef = useRef(false);
  const terminalMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const windowMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const {
    fileMenuOpen,
    editMenuOpen,
    viewMenuOpen,
    windowMenuOpen,
    terminalMenuOpen,
    helpMenuOpen,
    menus: menubarMenus,
    toggleMenubarMenu,
    setMenubarMenu,
    setTerminalMenuOpen,
  } = useMenubarMenuReducer();
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [editorThreadHistoryOpen, setEditorThreadHistoryOpen] = useState(false);
  const [editorChatMoreOpen, setEditorChatMoreOpen] = useState(false);
  const editorHistoryMenuRef = useRef<HTMLDivElement>(null);
  const editorMoreMenuRef = useRef<HTMLDivElement>(null);
  const [homePath, setHomePath] = useState("");
  const [railWidths, setRailWidths] = useState(() => {
    const s = readSidebarLayout(sidebarLayoutStorageKey);
    return clampSidebarLayout(s.left, s.right);
  });
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const onNewThreadRef = useRef<() => Promise<void>>(async () => {});
  const composerRichHeroRef = useRef<HTMLDivElement>(null);
  const composerRichBottomRef = useRef<HTMLDivElement>(null);
  const composerRichInlineRef = useRef<HTMLDivElement>(null);
  /** 底部 composer 测高延后到 rAF，避免与虚拟列表等同步读布局挤在同一任务里触发 forced reflow */
  const composerRichAutoHeightRafRef = useRef<number | null>(null);
  const inlineResendRootRef = useRef<HTMLDivElement | null>(null);
  const closeAtMenuLatestRef = useRef<() => void>(() => {});
  const plusAnchorHeroRef = useRef<HTMLDivElement>(null);
  const plusAnchorBottomRef = useRef<HTMLDivElement>(null);
  const plusAnchorInlineRef = useRef<HTMLDivElement>(null);
  const modelPillHeroRef = useRef<HTMLDivElement>(null);
  const modelPillBottomRef = useRef<HTMLDivElement>(null);
  const modelPillInlineRef = useRef<HTMLDivElement>(null);
  const composerGitBranchAnchorRef = useRef<HTMLButtonElement>(null);
  const [plusMenuAnchorSlot, setPlusMenuAnchorSlot] =
    useState<ComposerAnchorSlot>("bottom");
  const [modelPickerAnchorSlot, setModelPickerAnchorSlot] =
    useState<ComposerAnchorSlot>("bottom");

  const respondToolApproval = useCallback(
    async (approved: boolean) => {
      if (!shell) {
        return;
      }
      const req = toolApprovalRequest;
      if (!req) {
        return;
      }
      setToolApprovalRequest(null);
      try {
        await shell.invoke("agent:toolApprovalRespond", {
          approvalId: req.approvalId,
          approved,
        });
      } catch {
        /* ignore */
      }
    },
    [shell, toolApprovalRequest]
  );

  const respondMistakeLimit = useCallback(
    async (action: "continue" | "stop" | "hint", hint?: string) => {
      if (!shell) {
        return;
      }
      const req = mistakeLimitRequest;
      if (!req) {
        return;
      }
      setMistakeLimitRequest(null);
      try {
        await shell.invoke("agent:mistakeLimitRespond", {
          action,
          hint: hint ?? "",
          recoveryId: req.recoveryId,
        });
      } catch {
        /* ignore */
      }
    },
    [shell, mistakeLimitRequest]
  );

  useEffect(
    () => () => {
      if (streamingToolPreviewClearTimerRef.current !== null) {
        window.clearTimeout(streamingToolPreviewClearTimerRef.current);
      }
    },
    []
  );

  // writeComposerMode 已由 useComposer 内的 useEffect 自动处理，直接使用 setComposerMode
  const setComposerModePersist = setComposerMode;

  const openSettingsPage = useCallback(
    (nav: SettingsNavId) => {
      setModelPickerOpen(false);
      setPlusMenuOpen(false);
      openSettingsPageBase(nav);
    },
    [openSettingsPageBase]
  );

  const settingsNavIdSet = useMemo(
    () => new Set<string>(ALL_SETTINGS_NAV_IDS),
    []
  );

  useEffect(() => {
    const unsub = window.maiShell?.subscribeOpenSettingsNav?.((nav) => {
      if (typeof nav === "string" && settingsNavIdSet.has(nav)) {
        openSettingsPage(nav as SettingsNavId);
      }
    });
    return () => {
      unsub?.();
    };
  }, [openSettingsPage, settingsNavIdSet]);

  useEffect(() => {
    const unsub = window.maiShell?.subscribeTrayCommand?.((payload) => {
      const command = payload?.command;
      if (command === "newThread") {
        void onNewThreadRef.current();
        return;
      }
      if (command === "openSettings") {
        openSettingsPage("general");
      }
    });
    return () => {
      unsub?.();
    };
  }, [openSettingsPage]);

  const openBrowserSettingsPage = useCallback(() => {
    openSettingsPage("browser");
  }, [openSettingsPage]);

  const workspaceBasename = useMemo(() => {
    if (!workspace) {
      return t("app.noWorkspace");
    }
    const norm = workspace.replace(/\\/g, "/");
    const parts = norm.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? workspace;
  }, [workspace, t]);

  const quickOpenRecentFiles = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (let i = openTabs.length - 1; i >= 0; i--) {
      const p = openTabs[i]?.filePath;
      if (p && !seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
    return out;
  }, [openTabs]);

  const visibleThreads = useMemo(
    () => threads.filter((thread) => thread.hasUserMessages),
    [threads]
  );

  const { todayThreads, archivedThreads } = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    const list = q
      ? visibleThreads.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.subtitleFallback ?? "").toLowerCase().includes(q)
        )
      : visibleThreads;
    const today: ThreadInfo[] = [];
    const archived: ThreadInfo[] = [];
    for (const t of list) {
      if (t.isToday) {
        today.push(t);
      } else {
        archived.push(t);
      }
    }
    return { archivedThreads: archived, todayThreads: today };
  }, [visibleThreads, threadSearch]);

  const threadsChrono = useMemo(
    () =>
      [...visibleThreads].sort(
        (a, b) =>
          b.updatedAt - a.updatedAt ||
          (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
          a.title.localeCompare(b.title)
      ),
    [visibleThreads]
  );

  const agentSidebarWorkspaceCandidates = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const path of folderRecents) {
      if (!path || seen.has(path)) {
        continue;
      }
      seen.add(path);
      ordered.push(path);
    }
    if (workspace && !seen.has(workspace)) {
      ordered.push(workspace);
    }
    return ordered;
  }, [folderRecents, workspace]);

  // useLayoutEffect：commit 后同步执行，避免 useEffect 异步触发导致在两个 paint 帧间
  // 出现额外的 agentSidebarWorkspaces 无效渲染。
  useLayoutEffect(() => {
    setAgentWorkspaceOrder((prev) => {
      const candidateSet = new Set(agentSidebarWorkspaceCandidates);
      const next = prev.filter((path) => candidateSet.has(path));
      for (const path of agentSidebarWorkspaceCandidates) {
        if (!next.includes(path)) {
          next.push(path);
        }
      }
      return sameStringArray(prev, next) ? prev : next;
    });
  }, [agentSidebarWorkspaceCandidates]);

  const agentSidebarThreadPaths = useMemo(
    () =>
      selectAgentSidebarThreadPaths({
        currentWorkspace: workspace,
        hiddenPaths: hiddenAgentWorkspacePaths,
        orderedPaths: agentWorkspaceOrder,
      }),
    [agentWorkspaceOrder, hiddenAgentWorkspacePaths, workspace]
  );

  const agentSidebarThreadFetchPaths = agentSidebarThreadPaths;

  useEffect(() => {
    if (!shell) {
      return;
    }
    if (layoutMode !== "agent") {
      void refreshAgentSidebarThreads([]);
      return;
    }
    void refreshAgentSidebarThreads(agentSidebarThreadFetchPaths);
  }, [
    shell,
    layoutMode,
    agentSidebarThreadFetchPaths,
    refreshAgentSidebarThreads,
  ]);

  const agentSidebarWorkspaces = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    return agentSidebarThreadPaths.map((path) => {
      const pathKey = normWorkspaceRootKey(path);
      const sidebarRows =
        sidebarThreadsByPathKey[pathKey] ??
        getCachedThreadsForWorkspace(path) ??
        [];
      const currentRows =
        workspace && pathKey === normWorkspaceRootKey(workspace)
          ? threads
          : null;
      const rowsSource =
        currentRows && currentRows.some((thread) => thread.hasUserMessages)
          ? currentRows
          : sidebarRows;
      const visible = rowsSource.filter((thread) => thread.hasUserMessages);
      const list = q
        ? visible.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              (t.subtitleFallback ?? "").toLowerCase().includes(q)
          )
        : visible;
      const today: ThreadInfo[] = [];
      const archived: ThreadInfo[] = [];
      for (const t of list) {
        if (t.isToday) {
          today.push(t);
        } else {
          archived.push(t);
        }
      }
      return {
        archivedThreads: archived,
        isCollapsed: isAgentWorkspaceCollapsed(
          path,
          collapsedAgentWorkspacePaths
        ),
        isCurrent:
          !!workspace &&
          normWorkspaceRootKey(path) === normWorkspaceRootKey(workspace),
        name: workspaceAliases[path]?.trim() || workspacePathDisplayName(path),
        parent: workspacePathParent(path),
        path,
        threadCount: list.length,
        todayThreads: today,
      };
    });
  }, [
    agentSidebarThreadPaths,
    workspace,
    threads,
    sidebarThreadsByPathKey,
    getCachedThreadsForWorkspace,
    threadSearch,
    workspaceAliases,
    collapsedAgentWorkspacePaths,
  ]);

  const hasConversation = messages.length > 0 || awaitingReply;
  const normalizedEditorSidebarSearchQuery = editorSidebarSearchQuery
    .trim()
    .toLowerCase();
  const [editorSidebarSearchResults, setEditorSidebarSearchResults] = useState<
    {
      rel: string;
      fileName: string;
      dir: string;
      fileIndex: number;
      pathIndex: number;
    }[]
  >([]);
  useEffect(() => {
    if (!normalizedEditorSidebarSearchQuery) {
      setEditorSidebarSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const items = await searchFiles(
          normalizedEditorSidebarSearchQuery,
          [],
          120
        );
        if (cancelled) return;
        setEditorSidebarSearchResults(
          items.map((it) => ({
            dir: it.description,
            fileIndex: 0,
            fileName: it.label,
            pathIndex: 0,
            rel: it.path,
          }))
        );
      })();
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedEditorSidebarSearchQuery, searchFiles]);
  const editorSidebarSelectedRel = filePath.trim().replace(/\\/g, "/");
  const editorSidebarWorkspaceLabel = workspace
    ? workspaceBasename.toLocaleUpperCase()
    : t("app.noWorkspace");

  const canSendComposer = useMemo(
    () =>
      Boolean(maiAccount?.jwtToken) &&
      hasSelectedModel &&
      !segmentsTrimmedEmpty(composerSegments),
    [hasSelectedModel, composerSegments, maiAccount?.jwtToken]
  );
  const canSendInlineResend = useMemo(
    () =>
      Boolean(maiAccount?.jwtToken) &&
      hasSelectedModel &&
      !segmentsTrimmedEmpty(inlineResendSegments),
    [hasSelectedModel, inlineResendSegments, maiAccount?.jwtToken]
  );

  useEffect(() => {
    const unsub = window.maiShell?.subscribeComposerAppendDraft?.((payload) => {
      const rawText =
        typeof payload === "string"
          ? payload
          : payload &&
              typeof payload === "object" &&
              typeof payload.text === "string"
            ? payload.text
            : "";
      const text = rawText.replace(/\r/g, "").trim();
      if (!text) {
        return;
      }
      setComposerModePersist("agent");
      setComposerSegments((prev) => {
        const needsSeparator = segmentsToWireText(prev).trim().length > 0;
        return [
          ...prev,
          {
            id: newSegmentId(),
            kind: "text",
            text: `${needsSeparator ? "\n\n" : ""}${text}`,
          },
        ];
      });
      window.requestAnimationFrame(() => {
        (hasConversation
          ? composerRichBottomRef.current
          : composerRichHeroRef.current
        )?.focus();
      });
    });
    return () => {
      unsub?.();
    };
  }, [hasConversation, setComposerModePersist, setComposerSegments]);

  const currentThreadTitle = useMemo(() => {
    const thread = threads.find((x) => x.id === currentId);
    return thread
      ? displayThreadTitle(thread.title, t("app.threadUntitled"))
      : workspaceBasename;
  }, [threads, currentId, workspaceBasename, t]);

  const pendingAgentPatches = useMemo(() => {
    if (!currentId) {
      return EMPTY_AGENT_PENDING_PATCHES;
    }
    return agentReviewPendingByThread[currentId] ?? EMPTY_AGENT_PENDING_PATCHES;
  }, [currentId, agentReviewPendingByThread]);
  const canToggleTerminal = layoutMode === "editor" && !!workspace;
  const canToggleDiffPanel = layoutMode === "agent";
  const currentThreadIndex = currentId
    ? threadsChrono.findIndex((thread) => thread.id === currentId)
    : -1;
  const canGoPrevThread =
    currentThreadIndex >= 0 && currentThreadIndex < threadsChrono.length - 1;
  const canGoNextThread = currentThreadIndex > 0;
  const canGoBackThread = threadNavigation.index > 0;
  const canGoForwardThread =
    threadNavigation.index >= 0 &&
    threadNavigation.index < threadNavigation.history.length - 1;
  const activeDomEditable =
    typeof document !== "undefined" &&
    isEditableDomTarget(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : null;
  const monacoTextFocused = Boolean(
    monacoEditorRef.current?.hasTextFocus?.() ||
      monacoEditorRef.current?.hasWidgetFocus?.()
  );
  const pageSelectionText =
    typeof window === "undefined"
      ? ""
      : (window.getSelection?.()?.toString().trim() ?? "");
  const canEditUndoRedo = monacoTextFocused || !!activeDomEditable;
  const canEditCut = monacoTextFocused || !!activeDomEditable;
  const canEditCopy =
    monacoTextFocused || !!activeDomEditable || pageSelectionText.length > 0;
  const canEditPaste = monacoTextFocused || !!activeDomEditable;
  const canEditSelectAll =
    monacoTextFocused || !!activeDomEditable || pageSelectionText.length > 0;

  useEffect(() => {
    document.body.style.zoom = String(uiZoom);
    return () => {
      document.body.style.zoom = "1";
    };
  }, [uiZoom]);

  const {
    workspaceMenuPath,
    workspaceMenuPosition,
    workspaceMenuRef,
    editingWorkspacePath,
    editingWorkspaceNameDraft,
    setEditingWorkspaceNameDraft,
    workspaceNameDraftRef,
    workspaceNameInputRef,
    closeWorkspaceMenu,
    openWorkspaceMenu,
    revealWorkspaceInOs,
    removeWorkspaceFromSidebar,
    beginWorkspaceAliasEdit,
    cancelWorkspaceAliasEdit,
    commitWorkspaceAliasEdit,
    handleWorkspacePrimaryAction,
  } = useWorkspaceActions({
    flashComposerAttachErr,
    setCollapsedAgentWorkspacePaths,
    setFolderRecents,
    setHiddenAgentWorkspacePaths,
    setHomeRecents,
    setWorkspaceAliases,
    shell,
    showTransientToast,
    t,
    workspaceAliases,
  });

  const activeWorkspaceMenuItem = useMemo(
    () =>
      agentSidebarWorkspaces.find((item) => item.path === workspaceMenuPath) ??
      null,
    [agentSidebarWorkspaces, workspaceMenuPath]
  );

  const resetWorkspaceEphemeralState = useCallback(() => {
    resetStreamingSession({ clearThread: true });
    planBuildPendingMarkerRef.current = null;
    resetAgentReviewState();
    resetComposerState();
    setLastTurnUsage(null);
    resetPlanState();
    cancelWorkspaceAliasEdit();
  }, [
    resetStreamingSession,
    resetAgentReviewState,
    resetComposerState,
    setLastTurnUsage,
    resetPlanState,
    cancelWorkspaceAliasEdit,
  ]);

  const clearWorkspaceConversationState = useCallback(() => {
    resetWorkspaceEphemeralState();
    resetThreadState();
  }, [resetWorkspaceEphemeralState, resetThreadState]);

  const {
    executeSkillCreatorSend,
    executeRuleWizardSend,
    executeSubagentWizardSend,
  } = useWizardSends({
    beginStream,
    clearAgentReviewForThread,
    clearStreamingToolPreviewNow,
    currentId,
    defaultModel,
    flashComposerAttachErr,
    loadMessages,
    refreshThreads,
    resetLiveAgentBlocks,
    resetStreamingSession,
    setComposerModePersist,
    setComposerSegments,
    setCurrentId,
    setMessages,
    setStreamingThinking,
    shell,
    t,
  });

  const {
    persistComposerAttachments,
    onChatPanelDropFiles,
    pickComposerImagesFromDialog,
    insertComposerSkillInvocation,
    toggleComposerMcpServerEnabled,
  } = useComposerAttachments({
    composerRichBottomRef,
    composerRichHeroRef,
    flashComposerAttachErr,
    mcpServers,
    plusMenuOpen,
    setComposerSegments,
    setMcpServers,
    setMcpStatuses,
    shell,
    t,
    workspace,
  });

  const {
    onApplyAgentPatchOne,
    onApplyAgentPatchesAll,
    onDiscardAgentReview,
    dismissAgentChangedFile,
    markAgentConversationChangeReverted,
    onKeepAllEdits,
    onRevertAllEdits,
    onKeepFileEdit,
    onRevertFileEdit,
    refreshRevertableSnapshots,
  } = useAgentPatchActions({
    agentGitPackRef,
    agentReviewPendingByThreadRef,
    clearAgentReviewForThread,
    composerMode,
    currentId,
    currentIdRef,
    dismissedFilesRef,
    fileChangesDismissedRef,
    loadMessages,
    messagesRef,
    refreshGit,
    revertableSnapshotPathsRef,
    revertedChangeKeysRef,
    revertedFilesRef,
    setAgentReviewBusy,
    setAgentReviewPendingByThread,
    setDismissedFiles,
    setFileChangesDismissed,
    setRevertableSnapshotPaths,
    setRevertedChangeKeys,
    setRevertedFiles,
    setRevertNotice,
    shell,
    t,
  });

  useEffect(() => {
    if (!shell) {
      setIpcOk(t("app.ipcBrowserOnly"));
      hideBootSplash();
      return;
    }
    void runDesktopShellInit({
      applyLoadedSettings,
      layoutPinnedBySurface,
      refreshGit,
      refreshThreads,
      setAppearanceSettings,
      setColorMode,
      setHomePath,
      setIpcOk,
      setLayoutMode,
      setLocale,
      setMcpServers,
      setMcpStatuses,
      setRailWidths,
      setWorkspace,
      shell,
      shellLayoutStorageKey,
      sidebarLayoutStorageKey,
      t,
    });
  }, [
    shell,
    refreshThreads,
    refreshGit,
    t,
    setLocale,
    layoutPinnedBySurface,
    shellLayoutStorageKey,
    sidebarLayoutStorageKey,
    setWorkspace,
    setHomePath,
    setRailWidths,
    setLayoutMode,
    applyLoadedSettings,
    setColorMode,
    setAppearanceSettings,
    setMcpServers,
    setMcpStatuses,
  ]);

  useEffect(() => {
    if (!shell?.subscribeThemeMode) {
      return;
    }
    return shell.subscribeThemeMode((payload) => {
      const next = (payload as { colorMode?: unknown } | null)?.colorMode;
      if (
        (next === "light" || next === "dark" || next === "system") &&
        next !== colorMode
      ) {
        setTransitionOrigin(undefined);
        setColorMode(next);
        writeStoredColorMode(next);
      }
    });
  }, [shell, setTransitionOrigin, colorMode]);

  useEffect(() => {
    if (layoutMode !== "editor" || editorLeftSidebarView !== "search") {
      return;
    }
    const id = window.setTimeout(
      () => editorSidebarSearchInputRef.current?.focus(),
      0
    );
    return () => window.clearTimeout(id);
  }, [layoutMode, editorLeftSidebarView]);

  // useLayoutEffect：与上方 agentWorkspaceOrder 同理，避免额外 paint 帧。
  useLayoutEffect(() => {
    setEditorExplorerCollapsed(false);
  }, [workspace]);

  useEffect(() => {
    if (
      layoutMode !== "editor" ||
      editorLeftSidebarView !== "explorer" ||
      editorExplorerCollapsed
    ) {
      return;
    }
    const id = window.requestAnimationFrame(scrollEditorExplorerToTop);
    return () => window.cancelAnimationFrame(id);
  }, [
    layoutMode,
    editorLeftSidebarView,
    editorExplorerCollapsed,
    workspace,
    scrollEditorExplorerToTop,
  ]);

  /**
   * fileChanges 状态恢复：从 localStorage 读取已保留/撤销记录并同批写入 state。
   * 使用 ref 追踪上次计算的 {threadId, hash}，避免 streaming 期间重复计算。
   * 被 onMessagesLoaded（loadMessages 的 onLoad 回调）和后续 useEffect 共用。
   */
  const fileChangesLastHashRef = useRef<{
    threadId: string | null;
    hash: string;
  }>({ hash: "", threadId: null });
  const restoreFileChangesState = useCallback(
    (
      threadId: string | null,
      msgs: ChatMessage[],
      loadedThreadId: string | null
    ) => {
      if (!threadId || loadedThreadId !== threadId) {
        if (
          fileChangesLastHashRef.current.threadId === null &&
          fileChangesLastHashRef.current.hash === ""
        )
          return;
        fileChangesLastHashRef.current = { hash: "", threadId: null };
        setFileChangesDismissed(false);
        setDismissedFiles(new Set());
        setRevertedFiles(new Set());
        setRevertedChangeKeys(new Set());
        return;
      }
      const last = [...msgs].reverse().find((m) => m.role === "assistant");
      const content = last?.content ?? "";
      if (!content.trim()) {
        if (
          fileChangesLastHashRef.current.threadId === threadId &&
          fileChangesLastHashRef.current.hash === ""
        )
          return;
        fileChangesLastHashRef.current = { hash: "", threadId };
        setFileChangesDismissed(false);
        setDismissedFiles(new Set());
        setRevertedFiles(new Set());
        setRevertedChangeKeys(new Set());
        return;
      }
      const hash = hashAgentAssistantContent(content);
      if (
        fileChangesLastHashRef.current.threadId === threadId &&
        fileChangesLastHashRef.current.hash === hash
      ) {
        return; // 相同 hash，跳过重复计算
      }
      fileChangesLastHashRef.current = { hash, threadId };
      const stored = readPersistedAgentFileChanges(threadId);
      if (!stored || stored.contentHash !== hash) {
        if (stored) clearPersistedAgentFileChanges(threadId);
        setFileChangesDismissed(false);
        setDismissedFiles(new Set());
        setRevertedFiles(new Set());
        setRevertedChangeKeys(new Set());
        return;
      }
      setFileChangesDismissed(stored.fileChangesDismissed);
      setDismissedFiles(new Set(stored.dismissedPaths));
      setRevertedFiles(new Set(stored.revertedPaths));
      setRevertedChangeKeys(new Set(stored.revertedChangeKeys));
    },
    [
      setFileChangesDismissed,
      setDismissedFiles,
      setRevertedFiles,
      setRevertedChangeKeys,
    ]
  );

  /**
   * loadMessages 的 onLoad 回调：在 startTransition 内与 setMessages 同批执行，
   * 避免 messages 变化后 useEffect 级联触发额外 render 轮次。
   */
  // 上一轮 awaitingReply 状态：用来在 turn 结束（true → false）时同步一次真实快照集合。
  const prevAwaitingReplyRef = useRef(false);
  useEffect(() => {
    const was = prevAwaitingReplyRef.current;
    prevAwaitingReplyRef.current = awaitingReply;
    if (was && !awaitingReply && currentId) {
      void refreshRevertableSnapshots(currentId);
    }
  }, [awaitingReply, currentId, refreshRevertableSnapshots]);

  const onMessagesLoaded = useCallback(
    (
      msgs: ChatMessage[],
      threadId: string,
      extra?: { teamSession?: unknown; agentSession?: unknown }
    ) => {
      restoreFileChangesState(threadId, msgs, threadId);
      // 切换 thread / 启动加载消息后，同步一次"还能撤销"的真实集合，
      // 让 AgentFileChangesPanel 的撤销按钮按真实快照状态置灰。
      void refreshRevertableSnapshots(threadId);
      setRevertNotice(null);
      if (extra?.teamSession && typeof extra.teamSession === "object") {
        restoreTeamSession(
          threadId,
          extra.teamSession as import("./hooks/useTeamSession").TeamSessionSnapshot
        );
      }
      if (extra?.agentSession && typeof extra.agentSession === "object") {
        restoreAgentSession(
          threadId,
          extra.agentSession as import("./agentSessionTypes").AgentSessionSnapshot
        );
        if (shell) {
          void shell.invoke("agent:getSession", threadId);
        }
      }
    },
    [
      restoreFileChangesState,
      restoreTeamSession,
      restoreAgentSession,
      refreshRevertableSnapshots,
      setRevertNotice,
      shell,
    ]
  );

  useEffect(() => {
    if (!shell || !currentId) {
      return;
    }
    // 避免与 onSelectThread 中的手动调用重复
    if (messagesThreadId === currentId) return;
    void loadMessages(currentId, onMessagesLoaded);
  }, [shell, currentId, loadMessages, messagesThreadId, onMessagesLoaded]);

  const workspaceSwitchSeqRef = useRef(0);
  const applyWorkspacePath = useCallback(
    async (next: string) => {
      const seq = ++workspaceSwitchSeqRef.current;
      const mark = (suffix: string) => {
        try {
          performance.mark(`void-ws-${seq}-${suffix}`);
        } catch {
          /* ignore */
        }
      };
      const measure = (
        name: string,
        startSuffix: string,
        endSuffix: string
      ) => {
        try {
          performance.measure(
            name,
            `void-ws-${seq}-${startSuffix}`,
            `void-ws-${seq}-${endSuffix}`
          );
        } catch {
          /* ignore */
        }
      };
      const t0 = performance.now();
      console.log(`[perf][renderer] workspace switch START → ${next}`);
      mark("start");
      if (
        workspace &&
        normWorkspaceRootKey(workspace) !== normWorkspaceRootKey(next)
      ) {
        cacheThreadStateForWorkspace(workspace);
      }
      resetWorkspaceEphemeralState();
      const restoredFromCache = restoreThreadStateForWorkspace(next);
      if (!restoredFromCache) {
        resetThreadState({ keepSidebarThreads: true });
      }
      setWorkspace(next);
      mark("workspace-set");
      console.log(
        `[perf][renderer] workspace:openPath+setState done in ${(performance.now() - t0).toFixed(1)}ms` +
          (restoredFromCache ? " (cache restored)" : "")
      );
      // 后台补齐线程/消息：打开工作区的交互先完成，慢 IPC 不再卡住 workspace 切换。
      void (async () => {
        const isLatestWorkspaceSwitch = () =>
          workspaceSwitchSeqRef.current === seq;
        const threadId = await refreshThreads({
          shouldApply: isLatestWorkspaceSwitch,
        });
        if (!isLatestWorkspaceSwitch()) {
          return;
        }
        mark("threads-done");
        measure("void-ws:apply-path:threads", "start", "threads-done");
        console.log(
          `[perf][renderer] refreshThreads IPC round-trip done in ${(performance.now() - t0).toFixed(1)}ms`
        );
        if (threadId) {
          await loadMessages(threadId, onMessagesLoaded);
          if (!isLatestWorkspaceSwitch()) {
            return;
          }
          restoreInFlightThreadUiIfNeeded(threadId);
          mark("messages-done");
          measure(
            "void-ws:apply-path:messages",
            "threads-done",
            "messages-done"
          );
          console.log(
            `[perf][renderer] loadMessages done in ${(performance.now() - t0).toFixed(1)}ms`
          );
        }
      })();
    },
    [
      workspace,
      cacheThreadStateForWorkspace,
      resetWorkspaceEphemeralState,
      restoreThreadStateForWorkspace,
      resetThreadState,
      setWorkspace,
      refreshThreads,
      loadMessages,
      onMessagesLoaded,
      restoreInFlightThreadUiIfNeeded,
    ]
  );

  const openWorkspaceByPath = useCallback(
    async (path: string): Promise<boolean> => {
      if (!shell) {
        setWorkspacePickerOpen(true);
        return false;
      }
      const r = (await shell.invoke("workspace:openPath", path)) as {
        ok: boolean;
        path?: string;
        error?: string;
      };
      if (r.ok && r.path) {
        // 主进程解析后的根路径与当前 workspace 相同时勿再 applyWorkspacePath，否则会 clearWorkspaceConversationState
        // 把消息清空（侧栏 threadWorkspaceRoot 与 workspace 字符串略不一致时易误触发）。
        if (
          workspace &&
          normWorkspaceRootKey(r.path) === normWorkspaceRootKey(workspace)
        ) {
          if (import.meta.env.DEV) {
            console.log(
              "[perf] openWorkspaceByPath: skip apply (resolved path matches current workspace)"
            );
          }
          return true;
        }
        await applyWorkspacePath(r.path);
        return true;
      }
      setWorkspacePickerOpen(true);
      return false;
    },
    [shell, applyWorkspacePath, workspace]
  );

  const { executeEditAction } = useEditCommands({
    flashComposerAttachErr,
    monacoEditorRef,
    shell,
    t,
  });

  // 优化的回调函数,避免 JSX 中创建内联函数
  const handleCloseWorkspacePicker = useCallback(
    () => setWorkspacePickerOpen(false),
    []
  );
  const handleCloseQuickOpen = useCallback(() => {
    setQuickOpenOpen(false);
    setQuickOpenSeed("");
  }, []);
  const handleCloseWorkspaceTools = useCallback(
    () => setWorkspaceToolsOpen(false),
    []
  );
  const handleCloseModelPicker = useCallback(
    () => setModelPickerOpen(false),
    []
  );
  const handleClosePlusMenu = useCallback(() => setPlusMenuOpen(false), []);
  const handleToggleFileMenu = useCallback(
    () => toggleMenubarMenu("file"),
    [toggleMenubarMenu]
  );
  const handleToggleEditMenu = useCallback(
    () => toggleMenubarMenu("edit"),
    [toggleMenubarMenu]
  );
  const handleCloseEditorChatMore = useCallback(
    () => setEditorChatMoreOpen(false),
    []
  );
  const handleOpenSettingsGeneral = useCallback(
    () => openSettingsPage("general"),
    [openSettingsPage]
  );
  const handleOpenSettingsModels = useCallback(
    () => openSettingsPage("models"),
    [openSettingsPage]
  );
  const handleOpenSettingsRules = useCallback(
    () => openSettingsPage("rules"),
    [openSettingsPage]
  );
  const handleOpenSettingsTools = useCallback(
    () => openSettingsPage("tools"),
    [openSettingsPage]
  );
  const handleOpenAutoUpdate = useCallback(
    () => openSettingsPage("autoUpdate"),
    [openSettingsPage]
  );

  const toggleSidebarVisibility = useCallback(() => {
    setLeftSidebarOpen((open) => !open);
  }, []);

  const toggleTerminalVisibility = useCallback(() => {
    if (layoutMode !== "editor" || !workspace) {
      return;
    }
    setEditorTerminalVisible((visible) => !visible);
  }, [layoutMode, workspace]);

  const openAgentRightSidebarView = useCallback(
    (view: AgentRightSidebarView) => {
      setAgentRightSidebarView(view);
      setAgentRightSidebarOpen(true);
    },
    []
  );

  const toggleAgentRightSidebarView = useCallback(
    (view: AgentRightSidebarView) => {
      if (agentRightSidebarOpen && agentRightSidebarView === view) {
        setAgentRightSidebarOpen(false);
        return;
      }
      setAgentRightSidebarView(view);
      setAgentRightSidebarOpen(true);
    },
    [agentRightSidebarOpen, agentRightSidebarView]
  );

  const toggleDiffPanelVisibility = useCallback(() => {
    if (layoutMode !== "agent") {
      return;
    }
    toggleAgentRightSidebarView("git");
  }, [layoutMode, toggleAgentRightSidebarView]);

  const launchWorkspaceWithTool = useCallback(
    async (
      tool: WorkspaceLauncherTool,
      options?: {
        relPath?: string;
        revealLine?: number;
        revealEndLine?: number;
      }
    ) => {
      if (!shell || !workspace) {
        flashComposerAttachErr(t("app.noWorkspace"));
        return;
      }
      try {
        const r = (await shell.invoke("workspace:openInExternalTool", {
          relPath: options?.relPath,
          revealEndLine: options?.revealEndLine,
          revealLine: options?.revealLine,
          tool,
        })) as {
          ok?: boolean;
          code?: string;
          error?: string;
        };
        if (!r?.ok) {
          if (r?.code === "tool-unavailable") {
            flashComposerAttachErr(
              t("app.workspaceLauncher.toolUnavailable", {
                app: workspaceLauncherLabel(t, tool),
              })
            );
            return;
          }
          if (r?.code === "no-workspace") {
            flashComposerAttachErr(t("app.noWorkspace"));
            return;
          }
          flashComposerAttachErr(
            r?.error ??
              t("app.workspaceLauncher.openFailed", {
                app: workspaceLauncherLabel(t, tool),
              })
          );
        }
      } catch (e) {
        flashComposerAttachErr(e instanceof Error ? e.message : String(e));
      }
    },
    [shell, workspace, flashComposerAttachErr, t]
  );

  const openAgentFilePreviewInWorkspaceLauncher = useCallback(
    (relPath: string, revealLine?: number, revealEndLine?: number) => {
      void launchWorkspaceWithTool(readStoredWorkspaceLauncher(), {
        relPath,
        revealEndLine,
        revealLine,
      });
    },
    [launchWorkspaceWithTool]
  );

  const {
    onNewThread,
    composerInvokeNewThread,
    onNewThreadForWorkspace,
    onSelectThread,
    goToPreviousThread,
    goToNextThread,
    goThreadBack,
    goThreadForward,
    commitThreadTitleEdit,
    cancelThreadTitleEdit,
    beginThreadTitleEdit,
    onDeleteThread,
  } = useThreadActions({
    awaitingReply,
    clearAgentSession,
    clearStreamingToolPreviewNow,
    clearTeamSession,
    closeWorkspaceMenu,
    composerRichBottomRef,
    composerRichHeroRef,
    confirmDeleteId,
    confirmDeleteTimerRef,
    currentId,
    currentIdRef,
    editingThreadId,
    editingThreadWorkspacePath,
    firstTokenAtRef,
    ipcInFlightChatThreadIdRef,
    loadMessages,
    messagesRef,
    messagesThreadIdRef,
    offThreadStreamDraftsRef,
    onMessagesLoaded,
    onNewThreadRef,
    openWorkspaceByPath,
    planQuestionDismissedByThreadRef,
    refreshThreads,
    resetLiveAgentBlocks,
    restoreInFlightThreadUiIfNeeded,
    setAgentFilePreview,
    setAwaitingReply,
    setComposerSegments,
    setConfirmDeleteId,
    setCurrentId,
    setEditingThreadId,
    setEditingThreadTitleDraft,
    setEditingThreadWorkspacePath,
    setEditorThreadHistoryOpen,
    setHiddenAgentWorkspacePaths,
    setInlineResendSegments,
    setLastTurnUsage,
    setMessages,
    setMessagesThreadId,
    setParsedPlan,
    setPlanFilePath,
    setPlanFileRelPath,
    setResendFromUserIndex,
    setStreaming,
    setStreamingThinking,
    setStreamingThreadId,
    setThreadNavigation,
    shell,
    sidebarThreadsByPathKey,
    skipThreadNavigationRecordRef,
    streamStartedAtRef,
    threadNavigation,
    threads,
    threadsChrono,
    threadTitleDraftRef,
    threadTitleInputRef,
    workspace,
  });

  const onSendRef = useRef<
    (textOverride?: string, opts?: OnSendOptions) => Promise<void>
  >(async () => {});

  onSendRef.current = async (textOverride?: string, opts?: OnSendOptions) => {
    const resendIdx = resendFromUserIndex;
    const segments =
      resendIdx === null ? composerSegments : inlineResendSegments;
    const fromSegments = segmentsToWireText(segments).trim();
    const text =
      resendIdx === null &&
      typeof textOverride === "string" &&
      textOverride.trim().length > 0
        ? textOverride.trim()
        : fromSegments;
    const targetThreadId = opts?.threadId ?? currentId;
    if (!shell || !targetThreadId) {
      return;
    }
    // Q4 : connexion mAI obligatoire — si non connecté, ouvrir le modal et bloquer l'envoi
    if (!maiAccount?.jwtToken) {
      openMaiAccountModal();
      flashComposerAttachErr(t("mai.notLoggedIn"));
      return;
    }

    const wizardSlug =
      resendIdx === null &&
      (typeof textOverride !== "string" || textOverride.trim().length === 0)
        ? getLeadingWizardCommand(composerSegments)
        : null;
    if (wizardSlug) {
      if (segmentsTrimmedEmpty(composerSegments)) {
        return;
      }
      /* 关闭 portaled 菜单（slash 等 z-index ~20001），否则会盖在内嵌向导上导致选项无法点击 */
      slashCommand.closeSlashMenu();
      atMention.closeAtMenu();
      setPlusMenuOpen(false);
      setModelPickerOpen(false);
      setWizardPending({
        kind: wizardSlug,
        tailSegments: composerSegments.slice(1),
        targetThreadId,
      });
      return;
    }

    if (!text) {
      return;
    }
    const effectiveModelId = (opts?.modelIdOverride ?? defaultModel).trim();
    if (!effectiveModelId) {
      flashComposerAttachErr(t("app.noModelSelected"));
      return;
    }
    await sendMessage(text, { ...opts, segments });
  };

  const onSend = useCallback(
    async (textOverride?: string, opts?: OnSendOptions) =>
      onSendRef.current(textOverride, opts),
    []
  );

  const composerInvokeSend = useCallback(() => {
    void onSend();
  }, [onSend]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ threadId?: string }>).detail;
      const threadId =
        typeof detail?.threadId === "string" ? detail.threadId : "";
      if (!threadId) return;
      void (async () => {
        try {
          await refreshThreads();
          setCurrentId(threadId);
          await loadMessages(threadId);
        } catch (err) {
          console.error("[focus-thread]", err);
        }
      })();
    };
    window.addEventListener("mai-coder:focusThread", handler);
    return () => {
      window.removeEventListener("mai-coder:focusThread", handler);
    };
  }, [refreshThreads, setCurrentId, loadMessages]);

  useEffect(() => {
    const unsub = window.maiShell?.subscribeCaptureAnalysisDispatch?.(
      (payload) => {
        const prompt =
          typeof payload?.prompt === "string" ? payload.prompt.trim() : "";
        if (!prompt || !shell) {
          return;
        }
        const mode = typeof payload?.mode === "string" ? payload.mode : "auto";
        const sourceUrl =
          typeof payload?.sourceUrl === "string" ? payload.sourceUrl : "";
        const host = sourceUrl ? safeHostFromUrl(sourceUrl) : "";
        const modeLabel = CAPTURE_ANALYSIS_MODE_LABELS[mode] ?? mode;
        const title = host
          ? `Capture · ${modeLabel} · ${host}`
          : `Capture · ${modeLabel}`;
        void (async () => {
          try {
            const created = (await shell.invoke("threads:create")) as {
              id: string;
            };
            if (!created?.id) return;
            await shell
              .invoke("threads:rename", created.id, title)
              .catch(() => {});
            setComposerModePersist("agent");
            setComposerSegments([]);
            setInlineResendSegments([]);
            setResendFromUserIndex(null);
            await refreshThreads();
            setCurrentId(created.id);
            await loadMessages(created.id);
            await shell
              .invoke("browserCapture:analysisRecord", {
                mode,
                sourceUrl,
                threadId: created.id,
                title,
              })
              .catch(() => {});
            window.requestAnimationFrame(() => {
              void onSend(prompt);
            });
          } catch (err) {
            console.error("[capture-analysis-dispatch]", err);
          }
        })();
      }
    );
    return () => {
      unsub?.();
    };
  }, [
    shell,
    refreshThreads,
    setCurrentId,
    loadMessages,
    setComposerModePersist,
    setComposerSegments,
    setInlineResendSegments,
    setResendFromUserIndex,
    onSend,
  ]);

  const onAbortRef = useRef<() => Promise<void>>(async () => {});

  onAbortRef.current = abortActiveStream;

  const onAbort = useCallback(async () => {
    if (currentId) {
      abortTeamSession(currentId);
    }
    return onAbortRef.current();
  }, [currentId, abortTeamSession]);

  // usePlanWizardActions 实际调用挪到下方 closeSettingsPage 解构之后

  useEffect(() => {
    if (!layoutSwitchPending) {
      setLayoutSwitchTarget(null);
    }
  }, [layoutSwitchPending]);

  const {
    onPersistLanguage,
    onChangeColorMode,
    refreshLayoutWindowAvailability,
    onChangeBotIntegrations,
    closeSettingsPage,
  } = useSettingsPersistence({
    agentCustomization,
    appearanceSettings,
    botIntegrations,
    colorMode,
    defaultModel,
    editorSettings,
    enabledModelIds,
    layoutMode,
    layoutPinnedBySurface,
    locale,
    mcpServers,
    modelEntries,
    modelProviders,
    providerIdentity,
    setBotIntegrations,
    setColorMode,
    setLayoutWindowAvailability,
    setSettingsPageOpen,
    setTransitionOrigin,
    shell,
    teamSettings,
    thinkingByModelId,
    workspace,
  });

  const {
    onPlanQuestionSubmit,
    onPlanQuestionSkip,
    onUserInputSubmit,
    onPlanBuild,
    onExecutePlanFromEditor,
    onPlanReviewClose,
    startSkillCreatorFlow,
  } = usePlanWizardActions({
    agentRightSidebarView,
    awaitingReply,
    clearRootUserInputRequest,
    clearStreamingToolPreviewNow,
    clearTeamPendingQuestion,
    clearTeamPendingUserInput,
    closeSettingsPage,
    composerMode,
    composerRichBottomRef,
    composerRichHeroRef,
    currentIdRef,
    editorValue,
    executedPlanKeys,
    filePath,
    firstTokenAtRef,
    getLatestAgentPlan,
    getTeamSession,
    hasConversation,
    layoutMode,
    loadMessages,
    onSend,
    planFilePath,
    planFileRelPath,
    planQuestion,
    planQuestionRequestId,
    recordPlanQuestionDismissed,
    refreshThreads,
    rootUserInputRequestsByThread,
    setAgentRightSidebarOpen,
    setAgentRightSidebarView,
    setAwaitingReply,
    setComposerModePersist,
    setComposerSegments,
    setCurrentId,
    setEditorPlanReviewDismissed,
    setInlineResendSegments,
    setLastTurnUsage,
    setParsedPlan,
    setPlanFilePath,
    setPlanFileRelPath,
    setPlanQuestion,
    setPlanQuestionRequestId,
    setResendFromUserIndex,
    setStreaming,
    setStreamingThinking,
    setStreamingThreadId,
    shell,
    showTransientToast,
    streamStartedAtRef,
    t,
    workspace,
  });

  const {
    onLoadFile,
    onSaveFile,
    openFileInTab,
    onCloseTab,
    onSelectTab,
    appendEditorTerminal,
    closeEditorTerminalPanel,
    closeWorkspaceFolder,
    fileMenuNewFile,
    fileMenuOpenFile,
    fileMenuOpenFolder,
    fileMenuSaveAs,
    fileMenuRevertFile,
    fileMenuCloseEditor,
    fileMenuNewWindow,
    fileMenuNewEditorWindow,
    fileMenuQuit,
    closeEditorTerminalSession,
    spawnEditorTerminal,
  } = useFileOperations({
    activeTabId,
    applyWorkspacePath,
    clearWorkspaceConversationState,
    currentId,
    editorLoadRequestRef,
    editorTerminalCreateLockRef,
    editorValue,
    filePath,
    gitChangedPaths,
    gitStatusOk,
    layoutMode,
    openTabs,
    pendingEditorHighlightRangeRef,
    refreshGit,
    refreshThreads,
    setActiveEditorTerminalId,
    setActiveTabId,
    setEditorInlineDiffByPath,
    setEditorTerminalSessions,
    setEditorTerminalVisible,
    setEditorValue,
    setFilePath,
    setLayoutMode,
    setOpenTabs,
    setSaveToastKey,
    setSaveToastVisible,
    setTerminalMenuOpen,
    setWorkspace,
    setWorkspacePickerOpen,
    shell,
    t,
    workspace,
  });

  const openAgentSidebarFilePreview = useAgentSidebarFilePreview({
    agentFilePreviewRequestRef,
    agentGitPackRef,
    currentId,
    layoutMode,
    openFileInTab,
    setAgentFilePreview,
    setAgentRightSidebarOpen,
    setAgentRightSidebarView,
    shell,
  });

  useEffect(() => {
    if (isPlanMdPath(filePath.trim())) {
      setEditorPlanBuildModelId(defaultModel);
    }
  }, [filePath, defaultModel]);

  useEffect(() => {
    if (
      layoutMode !== "editor" ||
      composerMode !== "plan" ||
      awaitingReply ||
      !planFileRelPath
    ) {
      return;
    }
    const current = filePath.trim().replace(/\\/g, "/");
    const target = planFileRelPath.replace(/\\/g, "/");
    if (current === target) {
      return;
    }
    void openFileInTab(target);
  }, [
    layoutMode,
    composerMode,
    awaitingReply,
    planFileRelPath,
    filePath,
    openFileInTab,
  ]);

  useEffect(() => {
    if (!shell || !currentId) {
      setExecutedPlanKeys([]);
      return;
    }
    let cancelled = false;
    void shell.invoke("threads:getExecutedPlanKeys", currentId).then((r) => {
      if (cancelled) {
        return;
      }
      const rec = r as { ok?: boolean; keys?: string[] };
      setExecutedPlanKeys(rec.ok && Array.isArray(rec.keys) ? rec.keys : []);
    });
    return () => {
      cancelled = true;
    };
  }, [shell, currentId]);

  const handleOpenWorkspaceSkillFile = useCallback(
    (rel: string) => {
      setLayoutMode("editor");
      void openFileInTab(rel);
    },
    [openFileInTab]
  );

  const { handleOpenAgentLayoutWindow, handleOpenEditorLayoutWindow } =
    useLayoutWindows({
      composerRichBottomRef,
      composerRichHeroRef,
      refreshLayoutWindowAvailability,
      setLayoutMode,
      shell,
      shellLayoutStorageKey,
    });

  const handleDeleteWorkspaceSkillDisk = useCallback(
    async (skillMdRel: string): Promise<boolean> => {
      if (!shell) return false;
      try {
        const r = (await shell.invoke(
          "workspace:deleteSkillFromDisk",
          skillMdRel
        )) as { ok?: boolean };
        if (r?.ok) refreshWorkspaceDiskSkills();
        return !!r?.ok;
      } catch {
        return false;
      }
    },
    [shell]
  );

  const onAgentConversationOpenFile = useCallback(
    async (
      rel: string,
      revealLine?: number,
      revealEndLine?: number,
      options?: AgentConversationFileOpenOptions
    ) => {
      const normalizedRel = normalizeWorkspaceRelPath(rel);
      const pathReverted = normalizedRel
        ? [...revertedFilesRef.current].some((path) =>
            workspaceRelPathsEqual(path, normalizedRel)
          )
        : false;
      if (pathReverted) {
        return;
      }
      const changeKey =
        typeof options?.diff === "string" && options.diff.trim()
          ? agentChangeKeyFromDiff(options.diff)
          : "";
      if (changeKey && revertedChangeKeysRef.current.has(changeKey)) {
        return;
      }
      if (layoutMode === "agent") {
        await openAgentSidebarFilePreview(
          rel,
          revealLine,
          revealEndLine,
          options
        );
        return;
      }
      await openFileInTab(rel, revealLine, revealEndLine);
    },
    [layoutMode, openAgentSidebarFilePreview, openFileInTab]
  );

  const onAcceptAgentFilePreviewHunk = useCallback(
    async (patch: string) => {
      if (!shell || !currentId || !agentFilePreview || !patch.trim()) {
        return;
      }
      setAgentFilePreviewBusyPatch(patch);
      try {
        const result = (await shell.invoke("agent:acceptFileHunk", {
          chunk: patch,
          relPath: agentFilePreview.relPath,
          threadId: currentId,
        })) as { ok?: boolean; cleared?: boolean; error?: string };
        if (!result?.ok) {
          flashComposerAttachErr(
            result?.error ?? "Unable to accept this change."
          );
          return;
        }
        if (result.cleared) {
          dismissAgentChangedFile(agentFilePreview.relPath);
        }
        await openAgentSidebarFilePreview(
          agentFilePreview.relPath,
          agentFilePreview.revealLine,
          agentFilePreview.revealEndLine
        );
      } finally {
        setAgentFilePreviewBusyPatch(null);
      }
    },
    [
      agentFilePreview,
      currentId,
      dismissAgentChangedFile,
      flashComposerAttachErr,
      openAgentSidebarFilePreview,
      shell,
    ]
  );

  const onRevertAgentFilePreviewHunk = useCallback(
    async (patch: string) => {
      if (!shell || !currentId || !agentFilePreview || !patch.trim()) {
        return;
      }
      if (diffCreatesNewFile(agentFilePreview.diff)) {
        const ok = window.confirm(
          t("app.filePreviewRevertNewFileConfirm", {
            path: agentFilePreview.relPath,
          })
        );
        if (!ok) {
          return;
        }
      }
      setAgentFilePreviewBusyPatch(patch);
      try {
        const result = (await shell.invoke("agent:revertFileHunk", {
          chunk: patch,
          relPath: agentFilePreview.relPath,
          threadId: currentId,
        })) as { ok?: boolean; cleared?: boolean; error?: string };
        if (!result?.ok) {
          flashComposerAttachErr(
            result?.error ?? "Unable to revert this change."
          );
          return;
        }
        const revertedPatchKey = agentChangeKeyFromDiff(patch);
        const previewDiffKey = agentChangeKeyFromDiff(agentFilePreview.diff);
        const revertedRelPath = result.cleared
          ? agentFilePreview.relPath
          : undefined;
        markAgentConversationChangeReverted(revertedPatchKey, revertedRelPath);
        if (previewDiffKey && previewDiffKey !== revertedPatchKey) {
          markAgentConversationChangeReverted(previewDiffKey, revertedRelPath);
        }
        if (result.cleared) {
          dismissAgentChangedFile(agentFilePreview.relPath);
        }
        await refreshGit();
        await openAgentSidebarFilePreview(
          agentFilePreview.relPath,
          agentFilePreview.revealLine,
          agentFilePreview.revealEndLine
        );
      } finally {
        setAgentFilePreviewBusyPatch(null);
      }
    },
    [
      agentFilePreview,
      currentId,
      dismissAgentChangedFile,
      flashComposerAttachErr,
      markAgentConversationChangeReverted,
      openAgentSidebarFilePreview,
      refreshGit,
      shell,
      t,
    ]
  );

  const onExplorerOpenFile = useCallback(
    async (
      rel: string,
      revealLine?: number,
      revealEndLine?: number,
      options?: AgentConversationFileOpenOptions
    ) => {
      if (layoutMode === "agent") {
        await openAgentSidebarFilePreview(
          rel,
          revealLine,
          revealEndLine,
          options
        );
        return;
      }
      await openFileInTab(rel, revealLine, revealEndLine, options);
    },
    [layoutMode, openAgentSidebarFilePreview, openFileInTab]
  );

  /** 勿内联箭头传入 useComposerAtMention，否则每轮 render 新引用会拖垮 handleAtKeyDown → sharedComposerProps */
  const onAtMentionFileChipPreview = useCallback(
    (relPath: string) => {
      void onExplorerOpenFile(relPath);
    },
    [onExplorerOpenFile]
  );

  const composerExplorerOpenRel = useCallback(
    (rel: string) => {
      void onExplorerOpenFile(rel);
    },
    [onExplorerOpenFile]
  );

  const goToLineInEditor = useCallback((line: number) => {
    const ed = monacoEditorRef.current;
    if (!ed || !Number.isFinite(line) || line < 1) {
      return;
    }
    try {
      const model = ed.getModel();
      const lc = model?.getLineCount() ?? line;
      const ln = Math.max(1, Math.min(Math.floor(line), lc));
      ed.setPosition({ column: 1, lineNumber: ln });
      ed.revealLineInCenter(ln);
    } catch {
      /* ignore */
    }
  }, []);

  const teamSelectedTaskIdForCenter =
    getTeamSession(currentId)?.selectedTaskId ?? null;
  const {
    monacoDocumentPath,
    activeEditorInlineDiff,
    markdownPaneMode,
    setMarkdownPaneMode,
    markdownPreviewContent,
    monacoOriginalDocumentPath,
    editorPlanFileIsBuilt,
    showPlanFileEditorChrome,
    editorCenterPlanMarkdown,
    showEditorPlanDocumentInCenter,
    showEditorTeamWorkflowInCenter,
    editorCenterPlanCanBuild,
  } = useEditorCenterDerived({
    agentPlanEffectivePlan,
    agentPlanPreviewMarkdown,
    awaitingReply,
    composerMode,
    currentId,
    editorInlineDiffByPath,
    editorPlanBuildModelId,
    editorValue,
    executedPlanKeys,
    filePath,
    hasConversation,
    layoutMode,
    modelPickerItems,
    openTabs,
    setOpenTabs,
    t,
    teamSelectedTaskId: teamSelectedTaskIdForCenter,
    workspace,
  });

  useEffect(() => {
    if (!gitStatusOk) {
      return;
    }
    setEditorInlineDiffByPath((prev) => {
      let changed = false;
      const next: Record<string, EditorInlineDiffState> = {};
      for (const [path, state] of Object.entries(prev)) {
        if (
          state.reviewMode === "readonly" &&
          !gitChangedPaths.some((changedPath) =>
            workspaceRelPathsEqual(changedPath, path)
          )
        ) {
          changed = true;
          continue;
        }
        next[path] = state;
      }
      return changed ? next : prev;
    });
  }, [gitChangedPaths, gitStatusOk]);

  const teamSession = useMemo(
    () => getTeamSession(currentId),
    [getTeamSession, currentId]
  );
  const agentSession = useMemo(
    () => getAgentSession(currentId),
    [getAgentSession, currentId]
  );
  const activePlanQuestion = useMemo(
    () =>
      resendFromUserIndex === null
        ? composerMode === "team"
          ? (teamSession?.pendingQuestion ?? planQuestion)
          : planQuestion
        : null,
    [composerMode, teamSession, planQuestion, resendFromUserIndex]
  );
  const activeUserInputRequest = useMemo(
    () =>
      resendFromUserIndex === null
        ? composerMode === "team"
          ? (teamSession?.pendingUserInput ?? null)
          : currentId
            ? (rootUserInputRequestsByThread[currentId] ?? null)
            : null
        : null,
    [
      composerMode,
      currentId,
      resendFromUserIndex,
      rootUserInputRequestsByThread,
      teamSession,
    ]
  );
  const hasActiveTeamSidebarContent = useMemo(
    () =>
      composerMode === "team" && buildTeamWorkflowItems(teamSession).length > 0,
    [composerMode, teamSession]
  );

  const agentPlanSidebarAutopenRef = useRef(false);

  useEffect(() => {
    if (!defaultModel.trim() || !showEditorPlanDocumentInCenter) {
      return;
    }
    setEditorPlanBuildModelId((prev) => (prev.trim() ? prev : defaultModel));
  }, [defaultModel, showEditorPlanDocumentInCenter]);

  useEffect(() => {
    if (!hasAgentPlanSidebarContent) {
      agentPlanSidebarAutopenRef.current = false;
      return;
    }
    if (!agentPlanSidebarAutopenRef.current) {
      setAgentRightSidebarView("plan");
      setAgentRightSidebarOpen(true);
    }
    agentPlanSidebarAutopenRef.current = true;
  }, [hasAgentPlanSidebarContent]);

  useEffect(() => {
    if (agentRightSidebarView === "plan" && !hasAgentPlanSidebarContent) {
      setAgentRightSidebarOpen(false);
      setAgentRightSidebarView("git");
    }
  }, [agentRightSidebarView, hasAgentPlanSidebarContent]);

  useEffect(() => {
    if (agentRightSidebarView === "team" && !hasActiveTeamSidebarContent) {
      setAgentRightSidebarOpen(false);
      setAgentRightSidebarView(hasAgentPlanSidebarContent ? "plan" : "git");
    }
  }, [
    agentRightSidebarView,
    hasActiveTeamSidebarContent,
    hasAgentPlanSidebarContent,
  ]);

  useEffect(() => {
    if (!workspace && agentFilePreview) {
      setAgentFilePreview(null);
    }
    if (agentRightSidebarView === "file" && !agentFilePreview?.relPath) {
      setAgentRightSidebarView(hasAgentPlanSidebarContent ? "plan" : "git");
    }
  }, [
    agentFilePreview,
    agentRightSidebarView,
    hasAgentPlanSidebarContent,
    workspace,
  ]);
  const onMonacoMount = useCallback(
    (ed: MonacoEditorNS.IStandaloneCodeEditor) => {
      monacoDiffChangeDisposableRef.current?.dispose();
      monacoDiffChangeDisposableRef.current = null;
      monacoEditorRef.current = ed;
    },
    []
  );

  const onMonacoDiffMount = useCallback(
    (diffEditor: MonacoEditorNS.IStandaloneDiffEditor) => {
      monacoDiffChangeDisposableRef.current?.dispose();
      monacoDiffChangeDisposableRef.current = null;
      monacoEditorRef.current = diffEditor.getModifiedEditor();
    },
    []
  );

  const searchWorkspaceSymbolsFn = useCallback(
    async (query: string) => {
      if (!shell) {
        return [];
      }
      const r = (await shell.invoke("workspace:searchSymbols", query)) as {
        ok?: boolean;
        hits?: { name: string; path: string; line: number; kind: string }[];
      };
      return r.ok && Array.isArray(r.hits) ? r.hits : [];
    },
    [shell]
  );

  const openQuickOpen = useCallback((seed = "") => {
    setQuickOpenSeed(seed);
    setQuickOpenOpen(true);
  }, []);

  const focusSearchSidebarFromQuickOpen = useCallback((q: string) => {
    setSidebarSearchDraft(q);
    setQuickOpenSeed(`%${q}`);
    setQuickOpenOpen(true);
  }, []);

  const workspaceExplorerActions = useWorkspaceExplorerActions({
    activeTabId,
    appendEditorTerminal,
    clearStreamingToolPreviewNow,
    composerRichBottomRef,
    composerRichHeroRef,
    filePath,
    firstTokenAtRef,
    flashComposerAttachErr,
    loadMessages,
    openFileInTab,
    refreshGit,
    refreshThreads,
    resetLiveAgentBlocks,
    setActiveTabId,
    setAwaitingReply,
    setComposerSegments,
    setCurrentId,
    setEditorTerminalVisible,
    setEditorValue,
    setFilePath,
    setInlineResendSegments,
    setLastTurnUsage,
    setLayoutMode,
    setOpenTabs,
    setParsedPlan,
    setPlanFilePath,
    setPlanFileRelPath,
    setResendFromUserIndex,
    setStreaming,
    setStreamingThinking,
    setStreamingThreadId,
    shell,
    streamStartedAtRef,
    t,
    workspace,
  });

  useEffect(() => {
    if (!editorTerminalVisible || !workspace || layoutMode !== "editor") {
      return;
    }
    if (editorTerminalSessions.length > 0) {
      return;
    }
    void appendEditorTerminal();
  }, [
    editorTerminalVisible,
    workspace,
    layoutMode,
    editorTerminalSessions.length,
    appendEditorTerminal,
  ]);

  useEffect(() => {
    if (editorTerminalSessions.length === 0) {
      setActiveEditorTerminalId(null);
      return;
    }
    setActiveEditorTerminalId((cur) =>
      cur && editorTerminalSessions.some((s) => s.id === cur)
        ? cur
        : editorTerminalSessions[0]!.id
    );
  }, [editorTerminalSessions]);

  const {
    zoomInUi,
    zoomOutUi,
    resetUiZoom,
    toggleFullscreen,
    windowMenuMinimize,
    windowMenuToggleMaximize,
    windowMenuCloseWindow,
  } = useUiZoom({ setUiZoom, setWindowMaximized, shell });

  const onEditorTerminalSessionExit = useCallback(
    (id: string) => {
      setEditorTerminalSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          setEditorTerminalVisible(false);
        }
        return next;
      });
    },
    [setEditorTerminalSessions, setEditorTerminalVisible]
  );

  useEffect(() => {
    const entries: {
      id: "file" | "edit" | "view" | "window" | "terminal" | "help";
      ref: RefObject<HTMLDivElement | null>;
    }[] = [
      { id: "file", ref: fileMenuRef },
      { id: "edit", ref: editMenuRef },
      { id: "view", ref: viewMenuRef },
      { id: "window", ref: windowMenuRef },
      { id: "terminal", ref: terminalMenuRef },
      { id: "help", ref: helpMenuRef },
    ];
    const open = entries.find((e) => menubarMenus[e.id]);
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (open.ref.current?.contains(e.target as Node)) {
        return;
      }
      setMenubarMenu(open.id, false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menubarMenus, setMenubarMenu]);

  useEffect(() => {
    if (!windowMenuOpen || !shell) {
      return;
    }
    let cancelled = false;
    void shell.invoke("app:windowGetState").then((r) => {
      if (cancelled) {
        return;
      }
      const o = r as { ok?: boolean; maximized?: boolean };
      if (o?.ok && typeof o.maximized === "boolean") {
        setWindowMaximized(o.maximized);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [windowMenuOpen, shell]);

  // Ctrl/Cmd+P quick open, Ctrl/Cmd+Shift+P command mode (VS Code-style)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (quickOpenOpen) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== "p" || e.altKey) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        openQuickOpen(">");
      } else {
        openQuickOpen("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickOpenOpen, openQuickOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        return;
      }
      const key = e.key.toLowerCase();
      const typing = isEditableDomTarget(e.target);
      if (
        typing &&
        !["b", "j", "f", "[", "]", "-", "=", "+", "0"].includes(key)
      ) {
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "b") {
        e.preventDefault();
        toggleSidebarVisibility();
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "j") {
        if (layoutMode === "editor" && workspace) {
          e.preventDefault();
          toggleTerminalVisibility();
        }
        return;
      }
      if (!e.shiftKey && e.altKey && key === "b") {
        if (layoutMode === "agent") {
          e.preventDefault();
          toggleDiffPanelVisibility();
        }
        return;
      }
      if (!e.shiftKey && !e.altKey && key === "f") {
        e.preventDefault();
        openQuickOpen("");
        return;
      }
      if (e.shiftKey && !e.altKey && e.key === "[") {
        e.preventDefault();
        void goToPreviousThread();
        return;
      }
      if (e.shiftKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        void goToNextThread();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "[") {
        e.preventDefault();
        void goThreadBack();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        void goThreadForward();
        return;
      }
      if (!e.shiftKey && !e.altKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomInUi();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "-") {
        e.preventDefault();
        zoomOutUi();
        return;
      }
      if (!e.shiftKey && !e.altKey && e.key === "0") {
        e.preventDefault();
        resetUiZoom();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    layoutMode,
    workspace,
    openQuickOpen,
    toggleSidebarVisibility,
    toggleTerminalVisibility,
    toggleDiffPanelVisibility,
    goToPreviousThread,
    goToNextThread,
    goThreadBack,
    goThreadForward,
    zoomInUi,
    zoomOutUi,
    resetUiZoom,
  ]);

  useEffect(() => {
    const ed = monacoEditorRef.current;
    const range = pendingEditorHighlightRangeRef.current;
    if (!ed || !filePath.trim() || !range) {
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const model = ed.getModel();
          if (!model) {
            return;
          }
          const lc = model.getLineCount();
          const start = Math.max(1, Math.min(range.start, lc));
          const end = Math.max(start, Math.min(range.end, lc));
          /* 以读取区间的第一行为锚点（勿用区间中点），避免看起来像跳到末行 */
          ed.setPosition({ column: 1, lineNumber: start });
          ed.revealLineInCenter(start);
          const endCol = model.getLineMaxColumn(end);
          const decorations = ed.deltaDecorations(
            [],
            [
              {
                options: {
                  className: "ref-editor-highlight-line",
                  isWholeLine: true,
                  overviewRuler: { color: "rgba(212,175,55,0.6)", position: 1 },
                },
                range: {
                  endColumn: endCol,
                  endLineNumber: end,
                  startColumn: 1,
                  startLineNumber: start,
                },
              },
            ]
          );
          window.setTimeout(() => {
            try {
              ed.deltaDecorations(decorations, []);
            } catch {
              /* ignore */
            }
          }, 6500);
          pendingEditorHighlightRangeRef.current = null;
        } catch {
          /* 模型尚未就绪时忽略 */
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [editorValue, filePath]);

  const composerRichSurface = useMemo(
    () => ({
      bottom: composerRichBottomRef,
      hero: composerRichHeroRef,
      inline: composerRichInlineRef,
    }),
    []
  );

  /** 勿每轮 render 新建箭头传入 slash/at hooks，否则 applySlashSelection/handle*KeyDown 全链抖动 → sharedComposerProps 永久失效 */
  const getComposerSegmentsSetter = useCallback(
    (slot: AtComposerSlot) =>
      slot === "inline" && resendIdxRef.current !== null
        ? setInlineResendSegments
        : setComposerSegments,
    [setInlineResendSegments, setComposerSegments]
  );
  const composerPlusSkills = useMemo(
    () =>
      (mergedAgentCustomization.skills ?? [])
        .filter(
          (skill) => skill.enabled !== false && skill.slug.trim().length > 0
        )
        .map((skill) => ({
          description:
            skill.description.trim() || skill.content.trim().slice(0, 140),
          id: skill.id,
          name: skill.name,
          slug: skill.slug.trim(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [mergedAgentCustomization.skills]
  );

  const atMention = useComposerAtMention(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      currentThreadTitle,
      editorPreviewFile: editorSidebarSelectedRel,
      fileIndexReadyTick: atFileIndexReadyTick,
      gitChangedPaths,
      layoutMode,
      onFileChipPreview: onAtMentionFileChipPreview,
      searchFiles,
      workspaceOpen: !!workspace,
    }
  );
  const skillInvoke = useComposerSkillInvoke(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      skills: composerPlusSkills,
    }
  );
  const slashCommand = useComposerSlashCommand(
    getComposerSegmentsSetter,
    composerRichSurface,
    {
      t,
      userCommands: mergedAgentCustomization.commands,
    }
  );
  const syncComposerOverlays = useCallback(
    (root: HTMLElement, slot: AtComposerSlot) => {
      const slice = textBeforeCaretForAt(root);
      const caret = slice.length;
      if (getAtMentionRange(slice, caret)) {
        skillInvoke.closeSkillMenu();
        slashCommand.closeSlashMenu();
        atMention.syncAtFromRich(root, slot);
        return;
      }
      atMention.syncAtFromRich(root, slot);
      skillInvoke.syncSkillFromRich(root, slot);
      slashCommand.syncSlashFromRich(root, slot);
    },
    [
      atMention.syncAtFromRich,
      skillInvoke.closeSkillMenu,
      skillInvoke.syncSkillFromRich,
      slashCommand.closeSlashMenu,
      slashCommand.syncSlashFromRich,
    ]
  );
  closeAtMenuLatestRef.current = atMention.closeAtMenu;

  useEffect(() => {
    if (resendFromUserIndex === null) {
      return;
    }
    const onDocPointerDown = (ev: PointerEvent) => {
      const t = ev.target;
      if (!(t instanceof Node)) {
        return;
      }
      if (inlineResendRootRef.current?.contains(t)) {
        return;
      }
      if (
        t instanceof Element &&
        t.closest(
          ".ref-at-menu, .ref-slash-menu, .ref-skill-menu, .ref-model-dd, .ref-plus-menu, .ref-plus-submenu"
        )
      ) {
        return;
      }
      closeAtMenuLatestRef.current();
      skillInvoke.closeSkillMenu();
      slashCommand.closeSlashMenu();
      composerRichInlineRef.current?.blur();
      setResendFromUserIndex(null);
      setInlineResendSegments([]);
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [
    resendFromUserIndex,
    skillInvoke.closeSkillMenu,
    slashCommand.closeSlashMenu,
  ]);

  const onCommit = useCallback(
    async (
      action: "commit" | "commit-push" | "commit-pr",
      options: { includeUnstaged: boolean; isDraft: boolean; message: string }
    ): Promise<{ ok: boolean; error?: string; prUrl?: string }> => {
      if (!shell) {
        return { error: "Shell unavailable", ok: false };
      }
      const message =
        options.message.trim() ||
        buildAutogeneratedCommitMessage(
          agentGitPackRef.current.gitChangedPaths
        );
      setGitActionError(null);
      try {
        if (options.includeUnstaged) {
          const stage = (await shell.invoke("git:stageAll")) as
            | { ok?: boolean; error?: string }
            | undefined;
          if (stage && stage.ok === false) {
            const err = stage.error ?? "git add failed";
            setGitActionError(err);
            return { error: err, ok: false };
          }
        } else {
          const probe = (await shell.invoke("git:hasStaged")) as
            | { ok?: boolean; hasStaged?: boolean; error?: string }
            | undefined;
          if (probe?.ok === false) {
            const err = probe.error ?? "git diff --cached failed";
            setGitActionError(err);
            return { error: err, ok: false };
          }
          if (!probe?.hasStaged) {
            const err = t("app.commitNothingStaged");
            setGitActionError(err);
            return { error: err, ok: false };
          }
        }
        const commit = (await shell.invoke("git:commit", message)) as
          | { ok?: boolean; error?: string }
          | undefined;
        if (commit && commit.ok === false) {
          const err = commit.error ?? "git commit failed";
          setGitActionError(err);
          return { error: err, ok: false };
        }
        setCommitMsg("");

        if (action === "commit") {
          await refreshGit();
          return { ok: true };
        }

        const remote = (await shell.invoke("git:remoteInfo")) as
          | {
              ok?: boolean;
              branch?: string;
              hasUpstream?: boolean;
              remoteUrl?: string;
              defaultBranch?: string;
              error?: string;
            }
          | undefined;

        const branch = remote?.branch ?? "";
        let pushResult: { ok?: boolean; error?: string } | undefined;
        if (remote?.ok && remote.hasUpstream) {
          pushResult = (await shell.invoke("git:push")) as
            | { ok?: boolean; error?: string }
            | undefined;
        } else if (branch) {
          pushResult = (await shell.invoke("git:pushSetUpstream", {
            branch,
          })) as { ok?: boolean; error?: string } | undefined;
        } else {
          pushResult = (await shell.invoke("git:push")) as
            | { ok?: boolean; error?: string }
            | undefined;
        }
        if (pushResult && pushResult.ok === false) {
          const err = pushResult.error ?? t("app.pushFailed");
          setGitActionError(err);
          await refreshGit();
          return { error: err, ok: false };
        }

        if (action === "commit-pr") {
          const { buildCompareUrl } = await import("./gitRemoteUrl");
          const compareUrl = buildCompareUrl(
            remote?.remoteUrl ?? "",
            branch,
            remote?.defaultBranch || ""
          );
          if (!compareUrl) {
            const err = t("app.commitPrNoRemote");
            setGitActionError(err);
            await refreshGit();
            return { error: err, ok: false };
          }
          const finalUrl =
            options.isDraft && /github\.com/i.test(compareUrl)
              ? `${compareUrl}${compareUrl.includes("?") ? "&" : "?"}draft=1`
              : compareUrl;
          const open = (await shell.invoke(
            "shell:openExternalUrl",
            finalUrl
          )) as { ok?: boolean; error?: string } | undefined;
          if (open && open.ok === false) {
            const err = open.error ?? "Could not open PR link";
            setGitActionError(err);
            await refreshGit();
            return { error: err, ok: false, prUrl: finalUrl };
          }
          await refreshGit();
          return { ok: true, prUrl: finalUrl };
        }

        await refreshGit();
        return { ok: true };
      } catch (e) {
        const err = String(e);
        setGitActionError(err);
        return { error: err, ok: false };
      }
    },
    [shell, t, setGitActionError, setCommitMsg, refreshGit]
  );

  /**
   * 从 localStorage 恢复「已保留/已撤销全部」或逐文件忽略，绑定当前线程最后一条助手正文。
   * 降级为 useEffect（不涉及 DOM 测量）：主路径已由 onMessagesLoaded 在 startTransition
   * 内同批设置，此处仅作为 streaming 期间和 currentId 变化的兜底。
   * hash 相同时 restoreFileChangesState 内部短路，不触发额外 setState。
   */
  useEffect(() => {
    restoreFileChangesState(currentId, messages, messagesThreadId);
  }, [currentId, messages, messagesThreadId, restoreFileChangesState]);

  /**
   * Plan：切回线程或 loadMessages 完成后，若最后一条仍是带 QUESTIONS 的助手消息则恢复弹窗。
   * 降级为 useEffect（不涉及 DOM 测量/同步布局），消除 messages 变化引起的额外同步 render 轮次。
   */
  useEffect(() => {
    if (!currentId || messagesThreadId !== currentId) {
      setPlanQuestion(null);
      setPlanQuestionRequestId(null);
      return;
    }
    /* Team 模式：澄清题由 IPC plan_question_request 驱动，勿按 Plan 逻辑清空 */
    if (composerMode === "team") {
      if (resendFromUserIndex !== null) {
        setPlanQuestion(null);
        setPlanQuestionRequestId(null);
      }
      return;
    }
    if (composerMode !== "plan") {
      if (resendFromUserIndex !== null || !planQuestionRequestId) {
        setPlanQuestion(null);
        setPlanQuestionRequestId(null);
      }
      return;
    }
    if (resendFromUserIndex !== null) {
      setPlanQuestion(null);
      setPlanQuestionRequestId(null);
      return;
    }
    if (awaitingReply) {
      /* ask_plan_question 阻塞主进程时仍需保留弹窗与 requestId */
      if (!planQuestionRequestId) {
        setPlanQuestion(null);
        setPlanQuestionRequestId(null);
      }
      return;
    }
    const pending = pendingPlanQuestionFromMessages(messages);
    const lastAsst = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const hash = lastAsst ? hashAgentAssistantContent(lastAsst.content) : "";
    const dismissedHash =
      planQuestionDismissedByThreadRef.current.get(currentId);
    if (pending && dismissedHash === hash) {
      setPlanQuestion(null);
      setPlanQuestionRequestId(null);
      return;
    }
    if (pending) {
      setPlanQuestion(pending);
      setPlanQuestionRequestId(null);
    } else {
      setPlanQuestion(null);
      setPlanQuestionRequestId(null);
    }
  }, [
    currentId,
    messagesThreadId,
    messages,
    composerMode,
    resendFromUserIndex,
    awaitingReply,
    planQuestionRequestId,
  ]);

  const {
    messagesViewportRef,
    messagesTrackRef,
    pinMessagesToBottomRef,
    showScrollToBottomButton,
    onMessagesScroll,
    scrollMessagesToBottom,
    scheduleMessagesScrollToBottom,
    syncMessagesScrollIndicators,
  } = useMessagesScroll({
    awaitingReply,
    currentId,
    currentIdRef,
    hasConversation,
    messages,
    messagesThreadId,
    messagesThreadIdRef,
  });

  useEffect(() => {
    if (composerRichAutoHeightRafRef.current !== null) {
      cancelAnimationFrame(composerRichAutoHeightRafRef.current);
      composerRichAutoHeightRafRef.current = null;
    }
    const applyFollowupHeight = (el: HTMLDivElement | null) => {
      if (!el) {
        return;
      }
      el.style.height = "0px";
      const next = Math.min(140, Math.max(38, el.scrollHeight));
      el.style.height = `${next}px`;
    };
    const applyInlineEditHeight = (el: HTMLDivElement | null) => {
      if (!el) {
        return;
      }
      el.style.height = "0px";
      const next = Math.min(200, Math.max(72, el.scrollHeight));
      el.style.height = `${next}px`;
    };
    const run = () => {
      composerRichAutoHeightRafRef.current = null;
      if (!hasConversation) {
        const h = composerRichHeroRef.current;
        if (h) {
          h.style.height = "";
        }
      }
      applyFollowupHeight(composerRichBottomRef.current);
      applyInlineEditHeight(composerRichInlineRef.current);
    };
    composerRichAutoHeightRafRef.current = requestAnimationFrame(run);
    return () => {
      if (composerRichAutoHeightRafRef.current !== null) {
        cancelAnimationFrame(composerRichAutoHeightRafRef.current);
        composerRichAutoHeightRafRef.current = null;
      }
    };
  }, [
    hasConversation,
    composerSegments,
    inlineResendSegments,
    resendFromUserIndex,
  ]);

  useEffect(() => {
    if (resendFromUserIndex === null) {
      return;
    }
    const id = requestAnimationFrame(() => {
      composerRichInlineRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [resendFromUserIndex]);

  const composerPlaceholder = useMemo(() => {
    switch (composerMode) {
      case "ask":
        return t("composer.placeholder.ask");
      case "plan":
        return t("composer.placeholder.plan");
      case "team":
        return t("composer.placeholder.team");
      case "debug":
        return t("composer.placeholder.debug");
      case "agent":
      default:
        return t("composer.placeholder.agent");
    }
  }, [composerMode, t]);

  /** 有会话时底部胶囊：Cursor 式短占位 */
  const followUpComposerPlaceholder = useMemo(() => {
    switch (composerMode) {
      case "ask":
        return t("composer.followup.ask");
      case "plan":
        return t("composer.followup.plan");
      case "team":
        return t("composer.followup.team");
      case "debug":
        return t("composer.followup.debug");
      case "agent":
      default:
        return t("composer.followup.default");
    }
  }, [composerMode, t]);

  const onPlanNewIdea = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      setComposerModePersist("plan");
      void onNewThread();
    }
  };

  const { onSelectTeamTask, onTeamPlanApprove, onTeamPlanReject } =
    useTeamSessionActions({
      currentId,
      layoutMode,
      markTeamPlanProposalDecided,
      setAgentRightSidebarOpen,
      setAgentRightSidebarView,
      setSelectedTask,
      shell,
    });

  const {
    onSelectAgentSession,
    onSendAgentInput,
    onSubmitAgentUserInput,
    onWaitAgent,
    onResumeAgent,
    onCloseAgent,
    onOpenAgentTranscript,
    onSubAgentToastClick,
  } = useAgentSessionActions({
    agentRightSidebarOpen,
    agentRightSidebarView,
    currentId,
    currentIdRef,
    getAgentSession,
    loadMessages,
    onMessagesLoaded,
    setAgentRightSidebarOpen,
    setAgentRightSidebarView,
    setCurrentId,
    setSelectedAgent,
    shell,
    showTransientToast,
    t,
  });

  useEffect(() => {
    const onResize = () => {
      setRailWidths((prev) => {
        const next = clampSidebarLayout(prev.left, prev.right);
        return next.left === prev.left && next.right === prev.right
          ? prev
          : next;
      });
      setEditorTerminalHeightPx((h) => clampEditorTerminalHeight(h));
    };
    window.addEventListener("resize", onResize);
    const unsubLayout = window.maiShell?.subscribeLayout?.(onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      unsubLayout?.();
    };
  }, []);

  const {
    beginResizeLeft,
    beginResizeRight,
    beginResizeEditorTerminal,
    resetRailWidths,
  } = useResizeRails({
    editorTerminalHeightLsKey,
    editorTerminalHeightPx,
    railWidths,
    setEditorTerminalHeightPx,
    setRailWidths,
    shell,
    sidebarLayoutStorageKey,
  });

  useEffect(() => {
    if (!editorThreadHistoryOpen && !editorChatMoreOpen) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const node = e.target as Node;
      if (editorHistoryMenuRef.current?.contains(node)) {
        return;
      }
      if (editorMoreMenuRef.current?.contains(node)) {
        return;
      }
      setEditorThreadHistoryOpen(false);
      setEditorChatMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [editorThreadHistoryOpen, editorChatMoreOpen]);

  const onBeforeToggleGitBranchPicker = useCallback(() => {
    setPlusMenuOpen(false);
    setModelPickerOpen(false);
  }, []);

  const composerContextMeter = useMemo(() => {
    if (!hasSelectedModel || !defaultModel.trim()) {
      return null;
    }
    const entry = modelEntries.find((e) => e.id === defaultModel);
    const raw = entry?.contextWindowTokens;
    const isDefaultMax = raw == null || !Number.isFinite(raw) || raw <= 0;
    const maxTokens = isDefaultMax
      ? DEFAULT_CONTEXT_WINDOW_TOKENS_UI
      : Math.floor(raw);
    const usedEstimate = computeComposerContextUsedEstimate({
      composerSegments,
      messages,
    });
    return { isDefaultMax, maxTokens, usedEstimate };
  }, [
    hasSelectedModel,
    defaultModel,
    modelEntries,
    messages,
    composerSegments,
  ]);

  // 共享给 ChatComposer（send/abort/newThread/openFile 由 ComposerActionsContext 注入，避免对象整体因箭头函数重建）
  const sharedComposerProps = useMemo(
    () => ({
      atMentionKeyDown: atMention.handleAtKeyDown,
      awaitingReply,
      composerContextMeter,
      composerGitBranchAnchorRef,
      composerMode,
      composerPlaceholder,
      composerRichBottomRef,
      composerRichHeroRef,
      composerRichInlineRef,
      followUpComposerPlaceholder,
      hasConversation,
      modelPickerOpen,
      modelPillBottomRef,
      modelPillHeroRef,
      modelPillInlineRef,
      modelPillLabel,
      onBeforeToggleGitBranchPicker,
      persistComposerAttachments,
      plusAnchorBottomRef,
      plusAnchorHeroRef,
      plusAnchorInlineRef,
      plusMenuOpen,
      resendFromUserIndex,
      setInlineResendSegments,
      setModelPickerAnchorSlot,
      setModelPickerOpen,
      setPlusMenuAnchorSlot,
      setPlusMenuOpen,
      setResendFromUserIndex,
      skillInvokeKeyDown: skillInvoke.handleSkillKeyDown,
      slashCommandKeyDown: slashCommand.handleSlashKeyDown,
      syncComposerOverlays,
    }),
    [
      composerRichHeroRef,
      composerRichBottomRef,
      composerRichInlineRef,
      plusAnchorHeroRef,
      plusAnchorBottomRef,
      plusAnchorInlineRef,
      modelPillHeroRef,
      modelPillBottomRef,
      modelPillInlineRef,
      composerMode,
      hasConversation,
      composerPlaceholder,
      followUpComposerPlaceholder,
      plusMenuOpen,
      modelPickerOpen,
      modelPillLabel,
      awaitingReply,
      resendFromUserIndex,
      composerGitBranchAnchorRef,
      onBeforeToggleGitBranchPicker,
      composerContextMeter,
      setPlusMenuAnchorSlot,
      setModelPickerOpen,
      setPlusMenuOpen,
      setModelPickerAnchorSlot,
      persistComposerAttachments,
      syncComposerOverlays,
      setResendFromUserIndex,
      setInlineResendSegments,
      skillInvoke.handleSkillKeyDown,
      slashCommand.handleSlashKeyDown,
      atMention.handleAtKeyDown,
    ]
  );

  /** 内联编辑历史用户消息：v2 消息直接还原 parts；旧消息启发式解析 @ 引用（不拉全量路径列表） */
  const onStartInlineResend = useCallback(
    (userMessageIndex: number, content: string, parts?: UserMessagePart[]) => {
      setPlanQuestion(null);
      setPlanQuestionRequestId(null);
      if (currentId) {
        clearAgentSession(currentId);
      }
      if (agentRightSidebarView === "agents") {
        setAgentRightSidebarOpen(false);
      }
      setResendFromUserIndex(userMessageIndex);
      if (parts && parts.length > 0) {
        setInlineResendSegments(partsToSegments(parts));
        return;
      }
      setInlineResendSegments(
        userMessageToSegments(
          content,
          undefined,
          (mergedAgentCustomization.commands ?? []).map(
            (command) => command.slash
          )
        )
      );
    },
    [
      agentRightSidebarView,
      clearAgentSession,
      currentId,
      mergedAgentCustomization.commands,
      setPlanQuestion,
      setPlanQuestionRequestId,
    ]
  );

  const plusMenuAnchorRefForDropdown =
    plusMenuAnchorSlot === "hero"
      ? plusAnchorHeroRef
      : plusMenuAnchorSlot === "bottom"
        ? plusAnchorBottomRef
        : plusAnchorInlineRef;
  const modelPickerAnchorRefForDropdown =
    modelPickerAnchorSlot === "hero"
      ? modelPillHeroRef
      : modelPickerAnchorSlot === "bottom"
        ? modelPillBottomRef
        : modelPillInlineRef;

  const renderThreadItem = useCallback(
    (th: ThreadInfo, threadListWorkspace?: string | null) => (
      <ThreadItem
        beginThreadTitleEdit={beginThreadTitleEdit}
        cancelThreadTitleEdit={cancelThreadTitleEdit}
        commitThreadTitleEdit={commitThreadTitleEdit}
        confirmDeleteId={confirmDeleteId}
        currentId={currentId}
        editingThreadId={editingThreadId}
        editingThreadTitleDraft={editingThreadTitleDraft}
        key={th.id}
        onDeleteThread={onDeleteThread}
        onSelectThread={onSelectThread}
        setEditingThreadTitleDraft={setEditingThreadTitleDraft}
        t={t}
        th={th}
        threadListWorkspace={threadListWorkspace}
        threadTitleDraftRef={threadTitleDraftRef}
        threadTitleInputRef={threadTitleInputRef}
        workspace={workspace}
      />
    ),
    [
      currentId,
      editingThreadId,
      editingThreadTitleDraft,
      t,
      setEditingThreadTitleDraft,
      threadTitleDraftRef,
      threadTitleInputRef,
      commitThreadTitleEdit,
      cancelThreadTitleEdit,
      beginThreadTitleEdit,
      onSelectThread,
      confirmDeleteId,
      onDeleteThread,
      workspace,
    ]
  );

  const renderAgentSidebarThreadItem = useCallback(
    (th: ThreadInfo, threadListWorkspace?: string | null) => (
      <AgentSidebarThreadItem
        awaitingReply={awaitingReply}
        beginThreadTitleEdit={beginThreadTitleEdit}
        cancelThreadTitleEdit={cancelThreadTitleEdit}
        commitThreadTitleEdit={commitThreadTitleEdit}
        confirmDeleteId={confirmDeleteId}
        currentId={currentId}
        editingThreadId={editingThreadId}
        editingThreadTitleDraft={editingThreadTitleDraft}
        hasUnreadAgentReply={unreadAgentThreadIds.has(th.id)}
        key={th.id}
        onDeleteThread={onDeleteThread}
        onSelectThread={async (id, root) => {
          clearAgentThreadUnread(id);
          await onSelectThread(id, root);
        }}
        setEditingThreadTitleDraft={setEditingThreadTitleDraft}
        streamingThreadId={awaitingReply ? streamingThreadId : null}
        t={t}
        th={th}
        threadListWorkspace={threadListWorkspace}
        threadTitleDraftRef={threadTitleDraftRef}
        threadTitleInputRef={threadTitleInputRef}
        workspace={workspace}
      />
    ),
    [
      currentId,
      unreadAgentThreadIds,
      awaitingReply,
      streamingThreadId,
      editingThreadId,
      editingThreadTitleDraft,
      t,
      setEditingThreadTitleDraft,
      threadTitleDraftRef,
      threadTitleInputRef,
      commitThreadTitleEdit,
      cancelThreadTitleEdit,
      beginThreadTitleEdit,
      clearAgentThreadUnread,
      onSelectThread,
      confirmDeleteId,
      onDeleteThread,
      workspace,
    ]
  );

  const agentLeftSidebarProps = useAgentLeftSidebarProps({
    agentSidebarWorkspaces,
    cancelWorkspaceAliasEdit,
    closeWorkspaceMenu,
    commitWorkspaceAliasEdit,
    editingWorkspaceNameDraft,
    editingWorkspacePath,
    handleWorkspacePrimaryAction,
    maiAccount,
    onNewThread: composerInvokeNewThread,
    onNewThreadForWorkspace,
    openMaiAccount: openMaiAccountModal,
    openQuickOpen,
    openSettingsPage,
    openUniversalTerminal: () => {
      void shell?.invoke("terminalWindow:open", { startPage: true });
    },
    openWorkspaceMenu,
    renderThreadItem: renderAgentSidebarThreadItem,
    setEditingWorkspaceNameDraft,
    setWorkspacePickerOpen,
    t,
    workspaceMenuPath,
    workspaceNameDraftRef,
    workspaceNameInputRef,
  });

  /** 未打开工作区时：Agent / Editor 均显示同一套欢迎页（打开项目、最近项目等） */
  const isEditorHomeMode = !workspace;
  const agentPlanSummaryCard = useMemo(
    () =>
      !awaitingReply && agentPlanEffectivePlan && composerMode === "plan" ? (
        <section
          aria-label={t("plan.review.label")}
          className="ref-plan-brief-card"
        >
          <div className="ref-plan-brief-head">
            <div className="ref-plan-brief-title-stack">
              <span className="ref-plan-brief-kicker">
                {t("plan.review.label")}
              </span>
              <strong className="ref-plan-brief-title">
                {agentPlanEffectivePlan.name}
              </strong>
            </div>
            <div className="ref-plan-brief-actions">
              <button
                className="ref-plan-brief-review-btn"
                onClick={() => openAgentRightSidebarView("plan")}
                type="button"
              >
                {t("plan.review.reviewButton")}
              </button>
              <button
                className="ref-agent-plan-build-btn ref-agent-plan-build-btn--summary"
                disabled={
                  awaitingReply ||
                  !agentPlanEffectivePlan ||
                  !agentPlanBuildModelId.trim() ||
                  modelPickerItems.length === 0
                }
                onClick={() => onPlanBuild(agentPlanBuildModelId)}
                type="button"
              >
                {t("plan.review.build")}
              </button>
            </div>
          </div>
          <div className="ref-plan-brief-goal">
            <span className="ref-plan-brief-item-label">
              {t("plan.review.goal")}
            </span>
            <div className="ref-plan-brief-goal-markdown">
              <ChatMarkdown
                content={
                  agentPlanGoalMarkdown ||
                  agentPlanGoalSummary ||
                  agentPlanEffectivePlan.overview ||
                  t("plan.review.summaryEmpty")
                }
              />
            </div>
          </div>
        </section>
      ) : null,
    [
      awaitingReply,
      agentPlanEffectivePlan,
      composerMode,
      t,
      openAgentRightSidebarView,
      agentPlanBuildModelId,
      modelPickerItems,
      onPlanBuild,
      agentPlanGoalMarkdown,
      agentPlanGoalSummary,
    ]
  );

  const agentChatPanelProps = useAgentChatPanelProps({
    agentPlanEffectivePlan,
    agentPlanSummaryCard,
    agentReviewBusy,
    agentSession,
    awaitingReply,
    canSendComposer,
    canSendInlineResend,
    composerMode,
    composerSegments,
    currentId,
    defaultModel,
    dismissedFiles,
    editorPlanReviewDismissed,
    executeRuleWizardSend,
    executeSkillCreatorSend,
    executeSubagentWizardSend,
    fileChangesDismissed,
    firstTokenAtRef,
    hasConversation,
    inlineResendRootRef,
    inlineResendSegments,
    knownSlashCommands: (mergedAgentCustomization.commands ?? []).map(
      (command) => command.slash
    ),
    lastTurnUsage,
    messagesThreadId,
    messagesTrackRef,
    messagesViewportRef,
    mistakeLimitRequest,
    modelPickerItems,
    onAgentConversationOpenFile,
    onApplyAgentPatchesAll,
    onApplyAgentPatchOne,
    onChatPanelDropFiles,
    onDiscardAgentReview,
    onDismissRevertNotice: () => setRevertNotice(null),
    onExplorerOpenFile,
    onKeepAllEdits,
    onKeepFileEdit,
    onMessagesScroll,
    onPlanBuild,
    onPlanQuestionSkip,
    onPlanQuestionSubmit,
    onPlanReviewClose,
    onPlanTodoToggle,
    onRevertAllEdits,
    onRevertFileEdit,
    onSelectAgentSession,
    onSelectTeamExpert: onSelectTeamTask,
    onStartInlineResend,
    onTeamPlanApprove,
    onTeamPlanReject,
    onUserInputSubmit,
    pendingAgentPatches,
    persistedMessages: messages,
    planFilePath,
    planFileRelPath,
    planQuestion: activePlanQuestion,
    planReviewIsBuilt,
    resendFromUserIndex,
    respondMistakeLimit,
    respondToolApproval,
    revertableSnapshotPaths,
    revertedChangeKeys,
    revertedFiles,
    revertNotice,
    scheduleMessagesScrollToBottom,
    scrollMessagesToBottom,
    setComposerSegments,
    setInlineResendSegments,
    setWizardPending,
    sharedComposerProps,
    shell,
    showScrollToBottomButton,
    snapshotPaths: EMPTY_SNAPSHOT_PATHS,
    streamStartedAtRef,
    t,
    teamSession,
    thoughtSecondsByThread,
    toolApprovalRequest,
    userInputRequest: activeUserInputRequest,
    wizardPending,
    workspace,
    workspaceBasename,
  });

  const agentRightSidebarProps = useAgentRightSidebarProps({
    agentFilePreview,
    agentFilePreviewBusyPatch,
    agentPlanBuildModelId,
    agentPlanEffectivePlan,
    agentPlanTodoDoneCount,
    agentPlanTodos,
    agentSession,
    awaitingReply,
    commitMsg,
    currentThreadId: currentId,
    hasAgentPlanSidebarContent,
    onAcceptAgentFilePreviewHunk,
    onCloseAgent,
    onCommit,
    onExplorerOpenFile,
    onOpenAgentTranscript,
    onOpenBrowserSettings: openBrowserSettingsPage,
    onOpenTeamAgentFile: onAgentConversationOpenFile,
    onPlanAddTodo,
    onPlanAddTodoCancel,
    onPlanAddTodoSubmit,
    onPlanBuild,
    onPlanTodoToggle,
    onResumeAgent,
    onRevertAgentFilePreviewHunk,
    onSelectAgentSession,
    onSelectTeamExpert: onSelectTeamTask,
    onSendAgentInput,
    onSubmitAgentUserInput,
    onWaitAgent,
    open: agentRightSidebarOpen,
    openAgentRightSidebarView,
    openFileInTab: openAgentFilePreviewInWorkspaceLauncher,
    planDocumentMarkdown: agentPlanDocumentMarkdown,
    planFilePath,
    planFileRelPath,
    planPreviewMarkdown: agentPlanPreviewMarkdown,
    planPreviewTitle: agentPlanPreviewTitle ?? "",
    planReviewIsBuilt,
    planTodoDraftInputRef,
    planTodoDraftOpen,
    planTodoDraftText,
    revertedChangeKeys,
    revertedPaths: revertedFiles,
    setAgentPlanBuildModelId,
    setAgentRightSidebarOpen,
    setCommitMsg,
    setPlanTodoDraftText,
    teamSession,
    view: agentRightSidebarView,
    workspaceRoot: workspace,
  });

  const editorMainPanelProps = useEditorMainPanelProps({
    activeEditorInlineDiff,
    activeEditorTerminalId,
    activeTabId,
    appendEditorTerminal,
    awaitingReply,
    beginResizeEditorTerminal,
    closeEditorTerminalPanel,
    closeEditorTerminalSession,
    editorCenterPlanCanBuild,
    editorCenterPlanMarkdown,
    editorPlanBuildModelId,
    editorPlanFileIsBuilt,
    editorSettings,
    editorTerminalHeightPx,
    editorTerminalSessions,
    editorTerminalVisible,
    editorValue,
    filePath: filePath.trim(),
    markdownPaneMode,
    markdownPreviewContent,
    modelPickerItems,
    monacoChromeTheme,
    monacoDocumentPath,
    monacoOriginalDocumentPath,
    onCloseTab,
    onEditorTerminalSessionExit,
    onExecutePlanFromEditor,
    onLoadFile,
    onMonacoDiffMount,
    onMonacoMount,
    onOpenTeamAgentFile: onAgentConversationOpenFile,
    onPlanBuild,
    onSaveFile,
    onSelectTab,
    onSelectTeamTask,
    openTabs,
    planFilePath,
    planFileRelPath,
    planReviewIsBuilt,
    revertedChangeKeys,
    revertedPaths: revertedFiles,
    selectedTeamTaskId: teamSession?.selectedTaskId ?? null,
    setActiveEditorTerminalId,
    setEditorPlanBuildModelId,
    setEditorValue,
    setMarkdownPaneMode,
    setOpenTabs,
    setWorkspacePickerOpen,
    showEditorPlanDocumentInCenter,
    showEditorTeamWorkflowInCenter,
    showPlanFileEditorChrome,
    t,
    teamSession,
    workspaceRoot: workspace,
  });

  const editorLeftSidebarProps = useMemo(
    () => ({
      editorExplorerCollapsed,
      editorExplorerScrollRef,
      editorLeftSidebarView,
      editorSidebarSearchInputRef,
      editorSidebarSearchQuery,
      editorSidebarSearchResults,
      editorSidebarSelectedRel,
      editorSidebarWorkspaceLabel,
      fileMenuNewFile,
      ipcOk,
      normalizedEditorSidebarSearchQuery,
      onExplorerOpenFile,
      openSettingsPage,
      revealWorkspaceInOs,
      setEditorLeftSidebarView,
      setEditorSidebarSearchQuery,
      setWorkspacePickerOpen,
      shell,
      toggleEditorExplorerCollapsed,
      workspace,
      workspaceBasename,
      workspaceExplorerActions,
    }),
    [
      shell,
      workspace,
      workspaceBasename,
      ipcOk,
      editorLeftSidebarView,
      setEditorLeftSidebarView,
      editorExplorerCollapsed,
      toggleEditorExplorerCollapsed,
      editorSidebarWorkspaceLabel,
      editorSidebarSelectedRel,
      editorExplorerScrollRef,
      workspaceExplorerActions,
      editorSidebarSearchQuery,
      setEditorSidebarSearchQuery,
      normalizedEditorSidebarSearchQuery,
      editorSidebarSearchResults,
      editorSidebarSearchInputRef,
      fileMenuNewFile,
      revealWorkspaceInOs,
      onExplorerOpenFile,
      setWorkspacePickerOpen,
      openSettingsPage,
    ]
  );

  const shellWorkspaceCenterMain = useMemo(() => {
    if (layoutMode === "agent") {
      return (
        <AgentAgentCenterColumn
          agentRightSidebarOpen={agentRightSidebarOpen}
          agentRightSidebarView={agentRightSidebarView}
          chatPanelProps={agentChatPanelProps}
          currentThreadTitle={currentThreadTitle}
          hasAgentPlanSidebarContent={hasAgentPlanSidebarContent}
          hasConversation={hasConversation}
          onLaunchWorkspaceWithTool={(tool) => {
            void launchWorkspaceWithTool(tool);
          }}
          onOpenBrowserWindow={() => {
            void shell?.invoke("browser:openWindow").catch(() => {
              /* ignore */
            });
          }}
          onOpenWorkspaceFolder={revealWorkspaceInOs}
          onPlanNewIdea={onPlanNewIdea}
          t={t}
          toggleAgentRightSidebarView={toggleAgentRightSidebarView}
          workspace={workspace}
          workspaceBasename={workspaceBasename}
        />
      );
    }
    return (
      <Suspense
        fallback={
          <main
            aria-busy="true"
            aria-label={t("app.editorWorkspaceMainAria")}
            className="ref-center ref-center--editor-workspace ref-center--editor-shell"
          >
            <div className="ref-editor-center-split" />
          </main>
        }
      >
        <DevProfiler id="EditorMainPanel">
          <EditorMainPanel {...editorMainPanelProps} />
        </DevProfiler>
      </Suspense>
    );
  }, [
    layoutMode,
    t,
    hasConversation,
    workspace,
    workspaceBasename,
    onPlanNewIdea,
    revealWorkspaceInOs,
    hasAgentPlanSidebarContent,
    agentRightSidebarOpen,
    agentRightSidebarView,
    toggleAgentRightSidebarView,
    shell,
    launchWorkspaceWithTool,
    agentChatPanelProps,
    editorMainPanelProps,
  ]);

  const shellLeftRailGroupProps = useMemo(
    (): ShellLeftRailGroupProps => ({
      agentLeftSidebarProps,
      beginResizeLeft,
      editorLeftSidebarProps,
      layoutMode,
      leftSidebarOpen,
      resetRailWidths,
      t,
    }),
    [
      layoutMode,
      leftSidebarOpen,
      t,
      beginResizeLeft,
      resetRailWidths,
      agentLeftSidebarProps,
      editorLeftSidebarProps,
    ]
  );

  const shellCenterRightGroupProps = useMemo(
    (): ShellCenterRightGroupProps => ({
      agentChatPanelProps,
      agentRightSidebarOpen,
      agentRightSidebarProps,
      archivedThreads,
      beginResizeRight,
      centerMain: shellWorkspaceCenterMain,
      confirmDeleteId,
      currentId,
      editorChatMoreOpen,
      editorHistoryMenuRef,
      editorMoreMenuRef,
      editorThreadHistoryOpen,
      handleCloseEditorChatMore,
      handleOpenSettingsGeneral,
      hasConversation,
      layoutMode,
      onDeleteThread,
      onNewThread,
      onPlanNewIdea,
      onSelectThread,
      renderThreadItem,
      resetRailWidths,
      setComposerModePersist,
      setEditorChatMoreOpen,
      setEditorThreadHistoryOpen,
      setThreadSearch,
      setWorkspaceToolsOpen,
      t,
      threadSearch,
      threadsChrono,
      todayThreads,
    }),
    [
      layoutMode,
      agentRightSidebarOpen,
      t,
      shellWorkspaceCenterMain,
      hasConversation,
      onPlanNewIdea,
      agentChatPanelProps,
      agentRightSidebarProps,
      beginResizeRight,
      resetRailWidths,
      threadsChrono,
      currentId,
      onSelectThread,
      confirmDeleteId,
      onDeleteThread,
      editorThreadHistoryOpen,
      setEditorThreadHistoryOpen,
      editorChatMoreOpen,
      setEditorChatMoreOpen,
      editorHistoryMenuRef,
      editorMoreMenuRef,
      threadSearch,
      setThreadSearch,
      todayThreads,
      archivedThreads,
      renderThreadItem,
      setComposerModePersist,
      onNewThread,
      setWorkspaceToolsOpen,
      handleCloseEditorChatMore,
      handleOpenSettingsGeneral,
    ]
  );

  const composerActions = useMemo(
    () => ({
      onAbort,
      onExplorerOpenFile: composerExplorerOpenRel,
      onNewThread: composerInvokeNewThread,
      onSend: composerInvokeSend,
    }),
    [
      composerInvokeSend,
      onAbort,
      composerInvokeNewThread,
      composerExplorerOpenRel,
    ]
  );

  // 开发环境下追踪切换后的渲染情况
  const appRenderCountRef = useRef(0);
  const lastThreadIdRef = useRef<string | null>(null);
  const threadSwitchTimeRef = useRef<number>(0);
  const appRenderStartRef = useRef<number>(0);
  if (import.meta.env.DEV && currentId !== lastThreadIdRef.current) {
    appRenderCountRef.current = 0;
    lastThreadIdRef.current = currentId;
    threadSwitchTimeRef.current = Date.now();
    console.log(
      `[perf] ===== Thread changed to ${currentId}, starting render counter =====`
    );
  }
  if (import.meta.env.DEV) {
    appRenderStartRef.current = performance.now();
    appRenderCountRef.current += 1;
    const elapsed = Date.now() - threadSwitchTimeRef.current;
    if (
      appRenderCountRef.current <= 5 ||
      appRenderCountRef.current % 10 === 0
    ) {
      console.log(
        `[perf] App render #${appRenderCountRef.current} at +${elapsed}ms for currentId=${currentId ?? "null"} msgsThread=${messagesThreadId ?? "null"}`
      );
    }
  }

  // 渲染完成后记录耗时并追踪触发源（必须无条件调用 hook，仅在 DEV 内记录）
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    const renderTime = performance.now() - appRenderStartRef.current;
    if (renderTime > 10) {
      const triggers = [];
      if (messagesThreadId) triggers.push(`thread=${messagesThreadId}`);
      if (messages.length > 0) triggers.push(`msgs=${messages.length}`);
      if (awaitingReply) triggers.push("awaiting");
      console.log(
        `[perf] App render completed in ${renderTime.toFixed(1)}ms, count=${appRenderCountRef.current}, triggers: ${triggers.join(", ") || "none"}`
      );
    }
  });

  const shellSettingsPageProps = useMemo(
    (): SettingsPageProps => ({
      agentCustomization: mergedAgentCustomization,
      appearanceSettings,
      botIntegrations,
      colorMode,
      defaultModel,
      editorSettings,
      effectiveColorScheme: effectiveScheme,
      initialNav: settingsInitialNav,
      maiAccount,
      mcpServers,
      mcpStatuses,
      modelEntries,
      modelProviders,
      onChangeAgentCustomization: onChangeMergedAgentCustomization,
      onChangeAppearanceSettings: setAppearanceSettings,
      onChangeBotIntegrations,
      onChangeColorMode: (m, origin) => void onChangeColorMode(m, origin),
      onChangeEditorSettings: setEditorSettings,
      onChangeMcpServers: setMcpServers,
      onChangeModelEntries,
      onChangeModelProviders,
      onChangeProviderIdentity: setProviderIdentity,
      onChangeTeamSettings: setTeamSettings,
      onClose: () => void closeSettingsPage(),
      onDeleteWorkspaceSkillDisk: handleDeleteWorkspaceSkillDisk,
      onOpenMaiAccount: openMaiAccountModal,
      onOpenSkillCreator: startSkillCreatorFlow,
      onOpenWorkspaceSkillFile: handleOpenWorkspaceSkillFile,
      onPersistLanguage: (loc) => void onPersistLanguage(loc),
      onPickDefaultModel: (id) => void onPickDefaultModel(id),
      onRefreshDiskSkills: refreshWorkspaceDiskSkills,
      onRefreshMcpStatuses,
      onRestartMcpServer,
      onStartMcpServer,
      onStopMcpServer,
      providerIdentity,
      shell: shell ?? null,
      showTransientToast,
      teamSettings,
      workspaceOpen: !!workspace,
    }),
    [
      settingsInitialNav,
      closeSettingsPage,
      maiAccount,
      openMaiAccountModal,
      defaultModel,
      modelProviders,
      modelEntries,
      providerIdentity,
      onChangeModelProviders,
      onChangeModelEntries,
      setProviderIdentity,
      onPickDefaultModel,
      mergedAgentCustomization,
      onChangeMergedAgentCustomization,
      teamSettings,
      setTeamSettings,
      botIntegrations,
      setBotIntegrations,
      editorSettings,
      setEditorSettings,
      onPersistLanguage,
      mcpServers,
      setMcpServers,
      mcpStatuses,
      onRefreshMcpStatuses,
      onStartMcpServer,
      onStopMcpServer,
      onRestartMcpServer,
      shell,
      workspace,
      startSkillCreatorFlow,
      handleOpenWorkspaceSkillFile,
      handleDeleteWorkspaceSkillDisk,
      colorMode,
      onChangeColorMode,
      effectiveScheme,
      appearanceSettings,
      setAppearanceSettings,
      showTransientToast,
    ]
  );

  const composerPlusMcpServers = useMemo(() => {
    const statusById = new Map(
      mcpStatuses.map((status) => [status.id, status])
    );
    return mcpServers.map((server) => {
      const status = statusById.get(server.id);
      return {
        enabled: server.enabled,
        error: status?.error,
        id: server.id,
        name: server.name,
        status: status?.status ?? (server.enabled ? "not_started" : "disabled"),
        toolsCount: status?.tools.length ?? 0,
        transport: server.transport,
      };
    });
  }, [mcpServers, mcpStatuses]);

  return (
    <AppProvider shell={shell} t={t} workspace={workspace}>
      <ComposerActionsProvider value={composerActions}>
        <div
          className={`ref-shell ${layoutMode === "agent" ? "ref-shell--agent-layout" : ""}`}
        >
          <MessagesScrollSync
            hasConversation={hasConversation}
            pinMessagesToBottomRef={pinMessagesToBottomRef}
            scheduleMessagesScrollToBottom={scheduleMessagesScrollToBottom}
            syncMessagesScrollIndicators={syncMessagesScrollIndicators}
          />
          <AppShellMenubar
            activeTabId={activeTabId}
            canEditCopy={canEditCopy}
            canEditCut={canEditCut}
            canEditPaste={canEditPaste}
            canEditSelectAll={canEditSelectAll}
            canEditUndoRedo={canEditUndoRedo}
            canGoBackThread={canGoBackThread}
            canGoForwardThread={canGoForwardThread}
            canGoNextThread={canGoNextThread}
            canGoPrevThread={canGoPrevThread}
            canToggleDiffPanel={canToggleDiffPanel}
            canToggleTerminal={canToggleTerminal}
            closeWorkspaceFolder={closeWorkspaceFolder}
            editMenuOpen={editMenuOpen}
            editMenuRef={editMenuRef}
            executeEditAction={executeEditAction}
            fileMenuCloseEditor={fileMenuCloseEditor}
            fileMenuNewEditorWindow={fileMenuNewEditorWindow}
            fileMenuNewFile={fileMenuNewFile}
            fileMenuNewWindow={fileMenuNewWindow}
            fileMenuOpen={fileMenuOpen}
            fileMenuOpenFile={fileMenuOpenFile}
            fileMenuOpenFolder={fileMenuOpenFolder}
            fileMenuQuit={fileMenuQuit}
            fileMenuRef={fileMenuRef}
            fileMenuRevertFile={fileMenuRevertFile}
            fileMenuSaveAs={fileMenuSaveAs}
            folderRecents={folderRecents}
            goThreadBack={goThreadBack}
            goThreadForward={goThreadForward}
            goToNextThread={goToNextThread}
            goToPreviousThread={goToPreviousThread}
            handleOpenAutoUpdate={handleOpenAutoUpdate}
            handleOpenSettingsGeneral={handleOpenSettingsGeneral}
            handleToggleEditMenu={handleToggleEditMenu}
            handleToggleFileMenu={handleToggleFileMenu}
            hasAgentLayout={layoutWindowAvailability.agent}
            hasEditorLayout={layoutWindowAvailability.editor}
            helpMenuOpen={helpMenuOpen}
            helpMenuRef={helpMenuRef}
            layoutMode={layoutMode}
            maiAccount={maiAccount}
            onEnterEditorLayout={() => void handleOpenEditorLayoutWindow()}
            onOpenMaiAccount={openMaiAccountModal}
            onReturnToAgentLayout={() => void handleOpenAgentLayoutWindow()}
            onSaveFile={onSaveFile}
            openQuickOpen={openQuickOpen}
            openWorkspaceByPath={openWorkspaceByPath}
            resetUiZoom={resetUiZoom}
            setMenubarMenu={setMenubarMenu}
            shell={shell}
            spawnEditorTerminal={spawnEditorTerminal}
            t={t}
            terminalMenuOpen={terminalMenuOpen}
            terminalMenuRef={terminalMenuRef}
            toggleDiffPanelVisibility={toggleDiffPanelVisibility}
            toggleFullscreen={toggleFullscreen}
            toggleMenubarMenu={toggleMenubarMenu}
            toggleSidebarVisibility={toggleSidebarVisibility}
            toggleTerminalVisibility={toggleTerminalVisibility}
            viewMenuOpen={viewMenuOpen}
            viewMenuRef={viewMenuRef}
            windowMaximized={windowMaximized}
            windowMenuCloseWindow={windowMenuCloseWindow}
            windowMenuMinimize={windowMenuMinimize}
            windowMenuOpen={windowMenuOpen}
            windowMenuRef={windowMenuRef}
            windowMenuToggleMaximize={windowMenuToggleMaximize}
            workspace={workspace}
            zoomInUi={zoomInUi}
            zoomOutUi={zoomOutUi}
          />

          {isEditorHomeMode ? (
            <AppWorkspaceWelcome
              homeRecents={homeRecents}
              maiAccount={maiAccount}
              onOpenMaiAccount={openMaiAccountModal}
              onOpenWorkspacePath={(p) => void openWorkspaceByPath(p)}
              onOpenWorkspacePicker={() => setWorkspacePickerOpen(true)}
              t={t}
            />
          ) : (
            <ShellWorkspaceGrid
              agentRightSidebarOpen={agentRightSidebarOpen}
              centerRight={shellCenterRightGroupProps}
              layoutMode={layoutMode}
              leftRail={shellLeftRailGroupProps}
              leftSidebarOpen={leftSidebarOpen}
              railWidths={railWidths}
            />
          )}

          <AppShellOverlays
            activeWorkspaceMenuItem={activeWorkspaceMenuItem}
            applyAtSelection={atMention.applyAtSelection}
            applySkillSelection={skillInvoke.applySkillSelection}
            applySlashSelection={slashCommand.applySlashSelection}
            applyWorkspacePath={applyWorkspacePath}
            atCaretRect={atMention.atCaretRect}
            atMenuFileSearchLoading={atMention.atMenuFileSearchLoading}
            atMenuHighlight={atMention.atMenuHighlight}
            atMenuItems={atMention.atMenuItems}
            atMenuOpen={atMention.atMenuOpen}
            beginWorkspaceAliasEdit={beginWorkspaceAliasEdit}
            closeAtMenu={atMention.closeAtMenu}
            closeSettingsPage={closeSettingsPage}
            closeSkillMenu={skillInvoke.closeSkillMenu}
            closeSlashMenu={slashCommand.closeSlashMenu}
            composerAttachErr={composerAttachErr}
            composerGitBranchAnchorRef={composerGitBranchAnchorRef}
            composerMode={composerMode}
            composerPlusMcpServers={composerPlusMcpServers}
            composerPlusSkills={composerPlusSkills}
            defaultModel={defaultModel}
            filePath={filePath}
            focusSearchSidebarFromQuickOpen={focusSearchSidebarFromQuickOpen}
            goToLineInEditor={goToLineInEditor}
            handleCloseModelPicker={handleCloseModelPicker}
            handleClosePlusMenu={handleClosePlusMenu}
            handleCloseQuickOpen={handleCloseQuickOpen}
            handleCloseWorkspacePicker={handleCloseWorkspacePicker}
            handleCloseWorkspaceTools={handleCloseWorkspaceTools}
            handleOpenSettingsGeneral={handleOpenSettingsGeneral}
            handleOpenSettingsModels={handleOpenSettingsModels}
            handleOpenSettingsRules={handleOpenSettingsRules}
            handleOpenSettingsTools={handleOpenSettingsTools}
            homePath={homePath}
            homeRecents={homeRecents}
            layoutSwitchPending={layoutSwitchPending}
            layoutSwitchTarget={layoutSwitchTarget}
            modelPickerAnchorRefForDropdown={modelPickerAnchorRefForDropdown}
            modelPickerItems={modelPickerItems}
            modelPickerOpen={modelPickerOpen}
            onComposerInsertSkill={insertComposerSkillInvocation}
            onComposerPickImages={pickComposerImagesFromDialog}
            onComposerToggleMcpServer={toggleComposerMcpServerEnabled}
            onExplorerOpenFile={onExplorerOpenFile}
            onPickDefaultModel={onPickDefaultModel}
            onSubAgentToastClick={onSubAgentToastClick}
            openWorkspaceByPath={openWorkspaceByPath}
            plusMenuAnchorRefForDropdown={plusMenuAnchorRefForDropdown}
            plusMenuOpen={plusMenuOpen}
            quickOpenOpen={quickOpenOpen}
            quickOpenRecentFiles={quickOpenRecentFiles}
            quickOpenSeed={quickOpenSeed}
            removeWorkspaceFromSidebar={removeWorkspaceFromSidebar}
            revealWorkspaceInOs={revealWorkspaceInOs}
            saveToastKey={saveToastKey}
            saveToastVisible={saveToastVisible}
            searchWorkspaceSymbolsFn={searchWorkspaceSymbolsFn}
            setAtMenuHighlight={atMention.setAtMenuHighlight}
            setComposerModePersist={setComposerModePersist}
            setSkillMenuHighlight={skillInvoke.setSkillMenuHighlight}
            setSlashMenuHighlight={slashCommand.setSlashMenuHighlight}
            setThinkingByModelId={setThinkingByModelId}
            settingsOpenPending={settingsOpenPending}
            settingsPageOpen={settingsPageOpen}
            settingsPageProps={shellSettingsPageProps}
            setWorkspacePickerOpen={setWorkspacePickerOpen}
            shell={shell}
            showTransientToast={showTransientToast}
            skillCaretRect={skillInvoke.skillCaretRect}
            skillMenuHighlight={skillInvoke.skillMenuHighlight}
            skillMenuItems={skillInvoke.skillMenuItems}
            skillMenuOpen={skillInvoke.skillMenuOpen}
            skillQuery={skillInvoke.skillQuery}
            slashCaretRect={slashCommand.slashCaretRect}
            slashMenuHighlight={slashCommand.slashMenuHighlight}
            slashMenuItems={slashCommand.slashMenuItems}
            slashMenuOpen={slashCommand.slashMenuOpen}
            slashQuery={slashCommand.slashQuery}
            subAgentBgToast={subAgentBgToast}
            t={t}
            thinkingByModelId={thinkingByModelId}
            workspace={workspace}
            workspaceFileList={workspaceFileListRef.current}
            workspaceMenuPosition={workspaceMenuPosition}
            workspaceMenuRef={workspaceMenuRef}
            workspacePickerOpen={workspacePickerOpen}
            workspaceToolsOpen={workspaceToolsOpen}
          />

          <MaiAccountModal
            account={maiAccount}
            onAccountChange={setMaiAccount}
            onClose={closeMaiAccountModal}
            open={maiAccountModalOpen}
            shell={shell}
          />

          {updateStatus?.state === "downloaded" ? (
            <div className="ref-update-ready-toast">
              <span className="ref-update-ready-toast-text">
                {updateStatus.platform === "darwin" && !updateStatus.isSigned
                  ? t("app.updateReadyMacUnsigned")
                  : t("app.updateReady")}
              </span>
              <button
                className="ref-update-ready-toast-btn"
                onClick={
                  updateStatus.platform === "darwin" && !updateStatus.isSigned
                    ? onOpenUpdateFolder
                    : onInstallUpdate
                }
                type="button"
              >
                {updateStatus.platform === "darwin" && !updateStatus.isSigned
                  ? t("app.openDownloadFolder")
                  : t("settings.autoUpdate.restartNow")}
              </button>
            </div>
          ) : null}
        </div>
      </ComposerActionsProvider>
    </AppProvider>
  );
}

const AppMainWorkspace = memo(AppMainWorkspaceInner);
