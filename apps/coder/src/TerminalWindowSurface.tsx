import type * as React from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "./i18n";
import {
  IconDotsHorizontal,
  IconPlus,
  IconProfilesConnections,
  IconSettings,
  IconTerminal,
} from "./icons";
import { TerminalAuthPromptModal } from "./terminalWindow/TerminalAuthPromptModal";
import { TerminalProfileSelectorModal } from "./terminalWindow/TerminalProfileSelectorModal";
import {
  TerminalSettingsPanel,
  type TerminalSettingsPanelOpenProfileRequest,
} from "./terminalWindow/TerminalSettingsPanel";
import {
  TerminalStartPage,
  type TerminalStartPageProfile,
} from "./terminalWindow/TerminalStartPage";
import { rememberTerminalProfileLaunch } from "./terminalWindow/terminalProfileSelectorRecents";
import {
  buildTermSessionCreatePayload,
  getBuiltinTerminalProfiles,
  loadTerminalSettings,
  resolveTerminalProfile,
  saveTerminalSettings,
  subscribeTerminalSettings,
  type TerminalAppSettings,
  type TerminalProfile,
} from "./terminalWindow/terminalSettings";
import {
  type ActiveTerminalAuthPrompt,
  describeTerminalProfileTarget,
  loadTerminalTabSnapshot,
  loadTerminalToolbarPinned,
  readXtermThemeColors,
  type RestorableTerminalSnapshot,
  type RestorableTerminalTab,
  saveTerminalTabSnapshot,
  saveTerminalToolbarPinned,
  type SessionInfo,
  type TabHeaderContextMenuState,
  TerminalPane,
  TerminalTabButton,
  TerminalTabHeaderContextMenu,
  TerminalViewportContextMenu,
  type TerminalContextMenuState,
  type TerminalRuntimeControls,
  type TerminalSessionAuthPrompt,
  type TerminalSplitLayout,
  type TerminalSplitOrientation,
  withTerminalWindowProfileLabel,
  type XTermThemeColors,
} from "./terminalWindow/surface";

export * from "./terminalWindow/surface";

type Props = {
  t: TFunction;
  forceStartPage?: boolean;
};

export const TerminalWindowSurface = memo(function TerminalWindowSurface({
  t,
  forceStartPage = false,
}: Props) {
  const shell = window.maiShell;
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [splitLayout, setSplitLayout] = useState<TerminalSplitLayout>({
    enabled: false,
    orientation: "horizontal",
    ratio: 0.5,
    secondaryId: null,
  });
  const [exitByTab, setExitByTab] = useState<Record<string, number | null>>({});
  const [sessionProfiles, setSessionProfiles] = useState<
    Record<string, string>
  >({});
  const [builtinProfiles, setBuiltinProfiles] = useState<TerminalProfile[]>(
    () => getBuiltinTerminalProfiles()
  );
  const [themeColors, setThemeColors] = useState<XTermThemeColors>(() =>
    readXtermThemeColors()
  );
  const [terminalSettings, setTerminalSettings] = useState<TerminalAppSettings>(
    () => loadTerminalSettings()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileSelectorOpen, setProfileSelectorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] =
    useState<TerminalContextMenuState | null>(null);
  const [tabHeaderContextMenu, setTabHeaderContextMenu] =
    useState<TabHeaderContextMenuState | null>(null);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [authPromptModal, setAuthPromptModal] =
    useState<ActiveTerminalAuthPrompt | null>(null);
  const [settingsOpenProfileRequest, setSettingsOpenProfileRequest] =
    useState<TerminalSettingsPanelOpenProfileRequest | null>(null);
  const [sftpPanelOpenBySession, setSftpPanelOpenBySession] = useState<
    Record<string, boolean>
  >({});
  const [sftpPanelPathBySession, setSftpPanelPathBySession] = useState<
    Record<string, string>
  >({});
  const [portsPanelOpenBySession, setPortsPanelOpenBySession] = useState<
    Record<string, boolean>
  >({});
  const [toolbarPinned, setToolbarPinned] = useState(() =>
    loadTerminalToolbarPinned()
  );
  const [toolbarRevealed, setToolbarRevealed] = useState(() =>
    loadTerminalToolbarPinned()
  );
  const creatingRef = useRef(false);
  const initialListLoadedRef = useRef(false);
  const createSessionRef = useRef<
    (
      profileId?: string,
      options?: { activate?: boolean }
    ) => Promise<string | null>
  >(async () => null);
  const builtinProfilesRef = useRef<TerminalProfile[]>(builtinProfiles);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const runtimeControlsRef = useRef<Record<string, TerminalRuntimeControls>>(
    {}
  );
  const toolbarHideTimerRef = useRef<number | null>(null);
  const snapshotSaveTimerRef = useRef<number | null>(null);
  builtinProfilesRef.current = builtinProfiles;

  const clearToolbarHideTimer = useCallback(() => {
    if (toolbarHideTimerRef.current != null) {
      window.clearTimeout(toolbarHideTimerRef.current);
      toolbarHideTimerRef.current = null;
    }
  }, []);

  const revealTerminalToolbar = useCallback(() => {
    clearToolbarHideTimer();
    setToolbarRevealed(true);
  }, [clearToolbarHideTimer]);

  const hideTerminalToolbar = useCallback(() => {
    if (toolbarPinned) {
      setToolbarRevealed(true);
      return;
    }
    clearToolbarHideTimer();
    toolbarHideTimerRef.current = window.setTimeout(() => {
      setToolbarRevealed(false);
      toolbarHideTimerRef.current = null;
    }, 900);
  }, [clearToolbarHideTimer, toolbarPinned]);

  const toggleTerminalToolbarPinned = useCallback(() => {
    setToolbarPinned((current) => {
      const next = !current;
      saveTerminalToolbarPinned(next);
      if (next) {
        setToolbarRevealed(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (toolbarPinned) {
      clearToolbarHideTimer();
      setToolbarRevealed(true);
    }
  }, [clearToolbarHideTimer, toolbarPinned]);

  useEffect(() => () => clearToolbarHideTimer(), [clearToolbarHideTimer]);

  const closeTerminalContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeTabHeaderContextMenu = useCallback(() => {
    setTabHeaderContextMenu(null);
  }, []);

  const registerRuntime = useCallback(
    (sessionId: string, runtime: TerminalRuntimeControls | null) => {
      if (runtime) {
        runtimeControlsRef.current[sessionId] = runtime;
        return;
      }
      delete runtimeControlsRef.current[sessionId];
    },
    []
  );

  const handleRequestContextMenu = useCallback(
    (payload: TerminalContextMenuState) => {
      setMenuOpen(false);
      setTabHeaderContextMenu(null);
      setContextMenu(payload);
    },
    []
  );

  const restoreSavedTabs = useCallback(async () => {
    const snapshot = loadTerminalTabSnapshot();
    if (!snapshot.tabs.length) {
      return false;
    }
    const restoredIds: string[] = [];
    for (const [index, tab] of snapshot.tabs.entries()) {
      const id = await createSessionRef.current(tab.profileId, {
        activate: index === snapshot.activeIndex,
      });
      if (id) {
        restoredIds.push(id);
      }
    }
    if (snapshot.split?.enabled) {
      const secondaryId = restoredIds[snapshot.split.secondaryIndex];
      if (secondaryId) {
        setSplitLayout({
          enabled: true,
          orientation: snapshot.split.orientation,
          ratio: snapshot.split.ratio,
          secondaryId,
        });
      }
    }
    return true;
  }, []);

  const reloadBuiltinProfiles = useCallback(async (): Promise<
    TerminalProfile[]
  > => {
    if (!shell) {
      return builtinProfilesRef.current;
    }
    try {
      const raw = (await shell.invoke("term:listBuiltinProfiles")) as {
        ok?: boolean;
        profiles?: unknown[];
      };
      if (!raw?.ok || !Array.isArray(raw.profiles)) {
        return builtinProfilesRef.current;
      }
      const next = raw.profiles.map((profile) => profile as TerminalProfile);
      builtinProfilesRef.current = next;
      setBuiltinProfiles(next);
      return next;
    } catch {
      return builtinProfilesRef.current;
    }
  }, [shell]);

  const refreshList = useCallback(async () => {
    if (!shell) {
      return;
    }
    try {
      const result = (await shell.invoke("term:sessionList")) as
        | { ok: true; sessions: SessionInfo[] }
        | { ok: false };
      if (!result.ok) {
        return;
      }
      setSessions(result.sessions);
      setSessionProfiles((prev) => {
        let changed = false;
        const activeIds = new Set(result.sessions.map((session) => session.id));
        const next: Record<string, string> = {};
        for (const [id, profileId] of Object.entries(prev)) {
          if (activeIds.has(id)) {
            next[id] = profileId;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setActiveId((current) => {
        if (
          current &&
          result.sessions.some((session) => session.id === current)
        ) {
          return current;
        }
        return result.sessions[0]?.id ?? null;
      });
      const firstCycle = !initialListLoadedRef.current;
      if (firstCycle) {
        initialListLoadedRef.current = true;
      }
      if (firstCycle && result.sessions.length === 0) {
        await reloadBuiltinProfiles();
        const restored =
          !forceStartPage && terminalSettings.restoreTabs
            ? await restoreSavedTabs()
            : false;
        if (!restored && !forceStartPage && terminalSettings.autoOpen) {
          await createSessionRef.current();
        }
      }
    } catch {
      /* ignore */
    }
  }, [
    forceStartPage,
    reloadBuiltinProfiles,
    restoreSavedTabs,
    shell,
    terminalSettings.autoOpen,
    terminalSettings.restoreTabs,
  ]);

  const createSession = useCallback(
    async (
      profileId?: string,
      options?: { activate?: boolean }
    ): Promise<string | null> => {
      if (!shell || creatingRef.current) {
        return null;
      }
      creatingRef.current = true;
      try {
        const resolvedProfile = resolveTerminalProfile(
          terminalSettings.profiles,
          profileId ?? terminalSettings.defaultProfileId,
          builtinProfilesRef.current
        );
        const profile = resolvedProfile
          ? withTerminalWindowProfileLabel(resolvedProfile, t)
          : null;
        const payload = profile ? buildTermSessionCreatePayload(profile) : {};
        const result = (await shell.invoke("term:sessionCreate", payload)) as
          | { ok: true; session: SessionInfo }
          | { ok: false; error?: string };
        if (result.ok) {
          if (profile) {
            setSessionProfiles((prev) => ({
              ...prev,
              [result.session.id]: profile.id,
            }));
            rememberTerminalProfileLaunch(profile.id);
          }
          setSessions((prev) =>
            prev.some((session) => session.id === result.session.id)
              ? prev
              : [...prev, result.session]
          );
          if (options?.activate !== false) {
            setActiveId(result.session.id);
          }
          setSettingsOpen(false);
          setProfileSelectorOpen(false);
          setMenuOpen(false);
          setContextMenu(null);
          setTabHeaderContextMenu(null);
        }
        return result.ok ? result.session.id : null;
      } finally {
        creatingRef.current = false;
      }
    },
    [shell, t, terminalSettings]
  );

  createSessionRef.current = createSession;

  const closeSession = useCallback(
    async (id: string, options?: { force?: boolean }) => {
      if (!shell) {
        return;
      }
      const session = sessions.find((item) => item.id === id);
      if (!options?.force && session?.alive) {
        const confirmed = window.confirm(
          `Close terminal "${session.title}"? Running processes will be terminated.`
        );
        if (!confirmed) {
          return;
        }
      }
      await shell.invoke("term:sessionKill", id).catch(() => {
        /* ignore */
      });
      setExitByTab((prev) => {
        if (!(id in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSessionProfiles((prev) => {
        if (!(id in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setContextMenu((prev) => (prev?.sessionId === id ? null : prev));
      setTabHeaderContextMenu((prev) => (prev?.sessionId === id ? null : prev));
      setSessions((prev) => {
        const next = prev.filter((session) => session.id !== id);
        requestAnimationFrame(() => {
          setActiveId((current) =>
            current === id ? (next[0]?.id ?? null) : current
          );
        });
        return next;
      });
    },
    [sessions, shell]
  );

  const duplicateSession = useCallback(
    async (id: string, options?: { activate?: boolean }) => {
      const profileId =
        sessionProfiles[id] ?? terminalSettings.defaultProfileId;
      await createSession(profileId, options);
    },
    [createSession, sessionProfiles, terminalSettings.defaultProfileId]
  );

  const reorderSession = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }
    setSessions((prev) => {
      const sourceIndex = prev.findIndex((session) => session.id === sourceId);
      const targetIndex = prev.findIndex((session) => session.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const splitSession = useCallback(
    async (id: string, orientation: TerminalSplitOrientation) => {
      await duplicateSession(id);
      setSplitLayout({
        enabled: true,
        orientation,
        ratio: 0.5,
        secondaryId: id,
      });
    },
    [duplicateSession]
  );

  const closeSplit = useCallback(() => {
    const secondaryId = splitLayout.secondaryId;
    setSplitLayout({
      enabled: false,
      orientation: "horizontal",
      ratio: 0.5,
      secondaryId: null,
    });
    if (secondaryId) {
      shell?.invoke("term:sessionKill", secondaryId).catch(() => {});
      setSessions((prev) => prev.filter((s) => s.id !== secondaryId));
    }
  }, [shell, splitLayout.secondaryId]);

  const beginSplitResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const panes = panesRef.current;
      if (!panes || !splitLayout.enabled) {
        return;
      }
      event.preventDefault();
      const rect = panes.getBoundingClientRect();
      const update = (clientX: number, clientY: number) => {
        const raw =
          splitLayout.orientation === "horizontal"
            ? (clientX - rect.left) / rect.width
            : (clientY - rect.top) / rect.height;
        const ratio = Math.max(0.2, Math.min(0.8, raw));
        setSplitLayout((current) => ({ ...current, ratio }));
      };
      const onPointerMove = (moveEvent: PointerEvent) =>
        update(moveEvent.clientX, moveEvent.clientY);
      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [splitLayout.enabled, splitLayout.orientation]
  );

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const unsubscribe = shell?.subscribeTerminalSessionListChanged?.(() => {
      void refreshList();
    });
    return () => unsubscribe?.();
  }, [shell, refreshList]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeColors(readXtermThemeColors());
    });
    observer.observe(document.documentElement, {
      attributeFilter: ["data-color-scheme"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      subscribeTerminalSettings(() => {
        setTerminalSettings(loadTerminalSettings());
      }),
    []
  );

  useEffect(() => {
    void reloadBuiltinProfiles();
  }, [reloadBuiltinProfiles]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    void reloadBuiltinProfiles();
  }, [reloadBuiltinProfiles, settingsOpen]);

  useEffect(() => {
    if (snapshotSaveTimerRef.current != null) {
      window.clearTimeout(snapshotSaveTimerRef.current);
      snapshotSaveTimerRef.current = null;
    }
    if (!terminalSettings.restoreTabs) {
      snapshotSaveTimerRef.current = window.setTimeout(() => {
        saveTerminalTabSnapshot({ tabs: [] });
        snapshotSaveTimerRef.current = null;
      }, 500);
      return;
    }
    const tabs = sessions
      .map((session) => {
        const profileId =
          sessionProfiles[session.id] ?? terminalSettings.defaultProfileId;
        return profileId ? { profileId } : null;
      })
      .filter((tab): tab is RestorableTerminalTab => Boolean(tab));
    const activeIndex = activeId
      ? sessions.findIndex((session) => session.id === activeId)
      : undefined;
    const secondaryIndex = splitLayout.secondaryId
      ? sessions.findIndex((session) => session.id === splitLayout.secondaryId)
      : -1;
    const snapshot: RestorableTerminalSnapshot = {
      activeIndex:
        typeof activeIndex === "number" && activeIndex >= 0
          ? activeIndex
          : undefined,
      split:
        splitLayout.enabled && secondaryIndex >= 0
          ? {
              enabled: true,
              orientation: splitLayout.orientation,
              ratio: splitLayout.ratio,
              secondaryIndex,
            }
          : undefined,
      tabs,
    };
    snapshotSaveTimerRef.current = window.setTimeout(() => {
      saveTerminalTabSnapshot(snapshot);
      snapshotSaveTimerRef.current = null;
    }, 500);
    return () => {
      if (snapshotSaveTimerRef.current != null) {
        window.clearTimeout(snapshotSaveTimerRef.current);
        snapshotSaveTimerRef.current = null;
      }
    };
  }, [
    activeId,
    sessions,
    sessionProfiles,
    splitLayout.enabled,
    splitLayout.orientation,
    splitLayout.ratio,
    splitLayout.secondaryId,
    terminalSettings.defaultProfileId,
    terminalSettings.restoreTabs,
  ]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (menuWrapRef.current?.contains(event.target as Node)) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ref-uterm-context-menu")) {
        return;
      }
      setContextMenu(null);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("blur", closeTerminalContextMenu);
    window.addEventListener("resize", closeTerminalContextMenu);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("blur", closeTerminalContextMenu);
      window.removeEventListener("resize", closeTerminalContextMenu);
    };
  }, [contextMenu, closeTerminalContextMenu]);

  useEffect(() => {
    if (!tabHeaderContextMenu) {
      return;
    }
    const onPointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ref-uterm-tabstrip-context-menu")) {
        return;
      }
      setTabHeaderContextMenu(null);
    };
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setTabHeaderContextMenu(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("blur", closeTabHeaderContextMenu);
    window.addEventListener("resize", closeTabHeaderContextMenu);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("blur", closeTabHeaderContextMenu);
      window.removeEventListener("resize", closeTabHeaderContextMenu);
    };
  }, [tabHeaderContextMenu, closeTabHeaderContextMenu]);

  useEffect(() => {
    setContextMenu(null);
    setTabHeaderContextMenu(null);
    setProfileSelectorOpen(false);
  }, [activeId, menuOpen, settingsOpen]);

  useEffect(() => {
    if (!shell || !menuOpen) {
      return;
    }
    let cancelled = false;
    void shell.invoke("app:windowGetState").then((result) => {
      if (cancelled) {
        return;
      }
      const state = result as { ok?: boolean; maximized?: boolean };
      if (state?.ok && typeof state.maximized === "boolean") {
        setWindowMaximized(state.maximized);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shell, menuOpen]);

  const persistSettings = useCallback((next: TerminalAppSettings) => {
    setTerminalSettings(next);
    saveTerminalSettings(next);
  }, []);

  const handleExit = useCallback((id: string, code: number | null) => {
    setExitByTab((prev) =>
      prev[id] === code ? prev : { ...prev, [id]: code }
    );
  }, []);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeId) ??
      sessions[0] ??
      null,
    [sessions, activeId]
  );
  const splitSecondarySession = useMemo(
    () =>
      sessions.find(
        (session) =>
          session.id === splitLayout.secondaryId &&
          session.id !== activeSession?.id
      ) ?? null,
    [activeSession?.id, sessions, splitLayout.secondaryId]
  );
  const visibleTerminalSessions = useMemo(() => {
    if (splitLayout.enabled && activeSession && splitSecondarySession) {
      return [activeSession, splitSecondarySession];
    }
    return activeSession ? [activeSession] : [];
  }, [activeSession, splitLayout.enabled, splitSecondarySession]);

  useEffect(() => {
    if (!splitLayout.enabled) {
      return;
    }
    if (
      splitLayout.secondaryId &&
      sessions.some((session) => session.id === splitLayout.secondaryId)
    ) {
      return;
    }
    setSplitLayout((current) => ({
      ...current,
      enabled: false,
      secondaryId: null,
    }));
  }, [sessions, splitLayout.enabled, splitLayout.secondaryId]);

  const displayBuiltinProfiles = useMemo(
    () =>
      builtinProfiles.map((profile) =>
        withTerminalWindowProfileLabel(profile, t)
      ),
    [builtinProfiles, t]
  );

  const defaultProfile = useMemo(
    () =>
      resolveTerminalProfile(
        terminalSettings.profiles,
        terminalSettings.defaultProfileId,
        builtinProfiles
      ),
    [
      builtinProfiles,
      terminalSettings.defaultProfileId,
      terminalSettings.profiles,
    ]
  );

  const startPageProfiles = useMemo(() => {
    const next: TerminalStartPageProfile[] = [];
    const seen = new Set<string>();
    const appendProfile = (profile: TerminalProfile | null | undefined) => {
      if (!profile || seen.has(profile.id)) {
        return;
      }
      const displayProfile = withTerminalWindowProfileLabel(profile, t);
      seen.add(displayProfile.id);
      next.push({
        id: displayProfile.id,
        isDefault: displayProfile.id === defaultProfile?.id,
        kind: displayProfile.kind,
        name:
          displayProfile.name ||
          t("app.universalTerminalSettings.profiles.untitled"),
        target: describeTerminalProfileTarget(displayProfile, t),
      });
    };

    appendProfile(defaultProfile);
    for (const profile of terminalSettings.profiles) {
      appendProfile(profile);
    }
    for (const profile of displayBuiltinProfiles) {
      appendProfile(profile);
    }
    return next;
  }, [defaultProfile, displayBuiltinProfiles, t, terminalSettings.profiles]);

  const startPageDefaultMeta = useMemo(() => {
    const profile =
      startPageProfiles.find((item) => item.isDefault) ??
      startPageProfiles[0] ??
      null;
    if (!profile) {
      return t("app.universalTerminalStartPageDefaultFallback");
    }
    return t("app.universalTerminalStartPageDefaultHint", {
      name: profile.name,
      target: profile.target,
    });
  }, [startPageProfiles, t]);

  const visibleStartPageProfiles = useMemo(
    () => startPageProfiles.slice(0, 6),
    [startPageProfiles]
  );

  const resolvedSessionProfiles = useMemo(() => {
    const next: Record<string, TerminalProfile | null> = {};
    for (const session of sessions) {
      next[session.id] = resolveTerminalProfile(
        terminalSettings.profiles,
        sessionProfiles[session.id] ?? terminalSettings.defaultProfileId,
        builtinProfiles
      );
    }
    return next;
  }, [
    builtinProfiles,
    sessionProfiles,
    sessions,
    terminalSettings.defaultProfileId,
    terminalSettings.profiles,
  ]);

  useEffect(() => {
    const activeIds = new Set(sessions.map((session) => session.id));
    setSftpPanelOpenBySession((prev) => {
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [sessionId, open] of Object.entries(prev)) {
        if (activeIds.has(sessionId)) {
          next[sessionId] = open;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setSftpPanelPathBySession((prev) => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const [sessionId, sftpPath] of Object.entries(prev)) {
        if (activeIds.has(sessionId)) {
          next[sessionId] = sftpPath;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sessions]);

  const openAuthPrompt = useCallback(
    (sessionId: string, prompt: TerminalSessionAuthPrompt) => {
      const session = sessions.find((item) => item.id === sessionId) ?? null;
      const resolvedProfile = resolvedSessionProfiles[sessionId] ?? null;
      const displayProfile = resolvedProfile
        ? withTerminalWindowProfileLabel(resolvedProfile, t)
        : null;
      setSettingsOpen(false);
      setActiveId(sessionId);
      setAuthPromptModal((current) => {
        if (
          current &&
          current.sessionId === sessionId &&
          current.seq === prompt.seq
        ) {
          return current;
        }
        return {
          ...prompt,
          profileId: displayProfile?.id ?? null,
          profileName:
            displayProfile?.name ||
            t("app.universalTerminalSettings.profiles.untitled"),
          sessionId,
          sessionTitle: session?.title || t("app.universalTerminalWindowTitle"),
        };
      });
    },
    [resolvedSessionProfiles, sessions, t]
  );

  useEffect(() => {
    const unsubscribe = shell?.subscribeTerminalSessionAuthPrompt?.(
      (id, prompt) => {
        if (!prompt) {
          return;
        }
        openAuthPrompt(id, prompt);
      }
    );
    return () => unsubscribe?.();
  }, [openAuthPrompt, shell]);

  useEffect(() => {
    if (!authPromptModal) {
      return;
    }
    const session =
      sessions.find((item) => item.id === authPromptModal.sessionId) ?? null;
    if (!session || !session.alive) {
      setAuthPromptModal(null);
    }
  }, [authPromptModal, sessions]);

  const terminalStageStyle = useMemo(
    (): CSSProperties =>
      ({
        "--ref-uterm-body-opacity": String(terminalSettings.opacity),
        "--ref-uterm-split-ratio": `${Math.round(splitLayout.ratio * 100)}%`,
      }) as CSSProperties,
    [splitLayout.ratio, terminalSettings.opacity]
  );

  const contextRuntime = contextMenu
    ? (runtimeControlsRef.current[contextMenu.sessionId] ?? null)
    : null;

  const contextMenuStyle = useMemo((): CSSProperties | undefined => {
    if (!contextMenu || typeof window === "undefined") {
      return;
    }
    const padding = 8;
    const estimatedWidth = 220;
    const estimatedHeight = 148;
    return {
      left: Math.max(
        padding,
        Math.min(contextMenu.x, window.innerWidth - estimatedWidth - padding)
      ),
      right: "auto",
      top: Math.max(
        padding,
        Math.min(contextMenu.y, window.innerHeight - estimatedHeight - padding)
      ),
    };
  }, [contextMenu]);

  const tabHeaderContextMenuStyle = useMemo((): CSSProperties | undefined => {
    if (!tabHeaderContextMenu || typeof window === "undefined") {
      return;
    }
    const padding = 8;
    const estimatedWidth = 240;
    const estimatedHeight = 52;
    return {
      left: Math.max(
        padding,
        Math.min(
          tabHeaderContextMenu.x,
          window.innerWidth - estimatedWidth - padding
        )
      ),
      position: "fixed",
      right: "auto",
      top: Math.max(
        padding,
        Math.min(
          tabHeaderContextMenu.y,
          window.innerHeight - estimatedHeight - padding
        )
      ),
      zIndex: 170,
    };
  }, [tabHeaderContextMenu]);

  const onTabStripContextMenu = useCallback(
    (sessionId: string, event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setMenuOpen(false);
      setContextMenu(null);
      setProfileSelectorOpen(false);
      setTabHeaderContextMenu({
        sessionId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const onContextCopy = useCallback(async () => {
    if (!contextRuntime) {
      return;
    }
    await contextRuntime.copySelection();
    closeTerminalContextMenu();
  }, [contextRuntime, closeTerminalContextMenu]);

  const onContextPaste = useCallback(async () => {
    if (!contextRuntime) {
      return;
    }
    await contextRuntime.pasteFromClipboard();
    closeTerminalContextMenu();
  }, [contextRuntime, closeTerminalContextMenu]);

  const onContextSelectAll = useCallback(() => {
    contextRuntime?.selectAll();
    closeTerminalContextMenu();
  }, [contextRuntime, closeTerminalContextMenu]);

  const openProfileSettingsFromToolbar = useCallback(
    (profile: TerminalProfile | null, tab: "general" | "ports") => {
      if (!profile) {
        return;
      }
      setSettingsOpenProfileRequest({
        nonce: Date.now(),
        profileId: profile.id,
        tab,
      });
      setSettingsOpen(true);
      setMenuOpen(false);
      setContextMenu(null);
      setTabHeaderContextMenu(null);
    },
    []
  );

  const openSftpPanel = useCallback(
    (sessionId: string) => {
      setSftpPanelOpenBySession((prev) => ({ ...prev, [sessionId]: true }));
      revealTerminalToolbar();
    },
    [revealTerminalToolbar]
  );

  const closeSftpPanel = useCallback((sessionId: string) => {
    setSftpPanelOpenBySession((prev) => {
      if (!prev[sessionId]) {
        return prev;
      }
      return { ...prev, [sessionId]: false };
    });
  }, []);

  const updateSftpPanelPath = useCallback(
    (sessionId: string, nextPath: string) => {
      setSftpPanelPathBySession((prev) => ({ ...prev, [sessionId]: nextPath }));
    },
    []
  );

  const openPortsPanel = useCallback(
    (sessionId: string) => {
      setPortsPanelOpenBySession((prev) => ({ ...prev, [sessionId]: true }));
      revealTerminalToolbar();
    },
    [revealTerminalToolbar]
  );

  const closePortsPanel = useCallback((sessionId: string) => {
    setPortsPanelOpenBySession((prev) => {
      if (!prev[sessionId]) {
        return prev;
      }
      return { ...prev, [sessionId]: false };
    });
  }, []);

  const reconnectSession = useCallback(
    async (sessionId: string) => {
      const profileId = resolvedSessionProfiles[sessionId]?.id;
      await closeSession(sessionId, { force: true });
      await createSession(profileId);
      revealTerminalToolbar();
    },
    [
      closeSession,
      createSession,
      resolvedSessionProfiles,
      revealTerminalToolbar,
    ]
  );

  const onToggleMaximize = useCallback(async () => {
    if (!shell) {
      return;
    }
    await shell.invoke("app:windowToggleMaximize");
    const result = (await shell.invoke("app:windowGetState")) as {
      ok?: boolean;
      maximized?: boolean;
    };
    if (result?.ok && typeof result.maximized === "boolean") {
      setWindowMaximized(result.maximized);
    }
    setMenuOpen(false);
  }, [shell]);

  const dismissAuthPrompt = useCallback(async () => {
    if (!authPromptModal || !shell) {
      setAuthPromptModal(null);
      return;
    }
    await shell
      .invoke("term:sessionClearPrompt", authPromptModal.sessionId)
      .catch(() => {
        /* ignore */
      });
    setAuthPromptModal(null);
  }, [authPromptModal, shell]);

  const submitAuthPrompt = useCallback(
    async (value: string, remember: boolean) => {
      const promptState = authPromptModal;
      if (!promptState || !shell) {
        return;
      }
      if (!value.length) {
        return;
      }
      const result = (await shell
        .invoke(
          "term:sessionRespondToPrompt",
          promptState.sessionId,
          `${value}\r`
        )
        .catch(() => ({ ok: false }))) as { ok?: boolean };
      if (result.ok && promptState.profileId) {
        await shell
          .invoke("term:profilePasswordCacheSet", promptState.profileId, value)
          .catch(() => {
            /* ignore */
          });
        if (remember && promptState.kind === "password") {
          await shell
            .invoke("term:profilePasswordSet", promptState.profileId, value)
            .catch(() => {
              /* ignore */
            });
        }
      }
      setAuthPromptModal(null);
    },
    [authPromptModal, shell]
  );

  if (!shell) {
    return (
      <div className="ref-uterm-root ref-uterm-root--empty">
        {t("app.universalTerminalUnavailable")}
      </div>
    );
  }

  return (
    <div className="ref-uterm-root">
      <div className="ref-uterm-titlebar" role="banner">
        <div
          aria-label={t("app.universalTerminalWindowTitle")}
          className="ref-uterm-tabstrip"
          role="tablist"
        >
          {settingsOpen ? (
            <TerminalTabButton
              active
              icon={<IconSettings className="ref-uterm-tab-icon" />}
              label={t("app.universalTerminalSettings.title")}
              onClose={() => setSettingsOpen(false)}
              onSelect={() => setSettingsOpen(true)}
            />
          ) : null}
          {sessions.map((session, index) => (
            <TerminalTabButton
              active={!settingsOpen && session.id === activeSession?.id}
              exited={exitByTab[session.id] !== undefined}
              icon={<IconTerminal className="ref-uterm-tab-icon" />}
              key={session.id}
              label={session.title || `Shell ${index + 1}`}
              meta={session.cwd}
              onClose={() => void closeSession(session.id)}
              onContextMenu={(event) =>
                onTabStripContextMenu(session.id, event)
              }
              onDragOver={(event) => event.preventDefault()}
              onDragStart={(event) =>
                event.dataTransfer.setData(
                  "application/x-ref-terminal-session",
                  session.id
                )
              }
              onDrop={(event) => {
                const sourceId = event.dataTransfer.getData(
                  "application/x-ref-terminal-session"
                );
                if (sourceId) {
                  reorderSession(sourceId, session.id);
                }
              }}
              onSelect={() => {
                setActiveId(session.id);
                setSettingsOpen(false);
              }}
            />
          ))}
          <div className="ref-uterm-tabstrip-tail">
            <button
              aria-label={t("app.universalTerminalNewTab")}
              className="ref-uterm-tab-add"
              onClick={() => void createSession()}
              title={t("app.universalTerminalNewTab")}
              type="button"
            >
              <IconPlus className="ref-uterm-tab-add-icon" />
            </button>
            <button
              aria-expanded={profileSelectorOpen}
              aria-haspopup="dialog"
              aria-label={t(
                "app.universalTerminalSettings.nav.profilesConnections"
              )}
              className={`ref-uterm-tab-profile ${profileSelectorOpen ? "is-active" : ""}`}
              onClick={() => {
                setMenuOpen(false);
                setTabHeaderContextMenu(null);
                setProfileSelectorOpen(true);
              }}
              title={t("app.universalTerminalSettings.nav.profilesConnections")}
              type="button"
            >
              <IconProfilesConnections className="ref-uterm-tab-profile-icon" />
            </button>
          </div>
        </div>

        <div aria-hidden="true" className="ref-uterm-drag-spacer" />

        <div className="ref-uterm-titlebar-actions">
          <button
            aria-label={t("app.universalTerminalSettings.title")}
            className={`ref-uterm-icon-btn ${settingsOpen ? "is-active" : ""}`}
            onClick={() => setSettingsOpen(true)}
            title={t("app.universalTerminalSettings.title")}
            type="button"
          >
            <IconSettings className="ref-uterm-icon-btn-svg" />
          </button>
          <div className="ref-uterm-menu-wrap" ref={menuWrapRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={t("app.universalTerminalMenu.title")}
              className="ref-uterm-icon-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              title={t("app.universalTerminalMenu.title")}
              type="button"
            >
              <IconDotsHorizontal className="ref-uterm-icon-btn-svg" />
            </button>
            {menuOpen ? (
              <div className="ref-uterm-dropdown" role="menu">
                <button
                  className="ref-uterm-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    void createSession();
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("app.universalTerminalNewTab")}
                </button>
                <button
                  className="ref-uterm-dropdown-item"
                  disabled={!activeId}
                  onClick={() => {
                    if (activeId) {
                      setMenuOpen(false);
                      void closeSession(activeId);
                    }
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("app.universalTerminalMenu.closeActiveTab")}
                </button>
                {terminalSettings.profiles.length > 0 ||
                displayBuiltinProfiles.length > 0 ? (
                  <>
                    <div className="ref-uterm-dropdown-sep" role="separator" />
                    <div className="ref-uterm-dropdown-label">
                      {t("app.universalTerminalMenu.newWithProfile")}
                    </div>
                    {[
                      ...terminalSettings.profiles,
                      ...displayBuiltinProfiles,
                    ].map((profile) => (
                      <button
                        className="ref-uterm-dropdown-item ref-uterm-dropdown-item--stack"
                        key={profile.id}
                        onClick={() => {
                          setMenuOpen(false);
                          void createSession(profile.id);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <span>
                          {profile.name ||
                            t(
                              "app.universalTerminalSettings.profiles.untitled"
                            )}
                        </span>
                        <span className="ref-uterm-dropdown-item-meta">
                          {describeTerminalProfileTarget(profile, t)}
                          {profile.id === defaultProfile?.id
                            ? ` · ${t("app.universalTerminalMenu.defaultSuffix")}`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                <div className="ref-uterm-dropdown-sep" role="separator" />
                <button
                  className="ref-uterm-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("app.universalTerminalSettings.title")}
                </button>
                <div className="ref-uterm-dropdown-sep" role="separator" />
                <button
                  className="ref-uterm-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    void shell.invoke("app:windowMinimize");
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("app.window.minimize")}
                </button>
                <button
                  className="ref-uterm-dropdown-item"
                  onClick={() => void onToggleMaximize()}
                  role="menuitem"
                  type="button"
                >
                  {windowMaximized
                    ? t("app.window.restore")
                    : t("app.window.maximize")}
                </button>
                <button
                  className="ref-uterm-dropdown-item ref-uterm-dropdown-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    void shell.invoke("app:windowClose");
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("app.window.close")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {tabHeaderContextMenu ? (
        <TerminalTabHeaderContextMenu
          defaultProfileId={terminalSettings.defaultProfileId}
          onClose={closeTabHeaderContextMenu}
          onCloseSession={(id) => void closeSession(id)}
          onCreateSession={(pid) => void createSession(pid)}
          onDuplicateSession={(id) => void duplicateSession(id)}
          onSplitSession={(id, orientation) => void splitSession(id, orientation)}
          sessionId={tabHeaderContextMenu.sessionId}
          sessionProfileId={sessionProfiles[tabHeaderContextMenu.sessionId]}
          style={tabHeaderContextMenuStyle}
          t={t}
        />
      ) : null}

      <div
        className={`ref-uterm-stage ref-uterm-stage--settings ${settingsOpen ? "" : "is-hidden"}`}
      >
        <TerminalSettingsPanel
          builtinProfiles={builtinProfiles}
          onChange={persistSettings}
          onLaunchProfile={(profileId) => void createSession(profileId)}
          openProfileRequest={settingsOpenProfileRequest}
          settings={terminalSettings}
          t={t}
        />
      </div>

      <div
        aria-hidden={settingsOpen}
        className={`ref-uterm-stage ref-uterm-stage--terminal ${settingsOpen ? "is-hidden" : ""}`}
        style={terminalStageStyle}
      >
        {sessions.length === 0 ? (
          <TerminalStartPage
            defaultActionMeta={startPageDefaultMeta}
            onCreate={() => void createSession()}
            onLaunchProfile={(profileId) => void createSession(profileId)}
            onOpenSettings={() => setSettingsOpen(true)}
            profiles={visibleStartPageProfiles}
            remainingProfileCount={Math.max(
              0,
              startPageProfiles.length - visibleStartPageProfiles.length
            )}
            t={t}
          />
        ) : (
          <>
            <div
              className={`ref-uterm-panes ${splitLayout.enabled && splitSecondarySession ? `is-split is-split-${splitLayout.orientation}` : ""}`}
              ref={panesRef}
            >
              {splitLayout.enabled && splitSecondarySession ? (
                <div
                  aria-orientation={
                    splitLayout.orientation === "horizontal"
                      ? "vertical"
                      : "horizontal"
                  }
                  className="ref-uterm-split-resizer"
                  onPointerDown={beginSplitResize}
                  role="separator"
                />
              ) : null}
              {sessions.map((session) => (
                <TerminalPane
                  exitCode={exitByTab[session.id]}
                  isActive={session.id === activeSession?.id}
                  key={session.id}
                  onAuthPrompt={openAuthPrompt}
                  onClosePortsPanel={closePortsPanel}
                  onCloseSession={(id) => void closeSession(id)}
                  onCloseSftpPanel={closeSftpPanel}
                  onCloseSplit={closeSplit}
                  onHandleExit={handleExit}
                  onHideToolbar={hideTerminalToolbar}
                  onOpenPortsPanel={openPortsPanel}
                  onOpenProfileSettings={(p, tab) =>
                    openProfileSettingsFromToolbar(p, tab)
                  }
                  onOpenSftpPanel={openSftpPanel}
                  onReconnectSession={(id) => void reconnectSession(id)}
                  onRequestContextMenu={handleRequestContextMenu}
                  onRevealToolbar={revealTerminalToolbar}
                  onSetActive={(id) => setActiveId(id)}
                  onToggleToolbarPinned={toggleTerminalToolbarPinned}
                  onUpdateSftpPanelPath={updateSftpPanelPath}
                  paneActive={
                    !settingsOpen &&
                    visibleTerminalSessions.some((s) => s.id === session.id)
                  }
                  portsPanelOpen={Boolean(portsPanelOpenBySession[session.id])}
                  registerRuntime={registerRuntime}
                  session={session}
                  sessionProfile={resolvedSessionProfiles[session.id] ?? null}
                  settingsOpen={settingsOpen}
                  sftpPanelOpen={Boolean(sftpPanelOpenBySession[session.id])}
                  sftpPanelPath={sftpPanelPathBySession[session.id]}
                  shell={shell}
                  splitEnabled={splitLayout.enabled}
                  t={t}
                  terminalSettings={terminalSettings}
                  themeColors={themeColors}
                  toolbarPinned={toolbarPinned}
                  toolbarRevealed={toolbarRevealed}
                />
              ))}
            </div>
            {contextMenu ? (
              <TerminalViewportContextMenu
                contextRuntime={contextRuntime}
                onCopy={() => void onContextCopy()}
                onPaste={() => void onContextPaste()}
                onSelectAll={onContextSelectAll}
                style={contextMenuStyle}
                t={t}
              />
            ) : null}
          </>
        )}
      </div>
      {profileSelectorOpen ? (
        <TerminalProfileSelectorModal
          customProfiles={terminalSettings.profiles.map((p) =>
            withTerminalWindowProfileLabel(p, t)
          )}
          defaultProfileId={terminalSettings.defaultProfileId}
          describeTarget={(p) => describeTerminalProfileTarget(p, t)}
          displayBuiltinProfiles={displayBuiltinProfiles}
          onClose={() => setProfileSelectorOpen(false)}
          onManageProfiles={() => setSettingsOpen(true)}
          onPickProfile={(profileId) => void createSession(profileId)}
          profileSelectorRecentMax={terminalSettings.profileSelectorRecentMax}
          profileSelectorShowBuiltin={
            terminalSettings.profileSelectorShowBuiltin
          }
          t={t}
        />
      ) : null}
      {authPromptModal ? (
        <TerminalAuthPromptModal
          kind={authPromptModal.kind}
          onCancel={() => void dismissAuthPrompt()}
          onSubmit={(value, remember) => void submitAuthPrompt(value, remember)}
          profileName={authPromptModal.profileName}
          prompt={authPromptModal.prompt}
          sessionTitle={authPromptModal.sessionTitle}
          t={t}
        />
      ) : null}
    </div>
  );
});
