import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { Terminal as XTerm } from "@xterm/xterm";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";
import { useI18n } from "./i18n";
import { dispatchTerminalHotkey } from "./terminalWindow/terminalHotkeyDispatch";
import { installXtermHotkeyRouting } from "./terminalWindow/terminalHotkeyXtermInstall";
import { showTerminalCopiedNotice } from "./terminalWindow/terminalNoticeToast";
import {
  isTerminalAlternateScreen,
  prepareTerminalPasteText,
} from "./terminalWindow/terminalRuntime";
import {
  loadTerminalSettings,
  mergeResolvedTerminalHotkeysMap,
  subscribeTerminalSettings,
  type TerminalAppSettings,
} from "./terminalWindow/terminalSettings";

type XTermThemeColors = {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  brightBlack: string;
};

export type PtyTerminalViewProps = {
  sessionId: string;
  /** 多标签时仅当前标签参与 fit / pty resize */
  active: boolean;
  compactChrome?: boolean;
  /** shell 退出时（pty 已由主进程关闭） */
  onSessionExit?: () => void;
};

/**
 * 与主进程 node-pty 会话绑定的 xterm；输入直接进伪终端（VS Code 式交互 shell）。
 * 快捷键由 terminalSettings.hotkeys 配置。
 */
export function PtyTerminalView({
  sessionId,
  active,
  compactChrome,
  onSessionExit,
}: PtyTerminalViewProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const activeRef = useRef(active);
  const onExitRef = useRef(onSessionExit);
  const tRef = useRef(t);
  tRef.current = t;
  const settingsRef = useRef<TerminalAppSettings>(loadTerminalSettings());
  const zoomLevelRef = useRef(0);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<TerminalAppSettings>(() =>
    loadTerminalSettings()
  );
  const [themeColors, setThemeColors] = useState<XTermThemeColors>(() =>
    readPtyThemeColors()
  );
  const [searchUi, setSearchUi] = useState<{ open: boolean; query: string }>({
    open: false,
    query: "",
  });
  activeRef.current = active;
  onExitRef.current = onSessionExit;
  settingsRef.current = settings;

  useEffect(
    () =>
      subscribeTerminalSettings(() => {
        setSettings(loadTerminalSettings());
      }),
    []
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeColors(readPtyThemeColors());
    });
    observer.observe(document.documentElement, {
      attributeFilter: ["data-color-scheme"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const shell = window.maiShell;
    const el = containerRef.current;
    if (!shell?.subscribeTerminalSessionData || !el) {
      return;
    }
    const current = settingsRef.current;
    const initialTheme = readPtyThemeColors();
    const term = new XTerm({
      allowProposedApi: true,
      cursorBlink: current.cursorBlink,
      cursorStyle: current.cursorStyle,
      drawBoldTextInBrightColors: current.drawBoldTextInBrightColors,
      fontFamily: current.fontFamily,
      fontSize: current.fontSize,
      fontWeight: current.fontWeight,
      fontWeightBold: current.fontWeightBold,
      ignoreBracketedPasteMode: !current.bracketedPaste,
      lineHeight: current.lineHeight,
      minimumContrastRatio: current.minimumContrastRatio,
      scrollback: current.scrollback,
      scrollOnUserInput: current.scrollOnInput,
      theme: {
        background: initialTheme.background,
        black: initialTheme.black,
        brightBlack: initialTheme.brightBlack,
        cursor: initialTheme.cursor,
        cursorAccent: initialTheme.background,
        foreground: initialTheme.foreground,
        selectionBackground: initialTheme.selectionBackground,
      },
      wordSeparator: current.wordSeparator,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    termRef.current = term;
    fitRef.current = fit;

    const confirmMultilinePaste = async (preview: string) =>
      window.confirm(
        `${tRef.current("app.universalTerminalPasteMultipleLines")}\n\n${preview.slice(0, 1000)}`
      );

    const pasteText = async (text: string): Promise<boolean> => {
      const next = await prepareTerminalPasteText(
        text,
        settingsRef.current,
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
        if (!text) {
          return false;
        }
        return pasteText(text);
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

    const propagateResize = () => {
      if (!activeRef.current || !fitRef.current || !containerRef.current) {
        return;
      }
      try {
        fitRef.current.fit();
        const dims = fitRef.current.proposeDimensions();
        if (dims) {
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
    };

    const applyZoomFontSize = () => {
      const base = settingsRef.current.fontSize;
      const scale = 1.1 ** zoomLevelRef.current;
      term.options.fontSize = base * scale;
      try {
        term.refresh(0, term.rows - 1);
      } catch {
        /* ignore */
      }
      propagateResize();
    };

    const searchAddon = new SearchAddon({ highlightLimit: 500 });
    term.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon;

    const disposeHotkeys = installXtermHotkeyRouting(
      term,
      () => mergeResolvedTerminalHotkeysMap(settingsRef.current),
      (hotkeyId) => {
        void dispatchTerminalHotkey(hotkeyId, {
          clear: () => term.clear(),
          copySelection,
          getCwd: () => "",
          pasteFromClipboard,
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

    let cancelled = false;
    let seenSeq = 0;
    void shell
      .invoke("term:sessionSubscribe", sessionId)
      .then((raw) => {
        const sub = raw as {
          ok?: boolean;
          slice?: { content?: string; seq?: number; alive?: boolean };
        };
        if (cancelled || !sub.ok || !sub.slice) {
          return;
        }
        seenSeq = typeof sub.slice.seq === "number" ? sub.slice.seq : 0;
        if (sub.slice.content) {
          term.write(sub.slice.content);
        }
        if (sub.slice.alive === false) {
          onExitRef.current?.();
        }
      })
      .catch(() => {
        /* ignore */
      });

    const unsubData = shell.subscribeTerminalSessionData((id, data, seq) => {
      if (id !== sessionId) {
        return;
      }
      if (seq && seq <= seenSeq) {
        return;
      }
      seenSeq = seq || seenSeq + 1;
      term.write(data);
    });
    const unsubExit =
      shell.subscribeTerminalSessionExit?.((id) => {
        if (id === sessionId) {
          onExitRef.current?.();
        }
      }) ?? (() => {});

    const onDataDisposer = term.onData((data) => {
      void shell.invoke("term:sessionWrite", sessionId, data);
    });

    const selectionDisposer = term.onSelectionChange(() => {
      if (!settingsRef.current.copyOnSelect || !term.hasSelection()) {
        return;
      }
      const selected = term.getSelection();
      if (selected) {
        void shell.invoke("clipboard:writeText", selected).catch(() => {
          /* ignore */
        });
      }
    });

    const bellDisposer = term.onBell(() => {
      if (settingsRef.current.bell !== "visual") {
        return;
      }
      el.classList.add("pty-term-root--bell");
      window.setTimeout(() => {
        // el may be detached; classList op is harmless.
        try {
          el.classList.remove("pty-term-root--bell");
        } catch {
          /* ignore */
        }
      }, 160);
    });

    const onContextMenu = (event: MouseEvent) => {
      const action = settingsRef.current.rightClickAction;
      if (action === "off") {
        return;
      }
      event.preventDefault();
      if (action === "clipboard" && term.hasSelection()) {
        const selected = term.getSelection();
        if (selected) {
          void shell.invoke("clipboard:writeText", selected).catch(() => {
            /* ignore */
          });
        }
        return;
      }
      void shell
        .invoke("clipboard:readText")
        .then((raw) => {
          const text = typeof raw === "string" ? raw : "";
          if (text) {
            term.paste(text);
          }
        })
        .catch(() => {
          /* ignore */
        });
    };
    el.addEventListener("contextmenu", onContextMenu);

    const ro = new ResizeObserver(() => {
      propagateResize();
    });
    ro.observe(el);

    return () => {
      disposeHotkeys();
      searchAddonRef.current = null;
      ro.disconnect();
      onDataDisposer.dispose();
      selectionDisposer.dispose();
      bellDisposer.dispose();
      el.removeEventListener("contextmenu", onContextMenu);
      cancelled = true;
      void shell.invoke("term:sessionUnsubscribe", sessionId).catch(() => {
        /* ignore */
      });
      unsubData();
      unsubExit();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [sessionId]);
  // NOTE: themeColors/t retirés des deps: le thème est appliqué via l'effet
  // dédié ci-dessous (term.options.theme), et t est lu via ref pour éviter
  // la recréation complète du xterm + perte du scrollback à chaque toggle thème/langue.

  useEffect(() => {
    zoomLevelRef.current = 0;
  }, [settings.fontSize]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) {
      return;
    }
    term.options.fontSize = settings.fontSize * 1.1 ** zoomLevelRef.current;
    term.options.fontFamily = settings.fontFamily;
    term.options.fontWeight = settings.fontWeight;
    term.options.fontWeightBold = settings.fontWeightBold;
    term.options.lineHeight = settings.lineHeight;
    term.options.cursorBlink = settings.cursorBlink;
    term.options.cursorStyle = settings.cursorStyle;
    term.options.scrollback = settings.scrollback;
    term.options.minimumContrastRatio = settings.minimumContrastRatio;
    term.options.drawBoldTextInBrightColors =
      settings.drawBoldTextInBrightColors;
    term.options.scrollOnUserInput = settings.scrollOnInput;
    term.options.wordSeparator = settings.wordSeparator;
    term.options.ignoreBracketedPasteMode = !settings.bracketedPaste;
    try {
      term.refresh(0, term.rows - 1);
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) {
      return;
    }
    term.options.theme = {
      background: themeColors.background,
      black: themeColors.black,
      brightBlack: themeColors.brightBlack,
      cursor: themeColors.cursor,
      cursorAccent: themeColors.background,
      foreground: themeColors.foreground,
      selectionBackground: themeColors.selectionBackground,
    };
    try {
      term.refresh(0, term.rows - 1);
    } catch {
      /* ignore */
    }
  }, [themeColors]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const term = termRef.current;
    const fit = fitRef.current;
    const shell = window.maiShell;
    if (!term || !fit || !shell) {
      return;
    }
    const id = requestAnimationFrame(() => {
      try {
        fit.fit();
        const dims = fit.proposeDimensions();
        if (dims) {
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
    return () => cancelAnimationFrame(id);
  }, [active, sessionId]);

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
    termRef.current?.focus();
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
    <div
      className={`pty-term-root${compactChrome ? " pty-term-root--embedded" : ""}`}
    >
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
        <div className="xterm-viewport" ref={containerRef} />
      </div>
    </div>
  );
}

function readCssVar(name: string, fallback: string): string {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

function readPtyThemeColors(): XTermThemeColors {
  const background = readCssVar("--void-bg-0", "#11171c");
  const foreground = readCssVar("--void-fg-0", "#f3f7f8");
  const cursor = readCssVar("--void-ring", "#37d6d4");
  return {
    background,
    black: background,
    brightBlack: readCssVar("--void-fg-3", "#657582"),
    cursor,
    foreground,
    selectionBackground: withAlpha(cursor, 0.33),
  };
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `${hex}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }
  return `rgba(55, 214, 212, ${alpha})`;
}
