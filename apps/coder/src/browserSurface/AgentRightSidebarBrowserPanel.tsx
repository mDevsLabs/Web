import { BrowserCaptureDock } from "./BrowserCaptureDock";
import {
  type CSSProperties,
  type FormEvent,
  memo,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fingerprintSettingsToInjectPatch } from "../../main-src/browser/browserFingerprintNormalize.js";
import { isGoogleLoginUrl } from "../../main-src/browser/googleLoginHosts.js";
import { useAppShellChromeCore } from "../app/appShellContexts";
import { buildBrowserFingerprintStealthScript } from "../browserFingerprintStealth.js";
import { getBrowserHookScript } from "../browserHookScript.js";
import {
  BROWSER_SIDEBAR_CONFIG_SYNC_EVENT,
  type BrowserSidebarSettingsConfig,
  browserSidebarConfigSyncDetail,
  DEFAULT_BROWSER_SIDEBAR_CONFIG,
  normalizeBrowserSidebarConfig,
} from "../browserSidebarConfig";
import { IconCloseSmall, IconSettings } from "../icons";
import {
  type AgentRightSidebarView,
  BROWSER_CAPTURE_DETAIL_VISIBLE_KEY,
  BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT,
  BROWSER_CAPTURE_DOCK_EXPANDED_KEY,
  BROWSER_CAPTURE_DOCK_HEIGHT_KEY,
  BROWSER_CAPTURE_DOCK_MAX_HEIGHT,
  BROWSER_CAPTURE_DOCK_MIN_HEIGHT,
  BROWSER_CAPTURE_REQUEST_PAGE_SIZE,
  BROWSER_CAPTURE_DOCK_TAB_KEY,
  type BrowserCaptureAnalysisRecordUi,
  type BrowserCaptureDetailTab,
  type BrowserCaptureExportAction,
  type BrowserCaptureHookEventUi,
  type BrowserCaptureMethodFilter,
  type BrowserCapturePanelTab,
  type BrowserCaptureProxyBusy,
  type BrowserCaptureProxyStatusUi,
  type BrowserCaptureRequestDetailUi,
  type BrowserCaptureRequestSummaryUi,
  type BrowserCaptureResourceFilter,
  type BrowserCaptureSessionSummaryUi,
  type BrowserCaptureSourceFilter,
  type BrowserCaptureStatusFilter,
  type BrowserCaptureStorageSnapshotUi,
  type BrowserCaptureUiState,
  type BrowserControlPayload,
  type BrowserFailEvent,
  BrowserTabView,
  BrowserTabs,
  BrowserToolbar,
  type BrowserTab,
  createBrowserTab,
  RightSidebarTabs,
  browserCaptureBuildAgentDraft,
  browserCaptureBuildCurl,
  browserCaptureBuildHarExport,
  browserCaptureBuildJsonExport,
  browserCaptureDownloadTextFile,
  browserCaptureExportFileName,
  browserCaptureFormatBody,
  clampBrowserCaptureDockHeight,
  mergeBrowserCaptureRequestSummaries,
  normalizeBrowserCaptureList,
  normalizeBrowserCaptureProxyStatus,
  normalizeBrowserCaptureRequestDetail,
  normalizeBrowserCaptureRequestDetails,
  normalizeBrowserCaptureUiState,
  normalizeBrowserExtractedText,
  normalizeBrowserTarget,
  notifyBrowserCommandResult,
  safeGetWebviewUrl,
} from "./index";

export const AgentRightSidebarBrowserPanel = memo(
  function AgentRightSidebarBrowserPanel({
    hasAgentPlanSidebarContent,
    closeSidebar,
    openView,
    onOpenBrowserSettings,
    pendingCommand,
    onCommandHandled,
    variant = "sidebar",
  }: {
    hasAgentPlanSidebarContent: boolean;
    closeSidebar: () => void;
    openView: (view: AgentRightSidebarView) => void;
    onOpenBrowserSettings: () => void;
    pendingCommand: BrowserControlPayload | null;
    onCommandHandled: (commandId: string) => void;
    variant?: "sidebar" | "window";
  }) {
    const { t, shell } = useAppShellChromeCore();
    const webviewsRef = useRef<Map<string, MaiShellWebviewElement>>(new Map());
    const addressInputRef = useRef<HTMLInputElement | null>(null);
    const defaultUserAgentRef = useRef("");

    const initialTab = useMemo(() => createBrowserTab(), []);
    const [tabs, setTabs] = useState<BrowserTab[]>([initialTab]);
    const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);
    const tabsRef = useRef(tabs);
    tabsRef.current = tabs;
    const activeTabIdRef = useRef(activeTabId);
    activeTabIdRef.current = activeTabId;

    const [browserPartition, setBrowserPartition] = useState("");
    const [browserConfigReady, setBrowserConfigReady] = useState(false);
    const [browserConfig, setBrowserConfig] =
      useState<BrowserSidebarSettingsConfig>(DEFAULT_BROWSER_SIDEBAR_CONFIG);
    const [captureState, setCaptureState] =
      useState<BrowserCaptureUiState | null>(null);
    const [captureBusy, setCaptureBusy] = useState<
      "start" | "stop" | "clear" | null
    >(null);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [googleLoginNotice, setGoogleLoginNotice] = useState<
      { kind: "info"; url: string } | { kind: "error"; message: string } | null
    >(null);
    const [capturePanelExpanded, setCapturePanelExpanded] = useState(() => {
      try {
        const stored = window.localStorage.getItem(
          BROWSER_CAPTURE_DOCK_EXPANDED_KEY
        );
        return stored == null ? false : stored !== "0";
      } catch {
        return false;
      }
    });
    const [captureDockHeight, setCaptureDockHeight] = useState(() => {
      try {
        return clampBrowserCaptureDockHeight(
          Number(window.localStorage.getItem(BROWSER_CAPTURE_DOCK_HEIGHT_KEY))
        );
      } catch {
        return BROWSER_CAPTURE_DOCK_DEFAULT_HEIGHT;
      }
    });
    const [capturePanelTab, setCapturePanelTab] =
      useState<BrowserCapturePanelTab>(() => {
        try {
          const stored = window.localStorage.getItem(
            BROWSER_CAPTURE_DOCK_TAB_KEY
          );
          return stored === "devices" ||
            stored === "hooks" ||
            stored === "storage"
            ? (stored as BrowserCapturePanelTab)
            : "requests";
        } catch {
          return "requests";
        }
      });
    const [captureQuery, setCaptureQuery] = useState("");
    const [captureStatusFilter, setCaptureStatusFilter] =
      useState<BrowserCaptureStatusFilter>("all");
    const [captureSourceFilter, setCaptureSourceFilter] =
      useState<BrowserCaptureSourceFilter>("all");
    const [captureMethodFilter, setCaptureMethodFilter] =
      useState<BrowserCaptureMethodFilter>("all");
    const [captureResourceFilter, setCaptureResourceFilter] =
      useState<BrowserCaptureResourceFilter>("all");
    const [captureRequests, setCaptureRequests] = useState<
      BrowserCaptureRequestSummaryUi[]
    >([]);
    const [captureRequestTotal, setCaptureRequestTotal] = useState(0);
    const [captureListBusy, setCaptureListBusy] = useState(false);
    const [captureListError, setCaptureListError] = useState<string | null>(
      null
    );
    const captureRequestsRef = useRef<BrowserCaptureRequestSummaryUi[]>([]);
    const captureListRequestSeqRef = useRef(0);
    const [selectedCaptureRequestIds, setSelectedCaptureRequestIds] = useState<
      Set<string>
    >(() => new Set());
    const [selectedCaptureRequestId, setSelectedCaptureRequestId] = useState<
      string | null
    >(null);
    const [selectedCaptureRequest, setSelectedCaptureRequest] =
      useState<BrowserCaptureRequestDetailUi | null>(null);
    const [selectedCaptureBusy, setSelectedCaptureBusy] = useState(false);
    const [captureDetailTab, setCaptureDetailTab] =
      useState<BrowserCaptureDetailTab>("headers");
    const [captureExportBusy, setCaptureExportBusy] =
      useState<BrowserCaptureExportAction | null>(null);
    const [captureExportError, setCaptureExportError] = useState<string | null>(
      null
    );
    const [copiedCaptureField, setCopiedCaptureField] = useState<string | null>(
      null
    );
    const copiedCaptureFieldTimerRef = useRef<number | null>(null);
    const captureSelectAllRef = useRef<HTMLInputElement | null>(null);
    const [captureProxyStatus, setCaptureProxyStatus] =
      useState<BrowserCaptureProxyStatusUi | null>(null);
    const [captureProxyBusy, setCaptureProxyBusy] =
      useState<BrowserCaptureProxyBusy | null>(null);
    const [captureProxyError, setCaptureProxyError] = useState<string | null>(
      null
    );
    const [captureDetailVisible, setCaptureDetailVisible] = useState<boolean>(
      () => {
        try {
          const stored = window.localStorage.getItem(
            BROWSER_CAPTURE_DETAIL_VISIBLE_KEY
          );
          return stored == null ? true : stored !== "0";
        } catch {
          return true;
        }
      }
    );
    const [captureExportMenuOpen, setCaptureExportMenuOpen] = useState(false);
    const captureExportMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureHookEvents, setCaptureHookEvents] = useState<
      BrowserCaptureHookEventUi[]
    >([]);
    const [captureHookEventTotal, setCaptureHookEventTotal] = useState(0);
    const [captureHookCategoryFilter, setCaptureHookCategoryFilter] =
      useState<string>("all");
    const [captureHookQuery, setCaptureHookQuery] = useState("");
    const [captureStorageSnapshots, setCaptureStorageSnapshots] = useState<
      BrowserCaptureStorageSnapshotUi[]
    >([]);
    const [captureStorageActiveHost, setCaptureStorageActiveHost] = useState<
      string | null
    >(null);
    const [captureSessionsList, setCaptureSessionsList] = useState<
      BrowserCaptureSessionSummaryUi[]
    >([]);
    const [captureSessionsMenuOpen, setCaptureSessionsMenuOpen] =
      useState(false);
    const [captureSessionsSaveName, setCaptureSessionsSaveName] = useState("");
    const [captureSessionsBusy, setCaptureSessionsBusy] = useState<
      "save" | "load" | "delete" | null
    >(null);
    const captureSessionsMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureAnalyzeMenuOpen, setCaptureAnalyzeMenuOpen] = useState(false);
    const [captureAnalyzeBusy, setCaptureAnalyzeBusy] = useState(false);
    const captureAnalyzeMenuRef = useRef<HTMLDivElement | null>(null);
    const [captureRecentAnalyses, setCaptureRecentAnalyses] = useState<
      BrowserCaptureAnalysisRecordUi[]
    >([]);
    const browserHookScript = useMemo(() => getBrowserHookScript(), []);
    const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);
    const [clearDataBusy, setClearDataBusy] = useState(false);
    const [clearDataError, setClearDataError] = useState<string | null>(null);
    const captureIsActive = captureState?.capturing === true;

    const applyBrowserConfigLocally = useCallback(
      (
        rawConfig: Partial<BrowserSidebarSettingsConfig>,
        defaultUserAgent?: string
      ) => {
        let nextConfig = DEFAULT_BROWSER_SIDEBAR_CONFIG;
        setBrowserConfig((prev) => {
          nextConfig = normalizeBrowserSidebarConfig(rawConfig, prev);
          return nextConfig;
        });
        if (typeof defaultUserAgent === "string") {
          defaultUserAgentRef.current = defaultUserAgent.trim();
        }
        const nextUserAgent =
          nextConfig.userAgent.trim() || defaultUserAgentRef.current;
        webviewsRef.current.forEach((node) => {
          if (nextUserAgent) {
            try {
              node.setUserAgent(nextUserAgent);
            } catch {
              /* ignore */
            }
          }
          try {
            node.reload();
          } catch {
            /* ignore */
          }
        });
        setTabs((prev) => prev.map((tab) => ({ ...tab, loadError: null })));
      },
      []
    );

    const refreshBrowserCaptureState = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:getState")) as {
          ok?: boolean;
          state?: unknown;
        };
        if (payload?.ok) {
          setCaptureState(normalizeBrowserCaptureUiState(payload.state));
          setCaptureError(null);
        }
      } catch (error) {
        setCaptureError(error instanceof Error ? error.message : String(error));
      }
    }, [shell]);

    const runBrowserCaptureAction = useCallback(
      async (action: "start" | "stop" | "clear") => {
        if (!shell || captureBusy) {
          return;
        }
        setCaptureBusy(action);
        setCaptureError(null);
        try {
          const channel =
            action === "start"
              ? "browserCapture:start"
              : action === "stop"
                ? "browserCapture:stop"
                : "browserCapture:clear";
          const payload = (await shell.invoke(
            channel,
            action === "start" ? { clear: true } : undefined
          )) as {
            ok?: boolean;
            state?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureFailed"))
            );
          }
          setCaptureState(normalizeBrowserCaptureUiState(payload.state));
          if (action === "start") {
            setCapturePanelExpanded(true);
          }
          if (action === "clear" || action === "start") {
            captureListRequestSeqRef.current += 1;
            captureRequestsRef.current = [];
            setCaptureRequests([]);
            setCaptureRequestTotal(0);
            setCaptureListBusy(false);
            setSelectedCaptureRequestIds(new Set());
            setSelectedCaptureRequestId(null);
            setSelectedCaptureRequest(null);
            setCaptureExportError(null);
          }
        } catch (error) {
          setCaptureError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureBusy(null);
        }
      },
      [captureBusy, shell, t]
    );

    const refreshBrowserCaptureProxyStatus = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        // First refresh server-side hints (CA installed, system proxy enabled).
        await shell.invoke("browserCapture:proxyCaRefresh").catch(() => {
          /* refresh hints best-effort */
        });
        const payload = (await shell.invoke("browserCapture:proxyStatus")) as {
          ok?: boolean;
          status?: unknown;
          error?: unknown;
        };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureProxyFailed"))
          );
        }
        setCaptureProxyStatus(
          normalizeBrowserCaptureProxyStatus(payload.status)
        );
        setCaptureProxyError(null);
      } catch (error) {
        setCaptureProxyError(
          error instanceof Error ? error.message : String(error)
        );
      }
    }, [shell, t]);

    const runBrowserCaptureProxyAction = useCallback(
      async (action: "start" | "stop", options?: { systemProxy?: boolean }) => {
        if (!shell || captureProxyBusy || captureBusy) {
          return;
        }
        setCaptureProxyBusy(action);
        setCaptureProxyError(null);
        try {
          if (action === "start" && !captureIsActive) {
            const capturePayload = (await shell.invoke("browserCapture:start", {
              clear: false,
            })) as {
              ok?: boolean;
              state?: unknown;
              error?: unknown;
            };
            if (!capturePayload?.ok) {
              throw new Error(
                String(capturePayload?.error ?? t("app.browserCaptureFailed"))
              );
            }
            setCaptureState(
              normalizeBrowserCaptureUiState(capturePayload.state)
            );
          }
          const payload = (await shell.invoke(
            action === "start"
              ? "browserCapture:proxyStart"
              : "browserCapture:proxyStop",
            action === "start"
              ? {
                  port: captureProxyStatus?.port ?? 8888,
                  systemProxy: options?.systemProxy === true,
                }
              : undefined
          )) as {
            ok?: boolean;
            status?: unknown;
            error?: unknown;
            systemProxyError?: string;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyFailed"))
            );
          }
          setCaptureProxyStatus(
            normalizeBrowserCaptureProxyStatus(payload.status)
          );
          if (
            typeof payload.systemProxyError === "string" &&
            payload.systemProxyError
          ) {
            setCaptureProxyError(payload.systemProxyError);
          }
          setCapturePanelExpanded(true);
          await refreshBrowserCaptureState();
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [
        captureBusy,
        captureIsActive,
        captureProxyBusy,
        captureProxyStatus?.port,
        refreshBrowserCaptureState,
        shell,
        t,
      ]
    );

    const toggleSystemProxy = useCallback(
      async (next: boolean) => {
        if (!shell || captureProxyBusy) {
          return;
        }
        setCaptureProxyBusy("refresh");
        setCaptureProxyError(null);
        try {
          const payload = (await shell.invoke(
            "browserCapture:proxySystemProxyToggle",
            { enable: next }
          )) as {
            ok?: boolean;
            status?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyFailed"))
            );
          }
          if (payload.status) {
            setCaptureProxyStatus(
              normalizeBrowserCaptureProxyStatus(payload.status)
            );
          }
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [captureProxyBusy, shell, t]
    );

    const installBrowserCaptureProxyCa = useCallback(
      async (uninstall = false, scope: "user" | "machine" = "user") => {
        if (!shell || captureProxyBusy) {
          return;
        }
        const confirmKey = uninstall
          ? "app.browserCaptureCaUninstallConfirm"
          : scope === "machine"
            ? "app.browserCaptureCaInstallMachineConfirm"
            : "app.browserCaptureCaInstallConfirm";
        const fallbackMsg = uninstall
          ? "Remove the mAI Coder capture root certificate from the trust store?"
          : scope === "machine"
            ? "Install the mAI Coder capture root CA system-wide? This requires administrator rights."
            : "Install the mAI Coder capture root CA into your user trust store? Windows/macOS will ask you to confirm.";
        const message = (() => {
          const localized = t(confirmKey);
          return localized && localized !== confirmKey
            ? localized
            : fallbackMsg;
        })();
        if (
          typeof window !== "undefined" &&
          typeof window.confirm === "function"
        ) {
          if (!window.confirm(message)) {
            return;
          }
        }
        setCaptureProxyBusy("ca");
        setCaptureProxyError(null);
        try {
          const channel = uninstall
            ? "browserCapture:proxyCaUninstall"
            : "browserCapture:proxyCaInstall";
          const payload = (await shell.invoke(channel, { scope })) as {
            ok?: boolean;
            installed?: boolean;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureProxyCaFailed"))
            );
          }
          await refreshBrowserCaptureProxyStatus();
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureProxyBusy(null);
        }
      },
      [captureProxyBusy, refreshBrowserCaptureProxyStatus, shell, t]
    );

    const copyBrowserCaptureProxySnippet = useCallback(
      async (kind: "curl" | "wget" | "python" | "node" | "env") => {
        if (!shell) {
          return;
        }
        try {
          const payload = (await shell.invoke(
            "browserCapture:proxyCopySnippet",
            { kind }
          )) as {
            ok?: boolean;
            snippet?: string;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(String(payload?.error ?? "copy failed"));
          }
          setCopiedCaptureField(`snippet:${kind}`);
          if (copiedCaptureFieldTimerRef.current != null) {
            window.clearTimeout(copiedCaptureFieldTimerRef.current);
          }
          copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
            setCopiedCaptureField(null);
            copiedCaptureFieldTimerRef.current = null;
          }, 1400);
        } catch (error) {
          setCaptureProxyError(
            error instanceof Error ? error.message : String(error)
          );
        }
      },
      [shell]
    );

    const exportBrowserCaptureProxyCa = useCallback(async () => {
      if (!shell || captureProxyBusy) {
        return;
      }
      setCaptureProxyBusy("ca");
      setCaptureProxyError(null);
      try {
        const payload = (await shell.invoke(
          "browserCapture:proxyExportCa"
        )) as {
          ok?: boolean;
          ca?: unknown;
          error?: unknown;
        };
        if (!payload?.ok || !payload.ca || typeof payload.ca !== "object") {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureProxyCaFailed"))
          );
        }
        const ca = payload.ca as Record<string, unknown>;
        const pem = typeof ca.pem === "string" ? ca.pem : "";
        if (!pem) {
          throw new Error(t("app.browserCaptureProxyCaFailed"));
        }
        browserCaptureDownloadTextFile(
          typeof ca.fileName === "string" && ca.fileName
            ? ca.fileName
            : "mai-coder-capture-ca.pem",
          typeof ca.mimeType === "string" && ca.mimeType
            ? ca.mimeType
            : "application/x-pem-file",
          pem
        );
        setCopiedCaptureField("ca");
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1400);
        await refreshBrowserCaptureProxyStatus();
      } catch (error) {
        setCaptureProxyError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureProxyBusy(null);
      }
    }, [captureProxyBusy, refreshBrowserCaptureProxyStatus, shell, t]);

    const handleHookEventsForTab = useCallback(
      (tabId: string, events: unknown[]) => {
        if (!shell || !events.length) {
          return;
        }
        void shell
          .invoke("browserCapture:hookIngest", { events, tabId })
          .catch(() => {
            /* ignore */
          });
      },
      [shell]
    );

    const handleStorageSnapshotForTab = useCallback(
      (tabId: string, snapshot: unknown) => {
        if (!shell || !snapshot || typeof snapshot !== "object") {
          return;
        }
        void shell
          .invoke("browserCapture:storageIngest", { snapshot, tabId })
          .catch(() => {
            /* ignore */
          });
      },
      [shell]
    );

    const refreshBrowserCaptureSessions = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:sessionsList")) as {
          ok?: boolean;
          sessions?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.sessions)) {
          setCaptureSessionsList(
            payload.sessions
              .filter((row): row is Record<string, unknown> =>
                Boolean(row && typeof row === "object")
              )
              .map(
                (row): BrowserCaptureSessionSummaryUi => ({
                  createdAt: Number(row.createdAt) || 0,
                  hookEventCount: Number(row.hookEventCount) || 0,
                  id: String(row.id ?? ""),
                  name: typeof row.name === "string" ? row.name : "(untitled)",
                  note: typeof row.note === "string" ? row.note : null,
                  requestCount: Number(row.requestCount) || 0,
                  storageHostCount: Number(row.storageHostCount) || 0,
                  updatedAt: Number(row.updatedAt) || 0,
                })
              )
          );
        }
      } catch {
        /* ignore */
      }
    }, [shell]);

    const saveBrowserCaptureSession = useCallback(async () => {
      if (!shell || captureSessionsBusy) {
        return;
      }
      setCaptureSessionsBusy("save");
      try {
        const fallbackName = `Capture ${new Date().toLocaleString()}`;
        const name = captureSessionsSaveName.trim() || fallbackName;
        const payload = (await shell.invoke("browserCapture:sessionsSave", {
          name,
        })) as { ok?: boolean; error?: unknown };
        if (payload?.ok) {
          setCaptureSessionsSaveName("");
          await refreshBrowserCaptureSessions();
        }
      } catch {
        /* ignore */
      } finally {
        setCaptureSessionsBusy(null);
      }
    }, [
      captureSessionsBusy,
      captureSessionsSaveName,
      refreshBrowserCaptureSessions,
      shell,
    ]);

    const loadBrowserCaptureSession = useCallback(
      async (id: string) => {
        if (!shell || captureSessionsBusy) {
          return;
        }
        setCaptureSessionsBusy("load");
        try {
          const payload = (await shell.invoke("browserCapture:sessionsLoad", {
            id,
          })) as { ok?: boolean; state?: unknown };
          if (payload?.ok) {
            if (payload.state) {
              setCaptureState(normalizeBrowserCaptureUiState(payload.state));
            }
            setCaptureSessionsMenuOpen(false);
            setCapturePanelExpanded(true);
          }
        } catch {
          /* ignore */
        } finally {
          setCaptureSessionsBusy(null);
        }
      },
      [captureSessionsBusy, shell]
    );

    const deleteBrowserCaptureSession = useCallback(
      async (id: string) => {
        if (!shell || captureSessionsBusy) {
          return;
        }
        setCaptureSessionsBusy("delete");
        try {
          await shell.invoke("browserCapture:sessionsDelete", { id });
          await refreshBrowserCaptureSessions();
        } catch {
          /* ignore */
        } finally {
          setCaptureSessionsBusy(null);
        }
      },
      [captureSessionsBusy, refreshBrowserCaptureSessions, shell]
    );

    const refreshBrowserCaptureStorage = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:storageList")) as {
          ok?: boolean;
          snapshots?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.snapshots)) {
          const next = payload.snapshots.map(
            (raw): BrowserCaptureStorageSnapshotUi => {
              const obj =
                raw && typeof raw === "object"
                  ? (raw as Record<string, unknown>)
                  : {};
              const localEntries = Array.isArray(obj.localStorage)
                ? (obj.localStorage as Record<string, unknown>[])
                : [];
              const sessionEntries = Array.isArray(obj.sessionStorage)
                ? (obj.sessionStorage as Record<string, unknown>[])
                : [];
              return {
                cookies: typeof obj.cookies === "string" ? obj.cookies : "",
                host: typeof obj.host === "string" ? obj.host : "",
                id:
                  typeof obj.id === "string"
                    ? obj.id
                    : `storage:${Math.random()}`,
                localStorage: localEntries
                  .filter((e) => e && typeof e === "object")
                  .map((e) => ({
                    key: typeof e.key === "string" ? e.key : "",
                    value: typeof e.value === "string" ? e.value : "",
                  })),
                sessionStorage: sessionEntries
                  .filter((e) => e && typeof e === "object")
                  .map((e) => ({
                    key: typeof e.key === "string" ? e.key : "",
                    value: typeof e.value === "string" ? e.value : "",
                  })),
                tabId: typeof obj.tabId === "string" ? obj.tabId : null,
                ts: typeof obj.ts === "number" ? obj.ts : 0,
                url: typeof obj.url === "string" ? obj.url : "",
              };
            }
          );
          setCaptureStorageSnapshots(next);
          if (
            next.length > 0 &&
            (!captureStorageActiveHost ||
              !next.some((entry) => entry.host === captureStorageActiveHost))
          ) {
            setCaptureStorageActiveHost(next[0].host);
          } else if (next.length === 0) {
            setCaptureStorageActiveHost(null);
          }
        }
      } catch {
        /* ignore */
      }
    }, [captureStorageActiveHost, shell]);

    const refreshBrowserCaptureHookEvents = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:hookList", {
          category: captureHookCategoryFilter,
          limit: 200,
          offset: 0,
          query: captureHookQuery.trim() || undefined,
        })) as { ok?: boolean; result?: { items?: unknown[]; total?: number } };
        if (payload?.ok && payload.result) {
          const items = Array.isArray(payload.result.items)
            ? payload.result.items
            : [];
          setCaptureHookEvents(
            items.map((raw): BrowserCaptureHookEventUi => {
              const obj =
                raw && typeof raw === "object"
                  ? (raw as Record<string, unknown>)
                  : {};
              return {
                args: typeof obj.args === "string" ? obj.args : "",
                category:
                  typeof obj.category === "string" ? obj.category : "unknown",
                id:
                  typeof obj.id === "string" ? obj.id : `hook-${Math.random()}`,
                label: typeof obj.label === "string" ? obj.label : "event",
                result: typeof obj.result === "string" ? obj.result : null,
                seq: typeof obj.seq === "number" ? obj.seq : 0,
                stack: typeof obj.stack === "string" ? obj.stack : "",
                tabId: typeof obj.tabId === "string" ? obj.tabId : null,
                ts: typeof obj.ts === "number" ? obj.ts : 0,
                url: typeof obj.url === "string" ? obj.url : "",
              };
            })
          );
          setCaptureHookEventTotal(
            typeof payload.result.total === "number"
              ? payload.result.total
              : items.length
          );
        }
      } catch {
        /* swallow */
      }
    }, [captureHookCategoryFilter, captureHookQuery, shell]);

    const refreshBrowserCaptureRequests = useCallback(
      async (mode: "replace" | "append" = "replace") => {
        if (!shell) {
          return;
        }
        const append = mode === "append";
        const requestSeq = ++captureListRequestSeqRef.current;
        const offset = append ? captureRequestsRef.current.length : 0;
        setCaptureListBusy(true);
        setCaptureListError(null);
        try {
          const payload = (await shell.invoke("browserCapture:listRequests", {
            limit: BROWSER_CAPTURE_REQUEST_PAGE_SIZE,
            method:
              captureMethodFilter === "all" ? undefined : captureMethodFilter,
            offset,
            query: captureQuery,
            resourceType:
              captureResourceFilter === "all"
                ? undefined
                : captureResourceFilter,
            source:
              captureSourceFilter === "all" ? undefined : captureSourceFilter,
            statusGroup:
              captureStatusFilter === "all" ? undefined : captureStatusFilter,
          })) as { ok?: boolean; result?: unknown; error?: unknown };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureListFailed"))
            );
          }
          const list = normalizeBrowserCaptureList(payload.result);
          if (requestSeq !== captureListRequestSeqRef.current) {
            return;
          }
          const nextItems = append
            ? mergeBrowserCaptureRequestSummaries(
                captureRequestsRef.current,
                list.items
              )
            : list.items;
          captureRequestsRef.current = nextItems;
          setCaptureRequests(nextItems);
          setCaptureRequestTotal(list.total);
          setSelectedCaptureRequestIds((prev) => {
            if (prev.size <= 0) {
              return prev;
            }
            const visibleIds = new Set(nextItems.map((item) => item.id));
            const next = new Set(
              Array.from(prev).filter((id) => visibleIds.has(id))
            );
            return next.size === prev.size ? prev : next;
          });
          setSelectedCaptureRequestId((prev) => {
            if (prev && nextItems.some((item) => item.id === prev)) {
              return prev;
            }
            return nextItems[0]?.id ?? null;
          });
        } catch (error) {
          if (requestSeq === captureListRequestSeqRef.current) {
            setCaptureListError(
              error instanceof Error ? error.message : String(error)
            );
          }
        } finally {
          if (requestSeq === captureListRequestSeqRef.current) {
            setCaptureListBusy(false);
          }
        }
      },
      [
        captureMethodFilter,
        captureQuery,
        captureResourceFilter,
        captureSourceFilter,
        captureStatusFilter,
        shell,
        t,
      ]
    );

    const loadBrowserCaptureRequest = useCallback(
      async (requestId: string) => {
        if (!shell || !requestId) {
          setSelectedCaptureRequest(null);
          return;
        }
        setSelectedCaptureBusy(true);
        try {
          const payload = (await shell.invoke("browserCapture:getRequest", {
            requestId,
          })) as {
            ok?: boolean;
            request?: unknown;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureRequestNotFound"))
            );
          }
          setSelectedCaptureRequest(
            normalizeBrowserCaptureRequestDetail(payload.request)
          );
        } catch {
          setSelectedCaptureRequest(null);
        } finally {
          setSelectedCaptureBusy(false);
        }
      },
      [shell, t]
    );

    const clearBrowserData = useCallback(async () => {
      if (!shell || clearDataBusy) {
        return;
      }
      setClearDataBusy(true);
      setClearDataError(null);
      try {
        const payload = (await shell.invoke("browser:clearData")) as {
          ok?: boolean;
          error?: unknown;
        };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserClearDataFailed"))
          );
        }
        setClearDataConfirmOpen(false);
        setTabs((prev) =>
          prev.map((tab) => ({
            ...tab,
            isLoading: true,
            loadError: null,
          }))
        );
        webviewsRef.current.forEach((node) => {
          try {
            node.reload();
          } catch {
            /* ignore */
          }
        });
      } catch (error) {
        setClearDataError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setClearDataBusy(false);
      }
    }, [clearDataBusy, shell, t]);

    const waitForWebviewNode = useCallback(
      (
        tabId: string,
        timeoutMs = 10_000,
        signal?: AbortSignal
      ): Promise<MaiShellWebviewElement> => {
        const startedAt = Date.now();
        return new Promise((resolve, reject) => {
          let timer: number | null = null;
          const cleanup = () => {
            if (timer !== null) {
              clearTimeout(timer);
              timer = null;
            }
            signal?.removeEventListener("abort", onAbort);
          };
          const onAbort = () => {
            cleanup();
            reject(new DOMException("Aborted", "AbortError"));
          };
          if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          signal?.addEventListener("abort", onAbort, { once: true });
          const tick = () => {
            if (signal?.aborted) {
              cleanup();
              reject(new DOMException("Aborted", "AbortError"));
              return;
            }
            const node = webviewsRef.current.get(tabId);
            if (node) {
              cleanup();
              resolve(node);
              return;
            }
            if (Date.now() - startedAt >= timeoutMs) {
              cleanup();
              reject(
                new Error("Timed out waiting for browser tab to become ready.")
              );
              return;
            }
            timer = window.setTimeout(tick, 50);
          };
          tick();
        });
      },
      []
    );

    const waitForWebviewSettled = useCallback(
      (
        node: MaiShellWebviewElement,
        tabId: string,
        timeoutMs = 15_000
      ): Promise<void> => {
        const currentTab = tabsRef.current.find((tab) => tab.id === tabId);
        if (!currentTab?.isLoading) {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const cleanup = () => {
            window.clearTimeout(timer);
            node.removeEventListener("did-stop-loading", handleStopLoading);
            node.removeEventListener("did-fail-load", handleFailLoad);
          };
          const handleStopLoading = () => {
            cleanup();
            resolve();
          };
          const handleFailLoad = (event: Event) => {
            const failEvent = event as BrowserFailEvent;
            if (failEvent.isMainFrame === false || failEvent.errorCode === -3) {
              return;
            }
            cleanup();
            reject(
              new Error(
                String(failEvent.errorDescription ?? t("app.browserLoadFailed"))
              )
            );
          };
          const timer = window.setTimeout(() => {
            cleanup();
            reject(new Error("Timed out waiting for page load to finish."));
          }, timeoutMs);
          node.addEventListener("did-stop-loading", handleStopLoading);
          node.addEventListener("did-fail-load", handleFailLoad);
        });
      },
      [t]
    );

    const readPageFromWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector?: string; includeHtml?: boolean; maxChars?: number }
      ): Promise<Record<string, unknown>> => {
        const maxChars = Math.min(
          Math.max(500, Math.floor(options.maxChars ?? 12_000)),
          50_000
        );
        const script = `
				(() => {
					const args = ${JSON.stringify({
            includeHtml: options.includeHtml === true,
            maxChars,
            selector: options.selector ?? "",
          })};
					const root = args.selector ? document.querySelector(args.selector) : (document.body || document.documentElement);
					if (!root) {
						return {
							ok: false,
							error: args.selector ? 'Selector did not match any element.' : 'Page body is unavailable.',
						};
					}
					const rawText = String(root.innerText || root.textContent || '');
					const htmlText = args.includeHtml
						? String(root.outerHTML || root.innerHTML || '').slice(0, Math.min(args.maxChars, 30000))
						: '';
					const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
						.map((el) => String(el.textContent || '').trim())
						.filter(Boolean)
						.slice(0, 20);
					const links = Array.from(root.querySelectorAll('a[href]'))
						.map((el) => ({
							text: String(el.textContent || '').trim(),
							href: String(el.getAttribute('href') || '').trim(),
						}))
						.filter((item) => item.href)
						.slice(0, 20);
					const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
					return {
						ok: true,
						url: location.href,
						title: document.title || '',
						lang: document.documentElement?.lang || '',
						selector: args.selector || null,
						metaDescription: metaDescription || '',
						text: rawText,
						totalTextLength: rawText.length,
						headings,
						links,
						html: htmlText || undefined,
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(
            String(result.error ?? "Failed to read page content.")
          );
        }
        const text = normalizeBrowserExtractedText(
          String(result?.text ?? ""),
          maxChars
        );
        return {
          headings: Array.isArray(result?.headings) ? result.headings : [],
          lang: String(result?.lang ?? ""),
          links: Array.isArray(result?.links) ? result.links : [],
          metaDescription: String(result?.metaDescription ?? ""),
          selector: result?.selector ?? null,
          text,
          title: String(result?.title ?? ""),
          totalTextLength:
            Number(result?.totalTextLength ?? text.length) || text.length,
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          ...(options.includeHtml ? { html: String(result?.html ?? "") } : {}),
        };
      },
      []
    );

    const clickElementInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string }
      ): Promise<Record<string, unknown>> => {
        // Phase 1（同步脚本）：定位元素、滚到视口、fire-and-forget 启动光标动画。
        // 不在脚本里 await 异步动画，避免 executeJavaScript 持有的 Promise 跨过
        // click 触发的页面导航后失效（GUEST_VIEW_MANAGER_CALL 错误根因）。
        const setupScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target) {
						return { ok: false, error: 'Selector did not match any element.' };
					}
					if (!(target instanceof HTMLElement)) {
						return { ok: false, error: 'Matched node is not an HTMLElement.' };
					}
					target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					try {
						const cursor = window.__asyncAiCursor;
						if (cursor && typeof cursor.moveTo === 'function') {
							const labelText = String(target.innerText || target.textContent || target.getAttribute('aria-label') || target.tagName.toLowerCase()).trim().slice(0, 40);
							if (typeof cursor.label === 'function') cursor.label('点击 ' + (labelText || '元素'), 1800);
							cursor.show();
							// fire-and-forget; 渲染器侧 sleep 再发 click 脚本
							Promise.resolve(cursor.moveTo(cx, cy)).then(() => cursor.click(cx, cy)).catch(() => {});
						}
					} catch { /* decorative */ }
					return { ok: true, cx, cy };
				})()
			`;
        const setup = await node.executeJavaScript<Record<string, unknown>>(
          setupScript,
          false
        );
        if (setup?.ok === false) {
          throw new Error(String(setup.error ?? "Failed to locate element."));
        }
        // 等光标动画走完（缓动 ~500ms + hover ~200ms + click 闪 ~150ms）。
        await new Promise((r) => setTimeout(r, 850));

        // Phase 2（同步脚本）：真实点击 + 读取结果。executeJavaScript 同步返回，
        // 即便 click 触发了页面导航，这次 IPC 已经先完成了 send/return 周期。
        const clickScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target || !(target instanceof HTMLElement)) {
						return { ok: false, error: 'Element no longer present.' };
					}
					target.focus?.();
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					const beforeUrl = location.href;
					const beforeTitle = document.title || '';
					if (typeof target.click === 'function') {
						target.click();
					} else {
						target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
					}
					return {
						ok: true,
						selector: args.selector,
						tagName: target.tagName.toLowerCase(),
						text: String(target.innerText || target.textContent || '').trim().slice(0, 500),
						href: target instanceof HTMLAnchorElement ? target.href : '',
						x: cx,
						y: cy,
						urlBefore: beforeUrl,
						titleBefore: beforeTitle,
						urlAfter: location.href,
						titleAfter: document.title || '',
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          clickScript,
          true
        );
        if (result?.ok === false) {
          throw new Error(String(result.error ?? "Failed to click element."));
        }
        return {
          clickPoint: {
            x: Number(result?.x ?? 0) || 0,
            y: Number(result?.y ?? 0) || 0,
          },
          href: String(result?.href ?? ""),
          selector: String(result?.selector ?? options.selector),
          tagName: String(result?.tagName ?? ""),
          text: String(result?.text ?? ""),
          title: String(result?.titleAfter ?? ""),
          url: String(result?.urlAfter ?? safeGetWebviewUrl(node)),
          urlAfter: String(result?.urlAfter ?? safeGetWebviewUrl(node)),
          urlBefore: String(result?.urlBefore ?? ""),
        };
      },
      []
    );

    const inputTextInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string; text: string; pressEnter?: boolean }
      ): Promise<Record<string, unknown>> => {
        // Phase 1（同步）：定位、滚动、fire-and-forget 启动光标动画
        const setupScript = `
				(() => {
					const args = ${JSON.stringify({ selector: options.selector })};
					const target = document.querySelector(args.selector);
					if (!target) return { ok: false, error: 'Selector did not match any element.' };
					if (!(target instanceof HTMLElement)) return { ok: false, error: 'Matched node is not an HTMLElement.' };
					target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
					const rect = target.getBoundingClientRect();
					const cx = Math.round(rect.left + rect.width / 2);
					const cy = Math.round(rect.top + rect.height / 2);
					try {
						const cursor = window.__asyncAiCursor;
						if (cursor && typeof cursor.moveTo === 'function') {
							const labelHint = target.getAttribute('placeholder') || target.getAttribute('aria-label') || target.getAttribute('name') || target.tagName.toLowerCase();
							if (typeof cursor.label === 'function') cursor.label('填写 ' + String(labelHint).slice(0, 40), 2000);
							cursor.show();
							Promise.resolve(cursor.moveTo(cx, cy)).then(() => cursor.click(cx, cy)).catch(() => {});
						}
					} catch { /* decorative */ }
					return { ok: true, cx, cy };
				})()
			`;
        const setup = await node.executeJavaScript<Record<string, unknown>>(
          setupScript,
          false
        );
        if (setup?.ok === false) {
          throw new Error(String(setup.error ?? "Failed to locate input."));
        }
        await new Promise((r) => setTimeout(r, 850));

        // Phase 2（同步）：填值 + 逐字向 KeyCastr HUD 推送 + 可选回车
        const script = `
				(() => {
					const args = ${JSON.stringify({
            pressEnter: options.pressEnter === true,
            selector: options.selector,
            text: options.text,
          })};
					const target = document.querySelector(args.selector);
					if (!target) {
						return { ok: false, error: 'Selector did not match any element.' };
					}
					if (!(target instanceof HTMLElement)) {
						return { ok: false, error: 'Matched node is not an HTMLElement.' };
					}
					const dispatchInput = (el) => {
						el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
						el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
					};
					const setNativeValue = (el, value) => {
						const proto =
							el instanceof HTMLTextAreaElement
								? HTMLTextAreaElement.prototype
								: el instanceof HTMLInputElement
									? HTMLInputElement.prototype
									: el instanceof HTMLSelectElement
										? HTMLSelectElement.prototype
										: null;
						const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
						if (descriptor?.set) {
							descriptor.set.call(el, value);
						} else {
							el.value = value;
						}
					};
					const cursor = window.__asyncAiCursor;
					target.focus?.();
					let mode = 'unknown';
					const isFormControl =
						target instanceof HTMLInputElement ||
						target instanceof HTMLTextAreaElement ||
						target instanceof HTMLSelectElement;
					const useEditable = !isFormControl && target.isContentEditable;
					mode = isFormControl
						? target instanceof HTMLTextAreaElement
							? 'textarea'
							: target instanceof HTMLSelectElement
								? 'select'
								: 'input'
						: useEditable
							? 'contenteditable'
							: 'value' in target
								? 'value-property'
								: 'textContent';
					if (isFormControl) {
						setNativeValue(target, args.text);
						dispatchInput(target);
					} else if (useEditable) {
						target.textContent = args.text;
						dispatchInput(target);
					} else if ('value' in target) {
						try { target.value = args.text; dispatchInput(target); }
						catch { target.textContent = args.text; dispatchInput(target); }
					} else {
						target.textContent = args.text;
						dispatchInput(target);
					}
					// HUD 逐字滚出来（annulable: limite à 200 chars, timers trackés).
					try {
						if (cursor && typeof cursor.key === 'function' && args.text.length > 0) {
							const slice = args.text.slice(0, 200);
							const stagger = args.text.length > 60 ? 35 : 70;
							const timers: number[] = [];
							for (let i = 0; i < slice.length; i++) {
								const ch = slice.charAt(i);
								timers.push(window.setTimeout(() => {
									try {
										if (cursor.isConnected) cursor.key(ch);
									} catch { /* */ }
								}, i * stagger));
							}
							// Annule si le noeud est détaché avant la fin.
							const total = slice.length * stagger + 50;
							window.setTimeout(() => {
								for (const id of timers) clearTimeout(id);
							}, total + 5000);
						}
					} catch { /* decorative */ }
					if (args.pressEnter) {
						const keyboardInit = {
							key: 'Enter',
							code: 'Enter',
							keyCode: 13,
							which: 13,
							bubbles: true,
							cancelable: true,
						};
						try {
							if (cursor && typeof cursor.key === 'function') {
								const enterDelay = Math.min(args.text.length, 200) * (args.text.length > 60 ? 35 : 70);
								window.setTimeout(() => {
									try {
										if (cursor.isConnected) cursor.key('Enter');
									} catch { /* */ }
								}, enterDelay);
							}
						} catch { /* decorative */ }
						target.dispatchEvent(new KeyboardEvent('keydown', keyboardInit));
						target.dispatchEvent(new KeyboardEvent('keypress', keyboardInit));
						target.dispatchEvent(new KeyboardEvent('keyup', keyboardInit));
						const form = target.closest('form');
						if (form instanceof HTMLFormElement) {
							if (typeof form.requestSubmit === 'function') {
								form.requestSubmit();
							} else {
								form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
							}
						}
					}
					const value =
						target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
							? target.value
							: target.isContentEditable
								? String(target.textContent || '')
								: 'value' in target
									? String(target.value ?? '')
									: String(target.textContent || '');
					return {
						ok: true,
						selector: args.selector,
						mode,
						tagName: target.tagName.toLowerCase(),
						value,
						pressEnter: args.pressEnter,
						url: location.href,
						title: document.title || '',
					};
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(String(result.error ?? "Failed to input text."));
        }
        return {
          mode: String(result?.mode ?? ""),
          pressEnter: result?.pressEnter === true,
          selector: String(result?.selector ?? options.selector),
          tagName: String(result?.tagName ?? ""),
          title: String(result?.title ?? ""),
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          value: String(result?.value ?? options.text),
        };
      },
      []
    );

    const waitForSelectorInWebview = useCallback(
      async (
        node: MaiShellWebviewElement,
        options: { selector: string; visible?: boolean; timeoutMs?: number }
      ): Promise<Record<string, unknown>> => {
        const timeoutMs = Math.min(
          Math.max(500, Math.floor(options.timeoutMs ?? 20_000)),
          60_000
        );
        const script = `
				(() => {
					const args = ${JSON.stringify({
            selector: options.selector,
            timeoutMs,
            visible: options.visible === true,
          })};
					const root = document.documentElement || document.body;
					if (!root) {
						return Promise.resolve({
							ok: false,
							error: 'Document root is unavailable.',
						});
					}
					const isVisible = (el) => {
						if (!(el instanceof HTMLElement)) {
							return false;
						}
						const style = window.getComputedStyle(el);
						if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
							return false;
						}
						const rect = el.getBoundingClientRect();
						return rect.width > 0 && rect.height > 0;
					};
					const snapshot = (el) => {
						const rect = el instanceof HTMLElement ? el.getBoundingClientRect() : { width: 0, height: 0 };
						return {
							ok: true,
							selector: args.selector,
							tagName: el instanceof Element ? el.tagName.toLowerCase() : '',
							text: el instanceof Element ? String(el.innerText || el.textContent || '').trim().slice(0, 500) : '',
							visible: isVisible(el),
							url: location.href,
							title: document.title || '',
							width: Math.round(rect.width || 0),
							height: Math.round(rect.height || 0),
						};
					};
					const findMatch = () => {
						const el = document.querySelector(args.selector);
						if (!el) {
							return null;
						}
						if (args.visible && !isVisible(el)) {
							return null;
						}
						return el;
					};
					const immediate = findMatch();
					if (immediate) {
						return Promise.resolve(snapshot(immediate));
					}
					return new Promise((resolve) => {
						const observer = new MutationObserver(() => {
							const match = findMatch();
							if (!match) {
								return;
							}
							cleanup();
							resolve(snapshot(match));
						});
						const cleanup = () => {
							window.clearTimeout(timer);
							observer.disconnect();
						};
						const timer = window.setTimeout(() => {
							cleanup();
							resolve({
								ok: false,
								error: args.visible
									? 'Timed out waiting for a visible element matching the selector.'
									: 'Timed out waiting for an element matching the selector.',
							});
						}, args.timeoutMs);
						observer.observe(root, {
							childList: true,
							subtree: true,
							attributes: true,
							attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
						});
					});
				})()
			`;
        const result = await node.executeJavaScript<Record<string, unknown>>(
          script,
          true
        );
        if (result?.ok === false) {
          throw new Error(
            String(result.error ?? "Failed while waiting for selector.")
          );
        }
        return {
          selector: String(result?.selector ?? options.selector),
          size: {
            height: Number(result?.height ?? 0) || 0,
            width: Number(result?.width ?? 0) || 0,
          },
          tagName: String(result?.tagName ?? ""),
          text: String(result?.text ?? ""),
          timeoutMs,
          title: String(result?.title ?? ""),
          url: String(result?.url ?? safeGetWebviewUrl(node)),
          visible: result?.visible === true,
        };
      },
      []
    );

    const captureWebviewScreenshot = useCallback(
      async (
        node: MaiShellWebviewElement
      ): Promise<Record<string, unknown>> => {
        const image = await node.capturePage();
        const size = image.getSize();
        return {
          dataUrl: image.toDataURL(),
          height: size.height,
          title:
            tabsRef.current.find(
              (tab) => webviewsRef.current.get(tab.id) === node
            )?.pageTitle ?? "",
          url: safeGetWebviewUrl(node),
          width: size.width,
        };
      },
      []
    );

    useEffect(() => {
      let cancelled = false;
      if (!shell) {
        setBrowserPartition("async-agent-browser-fallback");
        setBrowserConfigReady(true);
        return () => {
          cancelled = true;
        };
      }
      void shell
        .invoke("browser:getConfig")
        .then((payload) => {
          if (cancelled) {
            return;
          }
          const response = payload as {
            ok?: boolean;
            partition?: string;
            config?: Partial<BrowserSidebarSettingsConfig>;
            defaultUserAgent?: string;
          };
          if (response.ok && response.partition) {
            const nextConfig = normalizeBrowserSidebarConfig(response.config);
            setBrowserPartition(response.partition);
            setBrowserConfig(nextConfig);
            defaultUserAgentRef.current = String(
              response.defaultUserAgent ?? ""
            ).trim();
          } else {
            setBrowserPartition("async-agent-browser-fallback");
          }
          setBrowserConfigReady(true);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setBrowserPartition("async-agent-browser-fallback");
          setBrowserConfigReady(true);
        });
      return () => {
        cancelled = true;
      };
    }, [shell]);

    useEffect(() => {
      void refreshBrowserCaptureState();
      const timer = window.setInterval(
        () => {
          void refreshBrowserCaptureState();
        },
        captureState?.capturing ? 1200 : 4000
      );
      return () => {
        window.clearInterval(timer);
      };
    }, [captureState?.capturing, refreshBrowserCaptureState]);

    useEffect(() => {
      // Initial refresh on mount; afterwards only poll while the proxy is running.
      // When the proxy is not running there's nothing whose state can usefully change
      // at a sub-minute granularity (CA trust + system proxy flags), and frequent
      // `certutil`/`reg query` spawns on Windows have caused user-visible churn —
      // so we either back off significantly or skip the timer entirely.
      void refreshBrowserCaptureProxyStatus();
      if (!captureProxyStatus?.running) {
        return;
      }
      const timer = window.setInterval(() => {
        void refreshBrowserCaptureProxyStatus();
      }, 15_000);
      return () => {
        window.clearInterval(timer);
      };
    }, [captureProxyStatus?.running, refreshBrowserCaptureProxyStatus]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_EXPANDED_KEY,
          capturePanelExpanded ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
    }, [capturePanelExpanded]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_HEIGHT_KEY,
          String(captureDockHeight)
        );
      } catch {
        /* ignore */
      }
    }, [captureDockHeight]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DOCK_TAB_KEY,
          capturePanelTab
        );
      } catch {
        /* ignore */
      }
    }, [capturePanelTab]);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          BROWSER_CAPTURE_DETAIL_VISIBLE_KEY,
          captureDetailVisible ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
    }, [captureDetailVisible]);

    useEffect(() => {
      if (!captureExportMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureExportMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureExportMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureExportMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureExportMenuOpen]);

    useEffect(() => {
      if (!captureSessionsMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureSessionsMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureSessionsMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureSessionsMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureSessionsMenuOpen]);

    useEffect(() => {
      if (!captureAnalyzeMenuOpen) {
        return;
      }
      const handle = (event: MouseEvent) => {
        const node = captureAnalyzeMenuRef.current;
        if (
          node &&
          event.target instanceof Node &&
          !node.contains(event.target)
        ) {
          setCaptureAnalyzeMenuOpen(false);
        }
      };
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setCaptureAnalyzeMenuOpen(false);
        }
      };
      window.addEventListener("mousedown", handle);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handle);
        window.removeEventListener("keydown", handleKey);
      };
    }, [captureAnalyzeMenuOpen]);

    useEffect(
      () => () => {
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
      },
      []
    );

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "requests") {
        return;
      }
      const timer = window.setTimeout(
        () => {
          void refreshBrowserCaptureRequests();
        },
        captureQuery.trim() ? 180 : 0
      );
      return () => {
        window.clearTimeout(timer);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureQuery,
      captureState?.pendingRequestCount,
      captureState?.requestCount,
      refreshBrowserCaptureRequests,
    ]);

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "storage") {
        return;
      }
      void refreshBrowserCaptureStorage();
      const interval = window.setInterval(() => {
        void refreshBrowserCaptureStorage();
      }, 3000);
      return () => {
        window.clearInterval(interval);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureState?.storageHostCount,
      refreshBrowserCaptureStorage,
    ]);

    useEffect(() => {
      if (!capturePanelExpanded || capturePanelTab !== "hooks") {
        return;
      }
      const timer = window.setTimeout(
        () => {
          void refreshBrowserCaptureHookEvents();
        },
        captureHookQuery.trim() ? 180 : 0
      );
      const interval = window.setInterval(() => {
        void refreshBrowserCaptureHookEvents();
      }, 1500);
      return () => {
        window.clearTimeout(timer);
        window.clearInterval(interval);
      };
    }, [
      capturePanelExpanded,
      capturePanelTab,
      captureHookQuery,
      captureHookCategoryFilter,
      captureState?.hookEventCount,
      refreshBrowserCaptureHookEvents,
    ]);

    useEffect(() => {
      if (!selectedCaptureRequestId) {
        setSelectedCaptureRequest(null);
        return;
      }
      void loadBrowserCaptureRequest(selectedCaptureRequestId);
    }, [loadBrowserCaptureRequest, selectedCaptureRequestId]);

    const copyCaptureText = useCallback(
      async (field: string, text: string) => {
        const value = String(text ?? "").trim();
        if (!value) {
          return;
        }
        let copied = false;
        try {
          const payload = (await shell?.invoke("clipboard:writeText", value)) as
            | { ok?: boolean }
            | undefined;
          copied = payload?.ok === true;
        } catch {
          /* fall back to browser clipboard */
        }
        if (!copied) {
          try {
            await navigator.clipboard.writeText(value);
            copied = true;
          } catch {
            /* clipboard can be unavailable in restricted webview contexts */
          }
        }
        if (!copied) {
          return;
        }
        setCopiedCaptureField(field);
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1200);
      },
      [shell]
    );

    const loadBrowserCaptureExportRequests = useCallback(async (): Promise<{
      requests: BrowserCaptureRequestDetailUi[];
      scope: Record<string, unknown>;
    }> => {
      if (!shell) {
        return { requests: [], scope: {} };
      }
      const requestIds = Array.from(selectedCaptureRequestIds);
      const scope =
        requestIds.length > 0
          ? { requestIds }
          : {
              method:
                captureMethodFilter === "all" ? undefined : captureMethodFilter,
              query: captureQuery.trim(),
              resourceType:
                captureResourceFilter === "all"
                  ? undefined
                  : captureResourceFilter,
              source:
                captureSourceFilter === "all" ? undefined : captureSourceFilter,
              statusGroup:
                captureStatusFilter === "all" ? undefined : captureStatusFilter,
            };
      const payload = (await shell.invoke("browserCapture:exportRequests", {
        ...scope,
        limit: 500,
        offset: 0,
      })) as { ok?: boolean; requests?: unknown; error?: unknown };
      if (!payload?.ok) {
        throw new Error(
          String(payload?.error ?? t("app.browserCaptureExportFailed"))
        );
      }
      return {
        requests: normalizeBrowserCaptureRequestDetails(payload.requests),
        scope,
      };
    }, [
      captureMethodFilter,
      captureQuery,
      captureResourceFilter,
      captureSourceFilter,
      captureStatusFilter,
      selectedCaptureRequestIds,
      shell,
      t,
    ]);

    const copyBrowserCaptureCurl = useCallback(async () => {
      if (captureExportBusy) {
        return;
      }
      setCaptureExportBusy("curl");
      setCaptureExportError(null);
      try {
        const { requests } = await loadBrowserCaptureExportRequests();
        if (requests.length <= 0) {
          throw new Error(t("app.browserCaptureNoExportableRequests"));
        }
        await copyCaptureText(
          "curl",
          requests.map(browserCaptureBuildCurl).join("\n\n")
        );
      } catch (error) {
        setCaptureExportError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureExportBusy(null);
      }
    }, [
      captureExportBusy,
      copyCaptureText,
      loadBrowserCaptureExportRequests,
      t,
    ]);

    const exportBrowserCaptureRequests = useCallback(
      async (format: "json" | "har") => {
        if (captureExportBusy) {
          return;
        }
        setCaptureExportBusy(format);
        setCaptureExportError(null);
        try {
          const { requests, scope } = await loadBrowserCaptureExportRequests();
          if (requests.length <= 0) {
            throw new Error(t("app.browserCaptureNoExportableRequests"));
          }
          const text =
            format === "har"
              ? browserCaptureBuildHarExport(requests)
              : browserCaptureBuildJsonExport(requests, scope);
          browserCaptureDownloadTextFile(
            browserCaptureExportFileName(format),
            format === "har" ? "application/har+json" : "application/json",
            text
          );
        } catch (error) {
          setCaptureExportError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureExportBusy(null);
        }
      },
      [captureExportBusy, loadBrowserCaptureExportRequests, t]
    );

    const sendBrowserCaptureToAgentDraft = useCallback(async () => {
      if (captureExportBusy || !shell) {
        return;
      }
      setCaptureExportBusy("agent");
      setCaptureExportError(null);
      try {
        const { requests } = await loadBrowserCaptureExportRequests();
        if (requests.length <= 0) {
          throw new Error(t("app.browserCaptureNoExportableRequests"));
        }
        const scopeLabel =
          selectedCaptureRequestIds.size > 0
            ? t("app.browserCaptureSelectedCount", {
                count: String(selectedCaptureRequestIds.size),
              })
            : t("app.browserCaptureFilteredCount", {
                count: String(captureRequestTotal),
              });
        const text = browserCaptureBuildAgentDraft(requests, scopeLabel, t);
        const payload = (await shell.invoke("composer:appendDraft", {
          text,
        })) as { ok?: boolean; error?: unknown };
        if (!payload?.ok) {
          throw new Error(
            String(payload?.error ?? t("app.browserCaptureSendFailed"))
          );
        }
        setCopiedCaptureField("agent");
        if (copiedCaptureFieldTimerRef.current != null) {
          window.clearTimeout(copiedCaptureFieldTimerRef.current);
        }
        copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
          setCopiedCaptureField(null);
          copiedCaptureFieldTimerRef.current = null;
        }, 1200);
      } catch (error) {
        setCaptureExportError(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setCaptureExportBusy(null);
      }
    }, [
      captureExportBusy,
      captureRequestTotal,
      loadBrowserCaptureExportRequests,
      selectedCaptureRequestIds,
      shell,
      t,
    ]);

    const analyzeBrowserCapture = useCallback(
      async (
        mode:
          | "auto"
          | "api-reverse"
          | "security-audit"
          | "performance"
          | "crypto-reverse"
      ) => {
        if (!shell || captureAnalyzeBusy) {
          return;
        }
        setCaptureAnalyzeBusy(true);
        setCaptureExportError(null);
        try {
          const requestIds =
            selectedCaptureRequestIds.size > 0
              ? Array.from(selectedCaptureRequestIds)
              : undefined;
          const payload = (await shell.invoke("browserCapture:analyze", {
            deliver: true,
            mode,
            requestIds,
          })) as {
            ok?: boolean;
            error?: unknown;
          };
          if (!payload?.ok) {
            throw new Error(
              String(payload?.error ?? t("app.browserCaptureSendFailed"))
            );
          }
          setCaptureAnalyzeMenuOpen(false);
          setCopiedCaptureField(`analyze:${mode}`);
          if (copiedCaptureFieldTimerRef.current != null) {
            window.clearTimeout(copiedCaptureFieldTimerRef.current);
          }
          copiedCaptureFieldTimerRef.current = window.setTimeout(() => {
            setCopiedCaptureField(null);
            copiedCaptureFieldTimerRef.current = null;
          }, 1400);
          // Give the dispatch handler a beat to register the new thread, then refresh.
          window.setTimeout(() => {
            void refreshBrowserCaptureAnalyses();
          }, 600);
        } catch (error) {
          setCaptureExportError(
            error instanceof Error ? error.message : String(error)
          );
        } finally {
          setCaptureAnalyzeBusy(false);
        }
      },
      [captureAnalyzeBusy, selectedCaptureRequestIds, shell, t]
    );

    const refreshBrowserCaptureAnalyses = useCallback(async () => {
      if (!shell) {
        return;
      }
      try {
        const payload = (await shell.invoke("browserCapture:analysisList")) as {
          ok?: boolean;
          entries?: unknown[];
        };
        if (payload?.ok && Array.isArray(payload.entries)) {
          setCaptureRecentAnalyses(
            payload.entries
              .filter((row): row is Record<string, unknown> =>
                Boolean(row && typeof row === "object")
              )
              .map(
                (row): BrowserCaptureAnalysisRecordUi => ({
                  createdAt: Number(row.createdAt) || 0,
                  id: String(row.id ?? ""),
                  mode: typeof row.mode === "string" ? row.mode : "auto",
                  sourceUrl:
                    typeof row.sourceUrl === "string" ? row.sourceUrl : "",
                  threadId: String(row.threadId ?? ""),
                  title:
                    typeof row.title === "string"
                      ? row.title
                      : "Capture analysis",
                })
              )
          );
        }
      } catch {
        /* ignore */
      }
    }, [shell]);

    useEffect(() => {
      void refreshBrowserCaptureAnalyses();
    }, [refreshBrowserCaptureAnalyses]);

    const openCaptureAnalysisThread = useCallback(
      async (record: BrowserCaptureAnalysisRecordUi) => {
        if (!shell || !record.threadId) return;
        try {
          await shell.invoke("threads:select", record.threadId).catch(() => {});
          // Dispatch a window event so App.tsx (which owns currentId) can pick it up too.
          window.dispatchEvent(
            new CustomEvent("mai-coder:focusThread", {
              detail: { threadId: record.threadId },
            })
          );
        } catch {
          /* ignore */
        }
      },
      [shell]
    );

    const removeCaptureAnalysisRecord = useCallback(
      async (id: string) => {
        if (!shell || !id) return;
        try {
          await shell.invoke("browserCapture:analysisRemove", { id });
          await refreshBrowserCaptureAnalyses();
        } catch {
          /* ignore */
        }
      },
      [refreshBrowserCaptureAnalyses, shell]
    );

    const toggleCaptureRequestSelected = useCallback(
      (requestId: string, selected: boolean) => {
        setSelectedCaptureRequestIds((prev) => {
          const next = new Set(prev);
          if (selected) {
            next.add(requestId);
          } else {
            next.delete(requestId);
          }
          return next;
        });
      },
      []
    );

    const toggleVisibleCaptureRequestsSelected = useCallback(() => {
      setSelectedCaptureRequestIds((prev) => {
        const visibleIds = captureRequests.map((request) => request.id);
        if (visibleIds.length <= 0) {
          return prev;
        }
        const allVisibleSelected = visibleIds.every((id) => prev.has(id));
        const next = new Set(prev);
        for (const id of visibleIds) {
          if (allVisibleSelected) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }
        return next;
      });
    }, [captureRequests]);

    const handleCaptureDockResizePointerDown = useCallback(
      (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        setCapturePanelExpanded(true);
        const startY = event.clientY;
        const startHeight = captureDockHeight;
        const panel = event.currentTarget.closest(".ref-browser-panel");
        const panelHeight =
          panel instanceof HTMLElement
            ? panel.clientHeight
            : window.innerHeight;
        const maxHeight = Math.min(
          BROWSER_CAPTURE_DOCK_MAX_HEIGHT,
          Math.max(
            BROWSER_CAPTURE_DOCK_MIN_HEIGHT,
            Math.round(panelHeight * 0.62)
          )
        );
        const handlePointerMove = (moveEvent: PointerEvent) => {
          const delta = startY - moveEvent.clientY;
          setCaptureDockHeight(
            clampBrowserCaptureDockHeight(startHeight + delta, maxHeight)
          );
        };
        const handlePointerUp = () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
          document.body.classList.remove("is-resizing-browser-capture-dock");
        };
        document.body.classList.add("is-resizing-browser-capture-dock");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
      [captureDockHeight]
    );

    const handleRegisterWebview = useCallback(
      (id: string, node: MaiShellWebviewElement | null) => {
        if (node) {
          webviewsRef.current.set(id, node);
          if (!defaultUserAgentRef.current) {
            try {
              defaultUserAgentRef.current = String(
                node.getUserAgent?.() ?? ""
              ).trim();
            } catch {
              /* ignore */
            }
          }
        } else {
          webviewsRef.current.delete(id);
        }
      },
      []
    );

    const handleTabNavigate = useCallback(
      (
        id: string,
        patch: { currentUrl: string; canGoBack: boolean; canGoForward: boolean }
      ) => {
        const addressFocused =
          typeof document !== "undefined" &&
          document.activeElement === addressInputRef.current;
        const keepDraft = id === activeTabIdRef.current && addressFocused;
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            const resolvedUrl = patch.currentUrl || tab.currentUrl;
            return {
              ...tab,
              canGoBack: patch.canGoBack,
              canGoForward: patch.canGoForward,
              currentUrl: resolvedUrl,
              draftUrl: keepDraft ? tab.draftUrl : resolvedUrl,
              loadError: null,
            };
          })
        );
      },
      []
    );

    const handleTabTitle = useCallback((id: string, title: string) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === id ? { ...tab, pageTitle: title } : tab))
      );
    }, []);

    const handleTabLoading = useCallback(
      (id: string, isLoading: boolean, currentUrl?: string) => {
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            const next: BrowserTab = { ...tab, isLoading };
            if (isLoading) {
              next.loadError = null;
            } else if (currentUrl && currentUrl !== tab.currentUrl) {
              const addressFocused =
                typeof document !== "undefined" &&
                document.activeElement === addressInputRef.current;
              const keepDraft = id === activeTabIdRef.current && addressFocused;
              next.currentUrl = currentUrl;
              if (!keepDraft) {
                next.draftUrl = currentUrl;
              }
            }
            return next;
          })
        );
      },
      []
    );

    const handleTabFailLoad = useCallback(
      (id: string, error: { message: string; url: string }) => {
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== id) {
              return tab;
            }
            return {
              ...tab,
              currentUrl: error.url || tab.currentUrl,
              isLoading: false,
              loadError: error,
            };
          })
        );
      },
      []
    );

    const showGoogleLoginExternalNotice = useCallback(
      (payload: { url?: string; error?: string | null }) => {
        const error = String(payload.error ?? "").trim();
        if (error) {
          setGoogleLoginNotice({ kind: "error", message: error });
          return;
        }
        const url = String(payload.url ?? "").trim();
        if (url) {
          setGoogleLoginNotice({ kind: "info", url });
        }
      },
      []
    );

    const redirectGoogleLoginToSystemBrowser = useCallback(
      async (rawUrl: string): Promise<boolean> => {
        const url = normalizeBrowserTarget(String(rawUrl ?? "").trim());
        if (!isGoogleLoginUrl(url)) {
          return false;
        }
        if (!shell?.invoke) {
          setGoogleLoginNotice({
            kind: "error",
            message: t("app.browserGoogleLoginExternalFailed"),
          });
          return true;
        }
        try {
          const payload = (await shell.invoke("shell:openExternalUrl", url)) as
            | { ok?: boolean; error?: string }
            | undefined;
          if (!payload || payload.ok === false) {
            setGoogleLoginNotice({
              kind: "error",
              message: String(
                payload?.error ?? t("app.browserGoogleLoginExternalFailed")
              ),
            });
            return true;
          }
          setGoogleLoginNotice({ kind: "info", url });
          return true;
        } catch (error) {
          setGoogleLoginNotice({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : t("app.browserGoogleLoginExternalFailed"),
          });
          return true;
        }
      },
      [shell, t]
    );

    const openInNewTab = useCallback(
      (url: string) => {
        const trimmed = String(url ?? "").trim();
        if (!trimmed) {
          return;
        }
        void (async () => {
          if (await redirectGoogleLoginToSystemBrowser(trimmed)) {
            return;
          }
          const tab = createBrowserTab(trimmed);
          setTabs((prev) => [...prev, tab]);
          setActiveTabId(tab.id);
        })();
      },
      [redirectGoogleLoginToSystemBrowser]
    );

    const navigateTab = useCallback(
      (tabId: string, rawTarget: string) => {
        void (async () => {
          const nextUrl = normalizeBrowserTarget(rawTarget);
          if (await redirectGoogleLoginToSystemBrowser(nextUrl)) {
            setTabs((prev) =>
              prev.map((tab) =>
                tab.id === tabId
                  ? {
                      ...tab,
                      draftUrl: tab.currentUrl || tab.draftUrl,
                      isLoading: false,
                      loadError: null,
                    }
                  : tab
              )
            );
            return;
          }
          const prevTab =
            tabsRef.current.find((tab) => tab.id === tabId) ?? null;
          const sameAsRequested = prevTab?.requestedUrl === nextUrl;
          setActiveTabId(tabId);
          setTabs((prev) =>
            prev.map((tab) => {
              if (tab.id !== tabId) {
                return tab;
              }
              return {
                ...tab,
                canGoBack: false,
                canGoForward: false,
                currentUrl: nextUrl,
                draftUrl: nextUrl,
                isLoading: true,
                loadError: null,
                pageTitle: "",
                requestedUrl: nextUrl,
              };
            })
          );
          if (sameAsRequested) {
            webviewsRef.current.get(tabId)?.reload();
          }
        })();
      },
      [redirectGoogleLoginToSystemBrowser]
    );

    // Subscribe to main-process forwarded new-window events for webview contents.
    // Electron 12+ deprecated the 'new-window' event; the host (this webContents)
    // receives 'mai-coder:browserNewWindow' from web-contents-created hook in main.
    useEffect(() => {
      const subscribe = shell?.subscribeBrowserNewWindow;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        openInNewTab(String(payload?.url ?? ""));
      });
      return () => {
        unsubscribe?.();
      };
    }, [shell, openInNewTab]);

    useEffect(() => {
      const subscribe = shell?.subscribeGoogleLoginExternal;
      if (!subscribe) {
        return;
      }
      const unsubscribe = subscribe((payload) => {
        showGoogleLoginExternalNotice({
          error: payload?.error ?? null,
          url: String(payload?.url ?? ""),
        });
      });
      return () => {
        unsubscribe?.();
      };
    }, [shell, showGoogleLoginExternalNotice]);

    const addNewTab = useCallback(() => {
      const tab = createBrowserTab();
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
      window.setTimeout(() => {
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }, 50);
    }, []);

    const closeTab = useCallback((id: string) => {
      const prev = tabsRef.current;
      const closedIndex = prev.findIndex((tab) => tab.id === id);
      if (closedIndex < 0) {
        return;
      }
      webviewsRef.current.delete(id);
      if (prev.length <= 1) {
        const fresh = createBrowserTab();
        setTabs([fresh]);
        setActiveTabId(fresh.id);
        window.setTimeout(() => {
          addressInputRef.current?.focus();
          addressInputRef.current?.select();
        }, 50);
        return;
      }
      const nextTabs = prev.filter((tab) => tab.id !== id);
      setTabs(nextTabs);
      if (activeTabIdRef.current === id) {
        const nextActive = nextTabs[Math.min(closedIndex, nextTabs.length - 1)];
        setActiveTabId(nextActive.id);
      }
    }, []);

    const activateTab = useCallback((id: string) => {
      setActiveTabId(id);
    }, []);

    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    const activeWebview = () =>
      activeTab ? (webviewsRef.current.get(activeTab.id) ?? null) : null;

    const onAddressChange = useCallback(
      (value: string) => {
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId ? { ...tab, draftUrl: value } : tab
          )
        );
      },
      [activeTabId]
    );

    const onAddressSubmit = useCallback(
      (event: FormEvent) => {
        event.preventDefault();
        if (!activeTab) {
          return;
        }
        addressInputRef.current?.blur();
        navigateTab(activeTabId, activeTab.draftUrl);
      },
      [activeTab, activeTabId, navigateTab]
    );

    const onAddressKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (activeTab) {
            setTabs((prev) =>
              prev.map((tab) =>
                tab.id === activeTabId
                  ? { ...tab, draftUrl: tab.currentUrl }
                  : tab
              )
            );
          }
          event.currentTarget.blur();
        }
      },
      [activeTab, activeTabId]
    );

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        const commandKey = event.ctrlKey || event.metaKey;
        if (commandKey && key === "l") {
          event.preventDefault();
          addressInputRef.current?.focus();
          addressInputRef.current?.select();
          return;
        }
        const target = event.target as HTMLElement | null;
        const editing =
          target instanceof HTMLElement &&
          (Boolean(target.closest("input, textarea, select")) ||
            target.isContentEditable);
        if (editing) {
          return;
        }
        if (commandKey && key === "t") {
          event.preventDefault();
          addNewTab();
          return;
        }
        if (commandKey && key === "w") {
          event.preventDefault();
          const id = activeTabIdRef.current;
          if (id) {
            closeTab(id);
          }
          return;
        }
        if ((commandKey && key === "r") || event.key === "F5") {
          event.preventDefault();
          const id = activeTabIdRef.current;
          if (!id) {
            return;
          }
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === id ? { ...tab, loadError: null } : tab
            )
          );
          webviewsRef.current.get(id)?.reload();
          return;
        }
        if (event.altKey && event.key === "ArrowLeft") {
          event.preventDefault();
          const node = webviewsRef.current.get(activeTabIdRef.current);
          if (node?.canGoBack()) {
            node.goBack();
          }
          return;
        }
        if (event.altKey && event.key === "ArrowRight") {
          event.preventDefault();
          const node = webviewsRef.current.get(activeTabIdRef.current);
          if (node?.canGoForward()) {
            node.goForward();
          }
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [addNewTab, closeTab]);

    useEffect(() => {
      const onSync = (event: Event) => {
        const detail = browserSidebarConfigSyncDetail(event);
        if (!detail) {
          return;
        }
        applyBrowserConfigLocally(detail.config, detail.defaultUserAgent);
      };
      window.addEventListener(BROWSER_SIDEBAR_CONFIG_SYNC_EVENT, onSync);
      return () => {
        window.removeEventListener(BROWSER_SIDEBAR_CONFIG_SYNC_EVENT, onSync);
      };
    }, [applyBrowserConfigLocally]);

    useEffect(() => {
      if (!shell) {
        return;
      }
      const payload = {
        activeTabId,
        guestBindings: tabs
          .map((tab) => {
            const node = webviewsRef.current.get(tab.id);
            if (!node?.getWebContentsId) {
              return null;
            }
            try {
              const webContentsId = Number(node.getWebContentsId());
              if (!Number.isInteger(webContentsId) || webContentsId <= 0) {
                return null;
              }
              return {
                tabId: tab.id,
                webContentsId,
              };
            } catch {
              return null;
            }
          })
          .filter(
            (binding): binding is { tabId: string; webContentsId: number } =>
              Boolean(binding)
          ),
        tabs: tabs.map((tab) => ({
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward,
          currentUrl: tab.currentUrl,
          id: tab.id,
          isLoading: tab.isLoading,
          loadError: tab.loadError,
          pageTitle: tab.pageTitle,
          requestedUrl: tab.requestedUrl,
        })),
        updatedAt: Date.now(),
      };
      const timer = window.setTimeout(() => {
        void shell.invoke("browser:syncState", payload).catch(() => {
          /* ignore */
        });
      }, 40);
      return () => {
        window.clearTimeout(timer);
      };
    }, [activeTabId, shell, tabs]);

    useEffect(() => {
      if (!pendingCommand) {
        return;
      }
      const command = pendingCommand;
      const finish = () => onCommandHandled(command.commandId);
      if (command.type === "navigate") {
        const activeId = activeTabIdRef.current;
        const hasActiveTab = Boolean(
          activeId && tabsRef.current.some((tab) => tab.id === activeId)
        );
        if (command.newTab || !hasActiveTab || !activeId) {
          openInNewTab(normalizeBrowserTarget(command.target));
        } else {
          navigateTab(activeId, command.target);
        }
        finish();
        return;
      }
      if (command.type === "applyConfig") {
        applyBrowserConfigLocally(command.config, command.defaultUserAgent);
        finish();
        return;
      }
      if (command.type === "closeSidebar") {
        finish();
        return;
      }
      void (async () => {
        const targetTabId =
          command.tabId &&
          tabsRef.current.some((tab) => tab.id === command.tabId)
            ? command.tabId
            : activeTabIdRef.current;
        if (!targetTabId) {
          if (
            command.type === "readPage" ||
            command.type === "screenshotPage" ||
            command.type === "clickElement" ||
            command.type === "inputText" ||
            command.type === "waitForSelector"
          ) {
            await notifyBrowserCommandResult(shell, {
              commandId: command.commandId,
              error: "No active browser tab is available.",
              ok: false,
            });
          }
          finish();
          return;
        }
        if (command.type === "closeTab") {
          closeTab(targetTabId);
          finish();
          return;
        }
        setActiveTabId(targetTabId);
        if (
          command.type === "readPage" ||
          command.type === "screenshotPage" ||
          command.type === "clickElement" ||
          command.type === "inputText" ||
          command.type === "waitForSelector"
        ) {
          try {
            const node = await waitForWebviewNode(targetTabId);
            if (command.waitForLoad !== false) {
              await waitForWebviewSettled(node, targetTabId);
            }
            if (command.type === "readPage") {
              const result = await readPageFromWebview(node, {
                includeHtml: command.includeHtml,
                maxChars: command.maxChars,
                selector: command.selector,
              });
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "clickElement") {
              const result = await clickElementInWebview(node, {
                selector: command.selector,
              });
              if (command.waitForLoad !== false) {
                await new Promise((resolve) => window.setTimeout(resolve, 60));
                await waitForWebviewSettled(node, targetTabId);
              }
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "inputText") {
              const result = await inputTextInWebview(node, {
                pressEnter: command.pressEnter,
                selector: command.selector,
                text: command.text,
              });
              if (command.waitForLoad !== false && command.pressEnter) {
                await new Promise((resolve) => window.setTimeout(resolve, 60));
                await waitForWebviewSettled(node, targetTabId);
              }
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else if (command.type === "waitForSelector") {
              const result = await waitForSelectorInWebview(node, {
                selector: command.selector,
                timeoutMs: command.timeoutMs,
                visible: command.visible,
              });
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            } else {
              const result = await captureWebviewScreenshot(node);
              await notifyBrowserCommandResult(shell, {
                commandId: command.commandId,
                ok: true,
                result,
              });
            }
          } catch (error) {
            await notifyBrowserCommandResult(shell, {
              commandId: command.commandId,
              error: error instanceof Error ? error.message : String(error),
              ok: false,
            });
          } finally {
            finish();
          }
          return;
        }
        const node = webviewsRef.current.get(targetTabId);
        if (command.type === "reload") {
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === targetTabId ? { ...tab, loadError: null } : tab
            )
          );
          node?.reload();
        } else if (command.type === "stop") {
          node?.stop();
        } else if (command.type === "goBack") {
          if (node?.canGoBack()) {
            node.goBack();
          }
        } else if (command.type === "goForward" && node?.canGoForward()) {
          node.goForward();
        }
        finish();
      })();
    }, [
      applyBrowserConfigLocally,
      captureWebviewScreenshot,
      clickElementInWebview,
      closeTab,
      inputTextInWebview,
      navigateTab,
      onCommandHandled,
      openInNewTab,
      pendingCommand,
      readPageFromWebview,
      shell,
      waitForSelectorInWebview,
      waitForWebviewNode,
      waitForWebviewSettled,
    ]);

    const headerLabel = activeTab
      ? activeTab.isLoading
        ? t("app.browserLoading")
        : activeTab.pageTitle ||
          activeTab.currentUrl.replace(/^https?:\/\//i, "") ||
          t("app.tabBrowser")
      : t("app.tabBrowser");
    const headerUrl = activeTab?.currentUrl ?? "";
    const userAgentProp = browserConfig.userAgent.trim() || undefined;
    const fingerprintPayloadKey = useMemo(
      () => JSON.stringify(browserConfig.fingerprint),
      [browserConfig.fingerprint]
    );
    const fingerprintScript = useMemo(() => {
      const patch = fingerprintSettingsToInjectPatch(browserConfig.fingerprint);
      return buildBrowserFingerprintStealthScript(patch);
    }, [fingerprintPayloadKey]);
    const captureRequestCount = captureState?.requestCount ?? 0;
    const capturePendingCount = captureState?.pendingRequestCount ?? 0;
    const captureTotalCount = captureRequestCount + capturePendingCount;
    const captureAttachedTabCount =
      captureState?.tabs.filter((tab) => tab.attached).length ?? 0;
    const captureKnownTabCount = captureState?.tabs.length ?? 0;
    const captureHasAttachError = Boolean(
      captureState?.tabs.some((tab) => tab.lastError)
    );
    const browserTabCountLabel = t("app.browserTabsCount", {
      count: String(tabs.length),
    });
    const captureProxyIsRunning = captureProxyStatus?.running === true;
    const captureProxyPrimaryAddress =
      captureProxyStatus?.primaryAddress || "127.0.0.1";
    const captureProxyPort = captureProxyStatus?.port ?? 8888;
    const captureProxyUrl =
      captureProxyStatus?.proxyUrl ||
      `http://${captureProxyPrimaryAddress}:${captureProxyPort}`;
    const captureProxyCaUrl =
      captureProxyStatus?.caDownloadUrl ||
      `${captureProxyUrl.replace(/\/$/, "")}/__async_capture/ca.pem`;
    const captureProxyStatusText = captureProxyError
      ? captureProxyError
      : captureProxyIsRunning
        ? t("app.browserCaptureProxyRunning")
        : t("app.browserCaptureProxyStopped");
    const captureProxyCaInstalled = captureProxyStatus?.caInstalled === true;
    const captureProxySystemEnabled =
      captureProxyStatus?.systemProxyEnabled === true;
    const clearDataTitle = clearDataError || t("app.browserClearData");
    const selectedCaptureSummary =
      (selectedCaptureRequestId
        ? captureRequests.find(
            (request) => request.id === selectedCaptureRequestId
          )
        : null) ?? null;
    const selectedCaptureView =
      selectedCaptureRequest ?? selectedCaptureSummary;
    const captureListCaption = captureListError
      ? captureListError
      : captureListBusy
        ? t("app.browserCaptureLoadingRequests")
        : t("app.browserCaptureShowingRequests", {
            count: String(captureRequests.length),
            total: String(captureRequestTotal),
          });
    const visibleCaptureSelectedCount = captureRequests.reduce(
      (count, request) =>
        count + (selectedCaptureRequestIds.has(request.id) ? 1 : 0),
      0
    );
    const captureSelectAllChecked =
      captureRequests.length > 0 &&
      visibleCaptureSelectedCount === captureRequests.length;
    const captureSelectedCount = selectedCaptureRequestIds.size;
    const captureBulkScopeLabel =
      captureSelectedCount > 0
        ? t("app.browserCaptureSelectedCount", {
            count: String(captureSelectedCount),
          })
        : t("app.browserCaptureFilteredCount", {
            count: String(captureRequestTotal),
          });
    const captureBulkStatusText = captureExportError || captureBulkScopeLabel;
    const captureBulkActionsDisabled =
      Boolean(captureExportBusy) ||
      (captureSelectedCount <= 0 && captureRequestTotal <= 0);
    const captureCanLoadMore = captureRequests.length < captureRequestTotal;
    const captureRemainingRequestCount = Math.max(
      0,
      captureRequestTotal - captureRequests.length
    );
    const captureStatusFilters = useMemo<
      Array<{ key: BrowserCaptureStatusFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "pending", label: t("app.browserCaptureFilterPending") },
        { key: "2xx", label: "2xx" },
        { key: "3xx", label: "3xx" },
        { key: "4xx", label: "4xx" },
        { key: "5xx", label: "5xx" },
        { key: "error", label: t("app.browserCaptureFilterError") },
      ],
      [t]
    );
    const captureMethodFilters = useMemo<
      Array<{ key: BrowserCaptureMethodFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "GET", label: "GET" },
        { key: "POST", label: "POST" },
        { key: "PUT", label: "PUT" },
        { key: "PATCH", label: "PATCH" },
        { key: "DELETE", label: "DELETE" },
        { key: "OPTIONS", label: "OPTIONS" },
        { key: "OTHER", label: t("app.browserCaptureFilterOther") },
      ],
      [t]
    );
    const captureSourceFilters = useMemo<
      Array<{ key: BrowserCaptureSourceFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "browser", label: t("app.browserCaptureSourceBrowserShort") },
        { key: "proxy", label: t("app.browserCaptureSourceProxyShort") },
      ],
      [t]
    );
    const captureResourceFilters = useMemo<
      Array<{ key: BrowserCaptureResourceFilter; label: string }>
    >(
      () => [
        { key: "all", label: t("app.browserCaptureFilterAll") },
        { key: "document", label: t("app.browserCaptureResourceDocument") },
        { key: "xhr", label: "XHR" },
        { key: "fetch", label: "Fetch" },
        { key: "script", label: t("app.browserCaptureResourceScript") },
        { key: "stylesheet", label: t("app.browserCaptureResourceStylesheet") },
        { key: "image", label: t("app.browserCaptureResourceImage") },
        { key: "other", label: t("app.browserCaptureFilterOther") },
      ],
      [t]
    );
    const captureDetailTabs = useMemo<
      Array<{ key: BrowserCaptureDetailTab; label: string }>
    >(
      () => [
        { key: "headers", label: t("app.browserCaptureTabHeaders") },
        { key: "request", label: t("app.browserCaptureTabRequest") },
        { key: "response", label: t("app.browserCaptureTabResponse") },
      ],
      [t]
    );
    const capturePanelTabs = useMemo<
      Array<{ key: BrowserCapturePanelTab; label: string }>
    >(
      () => [
        { key: "requests", label: t("app.browserCaptureTabRequests") },
        { key: "hooks", label: t("app.browserCaptureTabHooks") },
        { key: "storage", label: t("app.browserCaptureTabStorage") },
        { key: "devices", label: t("app.browserCaptureTabDevices") },
      ],
      [t]
    );
    useEffect(() => {
      if (!captureSelectAllRef.current) {
        return;
      }
      captureSelectAllRef.current.indeterminate =
        visibleCaptureSelectedCount > 0 &&
        visibleCaptureSelectedCount < captureRequests.length;
    }, [captureRequests.length, visibleCaptureSelectedCount]);
    const handleCaptureRowKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLDivElement>, requestId: string) => {
        if (event.key === "Enter") {
          event.preventDefault();
          setSelectedCaptureRequestId(requestId);
          return;
        }
        if (event.key === " ") {
          event.preventDefault();
          toggleCaptureRequestSelected(
            requestId,
            !selectedCaptureRequestIds.has(requestId)
          );
        }
      },
      [selectedCaptureRequestIds, toggleCaptureRequestSelected]
    );
    const captureDockBodyStyle = {
      "--ref-browser-capture-dock-height": `${captureDockHeight}px`,
    } as CSSProperties;
    const selectedRequestHeaderEntries = selectedCaptureRequest
      ? Object.entries(selectedCaptureRequest.requestHeaders).sort(
          ([left], [right]) => left.localeCompare(right)
        )
      : [];
    const selectedResponseHeaderEntries = selectedCaptureRequest
      ? Object.entries(selectedCaptureRequest.responseHeaders).sort(
          ([left], [right]) => left.localeCompare(right)
        )
      : [];
    const selectedRequestBodyText = selectedCaptureRequest
      ? browserCaptureFormatBody(selectedCaptureRequest.requestBody)
      : "";
    const selectedResponseBodyText = selectedCaptureRequest
      ? browserCaptureFormatBody(selectedCaptureRequest.responseBody)
      : "";
    const selectedResponseOmissionText =
      selectedCaptureRequest?.responseBodyOmittedReason
        ? t("app.browserCaptureResponseBodyOmitted", {
            reason: selectedCaptureRequest.responseBodyOmittedReason,
          })
        : "";

    return (
      <div
        className={`ref-agent-review-shell ref-browser-shell ref-browser-shell--${variant}`}
      >
        <div className="ref-agent-review-head">
          <div className="ref-browser-head-main">
            <div className="ref-agent-review-title-stack ref-browser-title-stack">
              <span className="ref-agent-review-kicker">
                <span
                  aria-hidden="true"
                  className={`ref-browser-live-dot${activeTab?.isLoading ? " is-loading" : ""}`}
                />
                {t("app.tabBrowser")}
              </span>
              <span className="ref-agent-review-title" title={headerUrl}>
                {headerLabel}
              </span>
            </div>
            <div
              aria-label={t("app.tabBrowser")}
              className="ref-browser-head-meta"
            >
              <span className="ref-browser-status-chip">
                {browserTabCountLabel}
              </span>
              {variant === "window" ? null : (
                <span
                  className={`ref-browser-status-chip${captureIsActive ? " is-active" : ""}`}
                >
                  {captureIsActive
                    ? t("app.browserCaptureRequestsShort", {
                        count: String(captureTotalCount),
                      })
                    : t("app.browserCaptureReady")}
                </span>
              )}
            </div>
          </div>
          {variant === "window" ? (
            <div className="ref-agent-review-actions">
              <button
                aria-label={t("app.browserOpenSettingsInMain")}
                className="ref-right-icon-tab"
                onClick={onOpenBrowserSettings}
                title={t("app.browserOpenSettingsInMain")}
                type="button"
              >
                <IconSettings />
              </button>
            </div>
          ) : (
            <RightSidebarTabs
              closeSidebar={closeSidebar}
              extraActions={
                <button
                  aria-label={t("app.browserSettings")}
                  className="ref-right-icon-tab"
                  onClick={onOpenBrowserSettings}
                  title={t("app.browserSettings")}
                  type="button"
                >
                  <IconSettings />
                </button>
              }
              hasPlan={hasAgentPlanSidebarContent}
              openView={openView}
              t={t}
            />
          )}
        </div>
        <div className="ref-right-panel-stage">
          <div
            className={`ref-right-panel-view ref-right-panel-view--agent ref-browser-panel ref-browser-panel--${variant}`}
          >
            {browserConfigReady ? (
              <BrowserTabs
                activeTabId={activeTabId}
                onActivateTab={activateTab}
                onCloseTab={closeTab}
                onNewTab={addNewTab}
                t={t}
                tabs={tabs}
              />
            ) : null}
            <BrowserToolbar
              activeTab={activeTab}
              addressInputRef={addressInputRef}
              clearDataBusy={clearDataBusy}
              clearDataConfirmOpen={clearDataConfirmOpen}
              clearDataError={clearDataError}
              clearDataTitle={clearDataTitle}
              onAddressChange={onAddressChange}
              onAddressKeyDown={onAddressKeyDown}
              onAddressSubmit={onAddressSubmit}
              onCancelClearData={() => {
                setClearDataConfirmOpen(false);
                setClearDataError(null);
              }}
              onClearData={() => void clearBrowserData()}
              onGoBack={() => {
                const node = activeWebview();
                if (!node?.canGoBack()) {
                  return;
                }
                node.goBack();
              }}
              onGoForward={() => {
                const node = activeWebview();
                if (!node?.canGoForward()) {
                  return;
                }
                node.goForward();
              }}
              onReloadOrStop={() => {
                const node = activeWebview();
                if (!node) {
                  return;
                }
                if (activeTab?.isLoading) {
                  node.stop();
                  return;
                }
                setTabs((prev) =>
                  prev.map((tab) =>
                    tab.id === activeTabId
                      ? { ...tab, loadError: null }
                      : tab
                  )
                );
                node.reload();
              }}
              onToggleClearDataConfirm={() => {
                setClearDataConfirmOpen((open) => !open);
                setClearDataError(null);
              }}
              t={t}
            />
            {googleLoginNotice ? (
              <div
                className={`ref-browser-capture-banner ref-browser-google-login-notice${
                  googleLoginNotice.kind === "info"
                    ? " ref-browser-capture-banner--info"
                    : ""
                }`}
                role={googleLoginNotice.kind === "error" ? "alert" : "status"}
              >
                <span>
                  {googleLoginNotice.kind === "error"
                    ? googleLoginNotice.message
                    : `${t("app.browserGoogleLoginExternalTitle")} — ${t("app.browserGoogleLoginExternalBody")}`}
                </span>
                <button
                  aria-label={t("common.close")}
                  className="ref-browser-capture-banner-dismiss"
                  onClick={() => setGoogleLoginNotice(null)}
                  title={t("common.close")}
                  type="button"
                >
                  <IconCloseSmall />
                </button>
              </div>
            ) : null}
            <div className="ref-browser-webview-wrap">
              {browserConfigReady && browserPartition ? (
                tabs.map((tab) => (
                  <BrowserTabView
                    active={tab.id === activeTabId}
                    fingerprintScript={fingerprintScript}
                    hookEnabled={
                      captureIsActive &&
                      !isGoogleLoginUrl(tab.currentUrl || tab.requestedUrl)
                    }
                    hookScript={browserHookScript}
                    key={tab.id}
                    onFailLoad={handleTabFailLoad}
                    onHookEvents={handleHookEventsForTab}
                    onLoading={handleTabLoading}
                    onNavigate={handleTabNavigate}
                    onRegisterWebview={handleRegisterWebview}
                    onStorageSnapshot={handleStorageSnapshotForTab}
                    onTitle={handleTabTitle}
                    partition={browserPartition}
                    t={t}
                    tab={tab}
                    userAgent={userAgentProp}
                  />
                ))
              ) : (
                <div className="ref-browser-preparing">
                  <div className="ref-agent-plan-status-title">
                    {t("app.browserPreparing")}
                  </div>
                  <p className="ref-agent-plan-status-body">
                    {t("app.browserSettingsDescription")}
                  </p>
                </div>
              )}
              {activeTab?.loadError ? (
                <div className="ref-browser-error-card" role="status">
                  <div className="ref-browser-error-title">
                    {t("app.browserLoadFailed")}
                  </div>
                  <p className="ref-browser-error-body">
                    {activeTab.loadError.message}
                  </p>
                  {activeTab.loadError.url ? (
                    <p
                      className="ref-browser-error-url"
                      title={activeTab.loadError.url}
                    >
                      {activeTab.loadError.url}
                    </p>
                  ) : null}
                  <button
                    className="ref-browser-error-btn"
                    onClick={() => {
                      const tabId = activeTabId;
                      setTabs((prev) =>
                        prev.map((tab) =>
                          tab.id === tabId ? { ...tab, loadError: null } : tab
                        )
                      );
                      webviewsRef.current.get(tabId)?.reload();
                    }}
                    type="button"
                  >
                    {t("common.refresh")}
                  </button>
                </div>
              ) : null}
            </div>
            <BrowserCaptureDock
              captureAttachedTabCount={captureAttachedTabCount}
              captureBusy={captureBusy}
              captureDockBodyStyle={captureDockBodyStyle}
              captureError={captureError}
              captureHasAttachError={captureHasAttachError}
              captureIsActive={captureIsActive}
              captureKnownTabCount={captureKnownTabCount}
              capturePanelExpanded={capturePanelExpanded}
              capturePanelTab={capturePanelTab}
              capturePanelTabs={capturePanelTabs}
              captureProxyBusy={captureProxyBusy}
              captureProxyError={captureProxyError}
              captureProxyIsRunning={captureProxyIsRunning}
              captureSessionsBusy={captureSessionsBusy}
              captureSessionsList={captureSessionsList}
              captureSessionsMenuOpen={captureSessionsMenuOpen}
              captureSessionsMenuRef={captureSessionsMenuRef}
              captureSessionsSaveName={captureSessionsSaveName}
              captureTotalCount={captureTotalCount}
              deleteBrowserCaptureSession={deleteBrowserCaptureSession}
              devicesTabProps={{
                captureBusy,
                captureProxyBusy,
                captureProxyCaInstalled,
                captureProxyCaUrl,
                captureProxyIsRunning,
                captureProxyPort,
                captureProxyPrimaryAddress,
                captureProxyStatusText,
                captureProxySystemEnabled,
                captureProxyUrl,
                copiedCaptureField,
                copyBrowserCaptureProxySnippet,
                copyCaptureText,
                exportBrowserCaptureProxyCa,
                installBrowserCaptureProxyCa,
                runBrowserCaptureProxyAction,
                setCapturePanelTab,
                setCaptureSourceFilter,
                shell,
                t,
                toggleSystemProxy,
              }}
              handleCaptureDockResizePointerDown={handleCaptureDockResizePointerDown}
              hooksTabProps={{
                captureHookCategoryFilter,
                captureHookEventTotal,
                captureHookEvents,
                captureHookQuery,
                captureIsActive,
                copyCaptureText,
                setCaptureHookCategoryFilter,
                setCaptureHookQuery,
                t,
              }}
              loadBrowserCaptureSession={loadBrowserCaptureSession}
              refreshBrowserCaptureSessions={refreshBrowserCaptureSessions}
              requestsTabProps={{
                analyzeBrowserCapture,
                captureAnalyzeBusy,
                captureAnalyzeMenuOpen,
                captureAnalyzeMenuRef,
                captureBulkActionsDisabled,
                captureBulkStatusText,
                captureBusy,
                captureCanLoadMore,
                captureDetailTab,
                captureDetailTabs,
                captureDetailVisible,
                captureExportBusy,
                captureExportError,
                captureExportMenuOpen,
                captureExportMenuRef,
                captureIsActive,
                captureListBusy,
                captureListCaption,
                captureMethodFilter,
                captureMethodFilters,
                captureProxyBusy,
                captureProxyIsRunning,
                captureQuery,
                captureRecentAnalyses,
                captureRemainingRequestCount,
                captureRequests,
                captureResourceFilter,
                captureResourceFilters,
                captureSelectAllChecked,
                captureSelectAllRef,
                captureSourceFilter,
                captureSourceFilters,
                captureStatusFilter,
                captureStatusFilters,
                copiedCaptureField,
                copyBrowserCaptureCurl,
                copyCaptureText,
                exportBrowserCaptureRequests,
                handleCaptureRowKeyDown,
                openCaptureAnalysisThread,
                refreshBrowserCaptureRequests,
                removeCaptureAnalysisRecord,
                runBrowserCaptureAction,
                runBrowserCaptureProxyAction,
                selectedCaptureBusy,
                selectedCaptureRequest,
                selectedCaptureRequestId,
                selectedCaptureRequestIds,
                selectedCaptureView,
                selectedRequestBodyText,
                selectedRequestHeaderEntries,
                selectedResponseBodyText,
                selectedResponseHeaderEntries,
                selectedResponseOmissionText,
                sendBrowserCaptureToAgentDraft,
                setCaptureAnalyzeMenuOpen,
                setCaptureDetailTab,
                setCaptureDetailVisible,
                setCaptureExportMenuOpen,
                setCaptureMethodFilter,
                setCaptureQuery,
                setCaptureResourceFilter,
                setCaptureSourceFilter,
                setCaptureStatusFilter,
                setSelectedCaptureRequestId,
                shell,
                t,
                toggleCaptureRequestSelected,
                toggleVisibleCaptureRequestsSelected,
              }}
              runBrowserCaptureAction={runBrowserCaptureAction}
              runBrowserCaptureProxyAction={runBrowserCaptureProxyAction}
              saveBrowserCaptureSession={saveBrowserCaptureSession}
              setCaptureError={setCaptureError}
              setCapturePanelExpanded={setCapturePanelExpanded}
              setCapturePanelTab={setCapturePanelTab}
              setCaptureProxyError={setCaptureProxyError}
              setCaptureSessionsMenuOpen={setCaptureSessionsMenuOpen}
              setCaptureSessionsSaveName={setCaptureSessionsSaveName}
              storageTabProps={{
                captureIsActive,
                captureStorageActiveHost,
                captureStorageSnapshots,
                copyCaptureText,
                setCaptureStorageActiveHost,
                t,
              }}
              t={t}
              tabsLength={tabs.length}
            />
          </div>
        </div>
      </div>
    );
  }
);