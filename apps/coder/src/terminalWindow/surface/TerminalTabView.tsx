import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Terminal as XTerm } from "@xterm/xterm";
import type * as React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "../../i18n";
import "@xterm/xterm/css/xterm.css";
import { dispatchTerminalHotkey } from "../terminalHotkeyDispatch";
import { installXtermHotkeyRouting } from "../terminalHotkeyXtermInstall";
import { showTerminalCopiedNotice } from "../terminalNoticeToast";
import {
  isTerminalAlternateScreen,
  playAudibleTerminalBell,
  prepareTerminalPasteText,
} from "../terminalRuntime";
import {
  mergeResolvedTerminalHotkeysMap,
  type TerminalAppSettings,
  type TerminalProfile,
} from "../terminalSettings";
import {
  applyInputBackspaceMode,
  maybeRunLoginScripts,
} from "./terminalThemeUtils";
import type {
  BufferSlice,
  ShellBridge,
  TabViewProps,
  TerminalContextMenuState,
  TerminalRuntimeControls,
  TerminalSessionAuthPrompt,
  XTermThemeColors,
} from "./types";

export type LatestRef<T> = { current: T };

export function useLatestRef<T>(value: T): LatestRef<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function applyTerminalOptions(
  term: XTerm,
  appSettings: TerminalAppSettings,
  fontScale = 1
): void {
  term.options.fontFamily = appSettings.fontFamily;
  term.options.fontSize = appSettings.fontSize * fontScale;
  term.options.fontWeight = appSettings.fontWeight;
  term.options.fontWeightBold = appSettings.fontWeightBold;
  term.options.lineHeight = appSettings.lineHeight;
  term.options.cursorBlink = appSettings.cursorBlink;
  term.options.cursorStyle = appSettings.cursorStyle;
  term.options.scrollback = appSettings.scrollback;
  term.options.minimumContrastRatio = appSettings.minimumContrastRatio;
  term.options.drawBoldTextInBrightColors =
    appSettings.drawBoldTextInBrightColors;
  term.options.scrollOnUserInput = appSettings.scrollOnInput;
  term.options.wordSeparator = appSettings.wordSeparator;
  term.options.ignoreBracketedPasteMode = !appSettings.bracketedPaste;
}

export function applyTerminalTheme(term: XTerm, theme: XTermThemeColors): void {
  term.options.theme = {
    background: theme.background,
    black: theme.black,
    brightBlack: theme.brightBlack,
    cursor: theme.cursor,
    cursorAccent: theme.background,
    foreground: theme.foreground,
    selectionBackground: theme.selectionBackground,
  };
}

export function useXtermTerminal(opts: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  termRef: React.MutableRefObject<XTerm | null>;
  fitRef: React.MutableRefObject<FitAddon | null>;
  searchAddonRef: React.MutableRefObject<SearchAddon | null>;
  sessionId: string;
  shell: ShellBridge;
  theme: XTermThemeColors;
  appSettingsRef: React.MutableRefObject<TerminalAppSettings>;
}): void {
  const {
    containerRef,
    termRef,
    fitRef,
    searchAddonRef,
    sessionId,
    shell,
    theme,
    appSettingsRef,
  } = opts;
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !shell?.subscribeTerminalSessionData) {
      return;
    }
    const term = new XTerm({ allowProposedApi: true });
    applyTerminalTheme(term, theme);
    applyTerminalOptions(term, appSettingsRef.current);
    const fit = new FitAddon();
    const searchAddon = new SearchAddon({ highlightLimit: 500 });
    term.loadAddon(fit);
    term.loadAddon(searchAddon);
    term.open(el);
    termRef.current = term;
    fitRef.current = fit;
    searchAddonRef.current = searchAddon;
    return () => {
      searchAddonRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [containerRef, fitRef, searchAddonRef, sessionId, shell, termRef]);
}

export function useTerminalSessionData(opts: {
  termRef: React.MutableRefObject<XTerm | null>;
  seenSeqRef: React.MutableRefObject<number>;
  sessionId: string;
  shell: ShellBridge;
  profileRef: LatestRef<TerminalProfile | null>;
  onAuthPromptRef: LatestRef<
    (sessionId: string, prompt: TerminalSessionAuthPrompt) => void
  >;
  onExitRef: React.MutableRefObject<(code: number | null) => void>;
}): void {
  const {
    termRef,
    seenSeqRef,
    sessionId,
    shell,
    profileRef,
    onAuthPromptRef,
    onExitRef,
  } = opts;
  useEffect(() => {
    let cancelled = false;
    const term = termRef.current;
    if (!term || !shell?.subscribeTerminalSessionData) {
      return;
    }
    const loginScriptsState =
      profileRef.current?.loginScripts.map((script) => ({ ...script })) ?? [];
    const subscribeAndReplay = async () => {
      try {
        const sub = (await shell.invoke("term:sessionSubscribe", sessionId)) as
          | { ok: true; slice: BufferSlice }
          | { ok: false };
        if (cancelled || !sub.ok) {
          return;
        }
        seenSeqRef.current = sub.slice.seq;
        if (sub.slice.content) {
          term.write(sub.slice.content);
        }
        if (sub.slice.authPrompt) {
          onAuthPromptRef.current(sessionId, sub.slice.authPrompt);
        }
        if (!sub.slice.alive) {
          onExitRef.current?.(sub.slice.exitCode);
        }
      } catch {
        /* ignore */
      }
    };
    void subscribeAndReplay();
    void maybeRunLoginScripts(shell, sessionId, "", loginScriptsState);
    const unsubData = shell.subscribeTerminalSessionData((id, data, seq) => {
      if (id !== sessionId) {
        return;
      }
      if (seq && seq <= seenSeqRef.current) {
        return;
      }
      seenSeqRef.current = seq || seenSeqRef.current + 1;
      term.write(data);
      void maybeRunLoginScripts(shell, sessionId, data, loginScriptsState);
    });
    const unsubExit =
      shell.subscribeTerminalSessionExit?.((id, code) => {
        if (id === sessionId) {
          onExitRef.current?.(typeof code === "number" ? code : null);
        }
      }) ?? (() => {});
    return () => {
      cancelled = true;
      unsubData?.();
      unsubExit();
      void shell.invoke("term:sessionUnsubscribe", sessionId).catch(() => {
        /* ignore */
      });
    };
  }, [
    onAuthPromptRef,
    onExitRef,
    profileRef,
    seenSeqRef,
    sessionId,
    shell,
    termRef,
  ]);
}

export function useTerminalResize(opts: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  termRef: React.MutableRefObject<XTerm | null>;
  fitRef: React.MutableRefObject<FitAddon | null>;
  active: boolean;
  activeRef: React.MutableRefObject<boolean>;
  sessionId: string;
  shell: ShellBridge;
}): void {
  const { containerRef, termRef, fitRef, active, activeRef, sessionId, shell } =
    opts;
  const resize = useCallback(
    (focus = false) => {
      if (!activeRef.current || !fitRef.current || !containerRef.current) {
        return;
      }
      try {
        fitRef.current.fit();
        if (focus) {
          termRef.current?.focus();
        }
        const dims = fitRef.current.proposeDimensions();
        if (dims && dims.cols && dims.rows) {
          void shell.invoke(
            "term:sessionResize",
            sessionId,
            dims.cols,
            dims.rows
          );
        }
      } catch {
        /* ignore */
      }
    },
    [activeRef, containerRef, fitRef, sessionId, shell, termRef]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    let resizeQueued = false;
    const observer = new ResizeObserver(() => {
      if (resizeQueued) {
        return;
      }
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        resize();
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, resize]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const raf = requestAnimationFrame(() => resize(true));
    return () => cancelAnimationFrame(raf);
  }, [active, resize]);
}

export function useTerminalPaste(opts: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  termRef: React.MutableRefObject<XTerm | null>;
  controlsRef: React.MutableRefObject<TerminalRuntimeControls | null>;
  sessionId: string;
  shell: ShellBridge;
  appSettingsRef: React.MutableRefObject<TerminalAppSettings>;
  profileRef: LatestRef<TerminalProfile | null>;
  tRef: LatestRef<TFunction>;
  onRequestContextMenuRef: LatestRef<
    (payload: TerminalContextMenuState) => void
  >;
  registerRuntimeRef: LatestRef<
    (sessionId: string, runtime: TerminalRuntimeControls | null) => void
  >;
}): void {
  const {
    containerRef,
    termRef,
    controlsRef,
    sessionId,
    shell,
    appSettingsRef,
    profileRef,
    tRef,
    onRequestContextMenuRef,
    registerRuntimeRef,
  } = opts;
  useEffect(() => {
    const el = containerRef.current;
    const term = termRef.current;
    if (!el || !term) {
      return;
    }
    const confirmMultilinePaste = async (preview: string) =>
      window.confirm(
        `${tRef.current("app.universalTerminalPasteMultipleLines")}\n\n${preview.slice(0, 1000)}`
      );
    const pasteText = async (text: string): Promise<boolean> => {
      const next = await prepareTerminalPasteText(
        text,
        appSettingsRef.current,
        isTerminalAlternateScreen(term),
        confirmMultilinePaste
      );
      if (!next) {
        return false;
      }
      term.paste(next);
      return true;
    };
    const pasteFromClipboard = async (): Promise<boolean> => {
      try {
        const raw = await shell.invoke("clipboard:readText");
        const text = typeof raw === "string" ? raw : "";
        return text ? pasteText(text) : false;
      } catch {
        return false;
      }
    };
    const copySelection = async (): Promise<boolean> => {
      const selection = term.getSelection();
      if (!selection) {
        return false;
      }
      try {
        await shell.invoke("clipboard:writeText", selection);
        return true;
      } catch {
        return false;
      }
    };
    const runtime: TerminalRuntimeControls = {
      clear: () => term.clear(),
      copySelection,
      focus: () => term.focus(),
      hasSelection: () => term.hasSelection(),
      pasteFromClipboard,
      selectAll: () => term.selectAll(),
    };
    controlsRef.current = runtime;
    registerRuntimeRef.current(sessionId, runtime);
    const inputDisposer = term.onData((data) => {
      void shell.invoke(
        "term:sessionWrite",
        sessionId,
        applyInputBackspaceMode(data, profileRef.current?.inputBackspace)
      );
    });
    const selectionDisposer = term.onSelectionChange(() => {
      if (!appSettingsRef.current.copyOnSelect || !term.hasSelection()) {
        return;
      }
      void copySelection();
    });
    const bellDisposer = term.onBell(() => {
      if (appSettingsRef.current.bell === "visual") {
        el.classList.add("ref-uterm-bell-flash");
        window.setTimeout(
          () => el.classList.remove("ref-uterm-bell-flash"),
          160
        );
        return;
      }
      if (appSettingsRef.current.bell === "audible") {
        playAudibleTerminalBell();
      }
    });
    const onContextMenu = (event: MouseEvent) => {
      const action = appSettingsRef.current.rightClickAction;
      if (action === "off") {
        return;
      }
      event.preventDefault();
      if (action === "menu") {
        onRequestContextMenuRef.current({
          sessionId,
          x: event.clientX,
          y: event.clientY,
        });
        return;
      }
      if (action === "clipboard" && term.hasSelection()) {
        void copySelection();
        return;
      }
      void pasteFromClipboard();
    };
    const onAuxClick = (event: MouseEvent) => {
      if (event.button !== 1 || !appSettingsRef.current.pasteOnMiddleClick) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void pasteFromClipboard();
    };
    const onPasteCapture = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (!text) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void pasteText(text);
    };
    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("auxclick", onAuxClick);
    el.addEventListener("paste", onPasteCapture, true);
    return () => {
      inputDisposer.dispose();
      selectionDisposer.dispose();
      bellDisposer.dispose();
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("auxclick", onAuxClick);
      el.removeEventListener("paste", onPasteCapture, true);
      controlsRef.current = null;
      registerRuntimeRef.current(sessionId, null);
    };
  }, [
    appSettingsRef,
    containerRef,
    controlsRef,
    onRequestContextMenuRef,
    profileRef,
    registerRuntimeRef,
    sessionId,
    shell,
    tRef,
    termRef,
  ]);
}

export function useTerminalHotkeys(opts: {
  termRef: React.MutableRefObject<XTerm | null>;
  searchAddonRef: React.MutableRefObject<SearchAddon | null>;
  controlsRef: React.MutableRefObject<TerminalRuntimeControls | null>;
  zoomLevelRef: React.MutableRefObject<number>;
  appSettingsRef: React.MutableRefObject<TerminalAppSettings>;
  sessionCwdRef: React.MutableRefObject<string>;
  onReconnectRef: React.MutableRefObject<(() => void) | undefined>;
  onDisconnectRef: React.MutableRefObject<(() => void) | undefined>;
  sessionId: string;
  shell: ShellBridge;
  tRef: LatestRef<TFunction>;
  setSearchUi: (value: { open: boolean; query: string }) => void;
}): void {
  const {
    termRef,
    searchAddonRef,
    controlsRef,
    zoomLevelRef,
    appSettingsRef,
    sessionCwdRef,
    onReconnectRef,
    onDisconnectRef,
    sessionId,
    shell,
    tRef,
    setSearchUi,
  } = opts;
  useEffect(() => {
    const term = termRef.current;
    const searchAddon = searchAddonRef.current;
    if (!term || !searchAddon) {
      return;
    }
    const applyZoomFontSize = () => {
      const base = appSettingsRef.current.fontSize;
      const scale = 1.1 ** zoomLevelRef.current;
      term.options.fontSize = base * scale;
      try {
        term.refresh(0, term.rows - 1);
      } catch {
        /* ignore */
      }
    };
    return installXtermHotkeyRouting(
      term,
      () => mergeResolvedTerminalHotkeysMap(appSettingsRef.current),
      (hotkeyId) => {
        const controls = controlsRef.current;
        void dispatchTerminalHotkey(hotkeyId, {
          clear: () => term.clear(),
          copySelection: () =>
            controls?.copySelection() ?? Promise.resolve(false),
          getCwd: () => sessionCwdRef.current.trim(),
          onDisconnect: () => onDisconnectRef.current?.(),
          onReconnect: () => onReconnectRef.current?.(),
          pasteFromClipboard: () =>
            controls?.pasteFromClipboard() ?? Promise.resolve(false),
          search: {
            addon: searchAddon,
            open: () => {
              const selected = term.getSelection().trim();
              setSearchUi({ open: true, query: selected });
            },
          },
          selectAll: () => term.selectAll(),
          showCopiedNotice: () =>
            showTerminalCopiedNotice(
              tRef.current("app.universalTerminalToast.copied")
            ),
          term,
          write: async (data) => {
            await shell.invoke("term:sessionWrite", sessionId, data);
          },
          writeClipboardText: async (text) => {
            await shell.invoke("clipboard:writeText", text);
          },
          zoom: {
            applyFontSize: () => applyZoomFontSize(),
            levelRef: zoomLevelRef,
          },
        });
      }
    );
  }, [
    appSettingsRef,
    controlsRef,
    onDisconnectRef,
    onReconnectRef,
    searchAddonRef,
    sessionCwdRef,
    sessionId,
    setSearchUi,
    shell,
    tRef,
    termRef,
    zoomLevelRef,
  ]);
}

export function TerminalTabView({
  sessionId,
  active,
  shell,
  onExit,
  theme,
  appSettings,
  profile,
  t,
  onRequestContextMenu,
  onAuthPrompt,
  registerRuntime,
  sessionCwd,
  onReconnect,
  onDisconnect,
}: TabViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const seenSeqRef = useRef(0);
  const activeRef = useRef(active);
  const onExitRef = useRef(onExit);
  const appSettingsRef = useRef(appSettings);
  const sessionCwdRef = useRef(sessionCwd);
  const zoomLevelRef = useRef(0);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const [searchUi, setSearchUi] = useState<{ open: boolean; query: string }>({
    open: false,
    query: "",
  });
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const onReconnectRef = useRef(onReconnect);
  const onDisconnectRef = useRef(onDisconnect);
  activeRef.current = active;
  onExitRef.current = onExit;
  appSettingsRef.current = appSettings;
  sessionCwdRef.current = sessionCwd;
  onReconnectRef.current = onReconnect;
  onDisconnectRef.current = onDisconnect;

  const terminalControlsRef = useRef<TerminalRuntimeControls | null>(null);
  const profileRef = useLatestRef(profile);
  const tRef = useLatestRef(t);
  const onAuthPromptRef = useLatestRef(onAuthPrompt);
  const onRequestContextMenuRef = useLatestRef(onRequestContextMenu);
  const registerRuntimeRef = useLatestRef(registerRuntime);

  useXtermTerminal({
    appSettingsRef,
    containerRef,
    fitRef,
    searchAddonRef,
    sessionId,
    shell,
    termRef,
    theme,
  });
  useTerminalPaste({
    appSettingsRef,
    containerRef,
    controlsRef: terminalControlsRef,
    onRequestContextMenuRef,
    profileRef,
    registerRuntimeRef,
    sessionId,
    shell,
    termRef,
    tRef,
  });
  useTerminalSessionData({
    onAuthPromptRef,
    onExitRef,
    profileRef,
    seenSeqRef,
    sessionId,
    shell,
    termRef,
  });
  useTerminalResize({
    active,
    activeRef,
    containerRef,
    fitRef,
    sessionId,
    shell,
    termRef,
  });
  useTerminalHotkeys({
    appSettingsRef,
    controlsRef: terminalControlsRef,
    onDisconnectRef,
    onReconnectRef,
    searchAddonRef,
    sessionCwdRef,
    sessionId,
    setSearchUi,
    shell,
    termRef,
    tRef,
    zoomLevelRef,
  });

  useEffect(() => {
    zoomLevelRef.current = 0;
  }, [appSettings.fontSize]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) {
      return;
    }
    applyTerminalOptions(term, appSettings, 1.1 ** zoomLevelRef.current);
  }, [appSettings]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) {
      return;
    }
    applyTerminalTheme(term, theme);
  }, [theme]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      try {
        fit.fit();
        term.focus();
        const dims = fit.proposeDimensions();
        if (dims && dims.cols && dims.rows) {
          void shell.invoke(
            "term:sessionResize",
            sessionId,
            dims.cols,
            dims.rows
          );
        }
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [active, sessionId, shell]);

  useEffect(() => {
    if (!searchUi.open || !active) {
      return;
    }
    const term = termRef.current;
    const addon = searchAddonRef.current;
    if (!term || !addon) {
      return;
    }
    const id = requestAnimationFrame(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
      const q = searchUi.query;
      if (q) {
        addon.findNext(q, {
          caseSensitive: false,
          decorations: {
            activeMatchBackground: "#ffff00",
            activeMatchColorOverviewRuler: "#ffff00",
            matchBackground: "#888888",
            matchOverviewRuler: "#888888",
          },
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [searchUi.open, searchUi.query, active]);

  const closeFind = useCallback(() => {
    searchAddonRef.current?.clearDecorations();
    setSearchUi({ open: false, query: "" });
    const term = termRef.current;
    term?.focus();
  }, []);

  const onFindNext = useCallback(() => {
    const addon = searchAddonRef.current;
    if (!addon) {
      return;
    }
    const q = findInputRef.current?.value ?? searchUi.query;
    addon.findNext(q, {
      caseSensitive: false,
      decorations: {
        activeMatchBackground: "#ffff00",
        activeMatchColorOverviewRuler: "#ffff00",
        matchBackground: "#888888",
        matchOverviewRuler: "#888888",
      },
    });
  }, [searchUi.query]);

  const onFindPrevious = useCallback(() => {
    const addon = searchAddonRef.current;
    if (!addon) {
      return;
    }
    const q = findInputRef.current?.value ?? searchUi.query;
    addon.findPrevious(q, {
      caseSensitive: false,
      decorations: {
        activeMatchBackground: "#ffff00",
        activeMatchColorOverviewRuler: "#ffff00",
        matchBackground: "#888888",
        matchOverviewRuler: "#888888",
      },
    });
  }, [searchUi.query]);

  return (
    <div className="ref-uterm-tab-term-wrap">
      {searchUi.open && active ? (
        <div className="ref-uterm-findbar" role="search">
          <input
            aria-label={t("app.universalTerminalFind.placeholder")}
            className="ref-uterm-findbar-input"
            onChange={(event) =>
              setSearchUi((prev) => ({ ...prev, query: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (event.shiftKey) {
                  onFindPrevious();
                } else {
                  onFindNext();
                }
              }
              if (event.key === "Escape") {
                event.preventDefault();
                closeFind();
              }
            }}
            placeholder={t("app.universalTerminalFind.placeholder")}
            ref={findInputRef}
            type="search"
            value={searchUi.query}
          />
          <button
            className="ref-uterm-findbar-btn"
            onClick={onFindPrevious}
            type="button"
          >
            {t("app.universalTerminalFind.prev")}
          </button>
          <button
            className="ref-uterm-findbar-btn"
            onClick={onFindNext}
            type="button"
          >
            {t("app.universalTerminalFind.next")}
          </button>
          <button
            className="ref-uterm-findbar-btn ref-uterm-findbar-btn--close"
            onClick={closeFind}
            type="button"
          >
            {t("app.universalTerminalFind.close")}
          </button>
        </div>
      ) : null}
      <div
        aria-hidden={!active}
        className="ref-uterm-viewport"
        ref={containerRef}
      />
    </div>
  );
}

export const MemoTerminalTabView = memo(TerminalTabView);
