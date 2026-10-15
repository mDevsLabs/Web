import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { humanCursorInitScript } from "../../main-src/browser/humanCursor.js";
import type { TFunction } from "../i18n";
import { safeGetWebviewUrl } from "./captureUtils";
import {
  BROWSER_HOME_URL,
  type BrowserFailEvent,
  type BrowserNavEvent,
  type BrowserTitleEvent,
} from "./types";

export type BrowserTab = {
  id: string;
  requestedUrl: string;
  currentUrl: string;
  draftUrl: string;
  pageTitle: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  loadError: { message: string; url: string } | null;
};

let browserTabSeq = 0;
export function createBrowserTab(url: string = BROWSER_HOME_URL): BrowserTab {
  browserTabSeq += 1;
  return {
    canGoBack: false,
    canGoForward: false,
    currentUrl: url,
    draftUrl: url,
    id: `browser-tab-${Date.now().toString(36)}-${browserTabSeq}`,
    isLoading: true,
    loadError: null,
    pageTitle: "",
    requestedUrl: url,
  };
}

export interface BrowserTabViewProps {
  tab: BrowserTab;
  partition: string;
  userAgent?: string;
  fingerprintScript: string | null;
  active: boolean;
  hookEnabled: boolean;
  hookScript: string;
  onHookEvents: (tabId: string, events: unknown[]) => void;
  onStorageSnapshot: (tabId: string, snapshot: unknown) => void;
  t: TFunction;
  onNavigate: (
    id: string,
    patch: { currentUrl: string; canGoBack: boolean; canGoForward: boolean }
  ) => void;
  onTitle: (id: string, title: string) => void;
  onLoading: (id: string, isLoading: boolean, currentUrl?: string) => void;
  onFailLoad: (id: string, error: { message: string; url: string }) => void;
  onRegisterWebview: (id: string, node: MaiShellWebviewElement | null) => void;
}

export const BrowserTabView = memo(
  function BrowserTabView({
    tab,
    partition,
    userAgent,
    fingerprintScript,
    active,
    hookEnabled,
    hookScript,
    onHookEvents,
    onStorageSnapshot,
    t,
    onNavigate,
    onTitle,
    onLoading,
    onFailLoad,
    onRegisterWebview,
  }: BrowserTabViewProps) {
    const webviewRef = useRef<MaiShellWebviewElement | null>(null);
    const fingerprintScriptRef = useRef<string | null>(null);
    fingerprintScriptRef.current = fingerprintScript;
    const hookScriptRef = useRef<string>(hookScript);
    hookScriptRef.current = hookScript;
    const cursorScriptRef = useRef<string>(humanCursorInitScript());
    const hookEnabledRef = useRef<boolean>(hookEnabled);
    hookEnabledRef.current = hookEnabled;
    const onHookEventsRef =
      useRef<(tabId: string, events: unknown[]) => void>(onHookEvents);
    onHookEventsRef.current = onHookEvents;
    const onStorageSnapshotRef =
      useRef<(tabId: string, snapshot: unknown) => void>(onStorageSnapshot);
    onStorageSnapshotRef.current = onStorageSnapshot;
    const tabIdRef = useRef(tab.id);
    const [webviewSize, setWebviewSize] = useState<{
      width: number;
      height: number;
    } | null>(null);
    tabIdRef.current = tab.id;

    const syncWebviewSize = useCallback(() => {
      const node = webviewRef.current;
      const host = node?.parentElement;
      if (!node || !(host instanceof HTMLElement)) {
        return;
      }
      const nextWidth = Math.max(1, Math.round(host.clientWidth));
      const nextHeight = Math.max(1, Math.round(host.clientHeight));
      setWebviewSize((prev) => {
        if (prev && prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { height: nextHeight, width: nextWidth };
      });
    }, []);

    const assignWebviewRef = useCallback(
      (node: MaiShellWebviewElement | null) => {
        webviewRef.current = node;
        try {
          onRegisterWebview(tabIdRef.current, node);
        } catch (err) {
          console.error("[BrowserTab] error in onRegisterWebview:", err);
        }
      },
      [onRegisterWebview]
    );

    useEffect(() => {
      const node = webviewRef.current;
      if (!node) {
        return;
      }

      const readNavState = () => {
        try {
          return {
            canGoBack: Boolean(node.canGoBack?.()),
            canGoForward: Boolean(node.canGoForward?.()),
          };
        } catch {
          return { canGoBack: false, canGoForward: false };
        }
      };

      const handleStartLoading = () => {
        onLoading(tabIdRef.current, true);
        const fpScript = fingerprintScriptRef.current;
        if (fpScript) {
          void node.executeJavaScript(fpScript, false).catch(() => {
            /* webview might not have a render frame yet on cold start */
          });
        }
        void node
          .executeJavaScript(cursorScriptRef.current, false)
          .catch(() => {
            /* cursor script is decorative, ignore failures */
          });
      };
      const handleStopLoading = () => {
        onLoading(tabIdRef.current, false, safeGetWebviewUrl(node));
      };
      const handleNavigate = (event: Event) => {
        const navEvent = event as BrowserNavEvent;
        if (navEvent.isMainFrame === false) {
          return;
        }
        const url = String(
          navEvent.url ?? safeGetWebviewUrl(node) ?? ""
        ).trim();
        const { canGoBack, canGoForward } = readNavState();
        onNavigate(tabIdRef.current, {
          canGoBack,
          canGoForward,
          currentUrl: url,
        });
      };
      const handleTitleUpdated = (event: Event) => {
        onTitle(
          tabIdRef.current,
          String((event as BrowserTitleEvent).title ?? "").trim()
        );
      };
      const handleDomReady = () => {
        const { canGoBack, canGoForward } = readNavState();
        onNavigate(tabIdRef.current, {
          canGoBack,
          canGoForward,
          currentUrl: safeGetWebviewUrl(node),
        });
        const fpScript = fingerprintScriptRef.current;
        if (fpScript) {
          void node.executeJavaScript(fpScript, false).catch(() => {
            /* ignore */
          });
        }
        void node
          .executeJavaScript(cursorScriptRef.current, false)
          .catch(() => {
            /* cursor script is decorative, ignore failures */
          });
        if (hookEnabledRef.current && hookScriptRef.current) {
          void node
            .executeJavaScript(hookScriptRef.current, false)
            .catch(() => {
              /* ignore */
            });
        }
      };
      const handleFailLoad = (event: Event) => {
        const failEvent = event as BrowserFailEvent;
        if (failEvent.isMainFrame === false || failEvent.errorCode === -3) {
          return;
        }
        const failedUrl = String(
          failEvent.validatedURL ?? safeGetWebviewUrl(node) ?? ""
        ).trim();
        onFailLoad(tabIdRef.current, {
          message: String(
            failEvent.errorDescription ?? t("app.browserLoadFailed")
          ),
          url: failedUrl,
        });
      };

      node.addEventListener("dom-ready", handleDomReady);
      node.addEventListener("did-start-loading", handleStartLoading);
      node.addEventListener("did-stop-loading", handleStopLoading);
      node.addEventListener("did-navigate", handleNavigate);
      node.addEventListener("did-navigate-in-page", handleNavigate);
      node.addEventListener("page-title-updated", handleTitleUpdated);
      node.addEventListener("did-fail-load", handleFailLoad);

      return () => {
        node.removeEventListener("dom-ready", handleDomReady);
        node.removeEventListener("did-start-loading", handleStartLoading);
        node.removeEventListener("did-stop-loading", handleStopLoading);
        node.removeEventListener("did-navigate", handleNavigate);
        node.removeEventListener("did-navigate-in-page", handleNavigate);
        node.removeEventListener("page-title-updated", handleTitleUpdated);
        node.removeEventListener("did-fail-load", handleFailLoad);
      };
    }, [partition, onLoading, onNavigate, onTitle, onFailLoad, t]);

    useEffect(() => {
      if (!hookEnabled) {
        return;
      }
      let cancelled = false;
      const drain = async () => {
        const node = webviewRef.current;
        if (!node || cancelled) {
          return;
        }
        try {
          const events = await node.executeJavaScript<unknown>(
            "(function(){ try { return window.__asyncDrainHooks ? window.__asyncDrainHooks() : []; } catch(_) { return []; } })()",
            false
          );
          if (cancelled) {
            return;
          }
          if (Array.isArray(events) && events.length > 0) {
            onHookEventsRef.current(tabIdRef.current, events as unknown[]);
          }
        } catch {
          /* page may not be ready */
        }
      };
      const interval = window.setInterval(drain, 1500);
      void drain();
      return () => {
        cancelled = true;
        window.clearInterval(interval);
      };
    }, [hookEnabled, tab.id]);

    useEffect(() => {
      if (!hookEnabled) {
        return;
      }
      let cancelled = false;
      const collectScript = `(function(){
			try {
				var url = location && location.href || '';
				var host = '';
				try { host = new URL(url).hostname; } catch(_) {}
				var collect = function(store) {
					var out = [];
					if (!store) return out;
					try {
						for (var i = 0; i < store.length; i++) {
							var key = store.key(i);
							if (!key) continue;
							var value = '';
							try { value = store.getItem(key) || ''; } catch(_) {}
							out.push({ key: key, value: value });
							if (out.length > 200) break;
						}
					} catch(_) {}
					return out;
				};
				return {
					url: url,
					host: host,
					ts: Date.now(),
					cookies: typeof document !== 'undefined' ? (document.cookie || '') : '',
					localStorage: collect(window.localStorage),
					sessionStorage: collect(window.sessionStorage),
				};
			} catch(_) { return null; }
		})()`;
      const collect = async () => {
        const node = webviewRef.current;
        if (!node || cancelled) return;
        try {
          const snapshot = await node.executeJavaScript<unknown>(
            collectScript,
            false
          );
          if (cancelled || !snapshot) return;
          onStorageSnapshotRef.current(tabIdRef.current, snapshot);
        } catch {
          /* page not ready or restricted */
        }
      };
      const interval = window.setInterval(collect, 5000);
      const initial = window.setTimeout(collect, 800);
      return () => {
        cancelled = true;
        window.clearInterval(interval);
        window.clearTimeout(initial);
      };
    }, [hookEnabled, tab.id]);

    useEffect(() => {
      const node = webviewRef.current;
      const host = node?.parentElement;
      if (!node || !(host instanceof HTMLElement)) {
        return;
      }
      syncWebviewSize();
      const frameId = window.requestAnimationFrame(() => {
        syncWebviewSize();
      });
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              syncWebviewSize();
            });
      observer?.observe(host);
      const onWindowResize = () => {
        syncWebviewSize();
      };
      window.addEventListener("resize", onWindowResize);
      return () => {
        window.cancelAnimationFrame(frameId);
        observer?.disconnect();
        window.removeEventListener("resize", onWindowResize);
      };
    }, [active, syncWebviewSize, tab.id]);

    const webviewProps = {
      className: `ref-browser-webview${active ? "" : " is-hidden"}`,
      onLoad: () => console.log("[BrowserTab] webview onLoad event fired"),
      partition,
      ref: assignWebviewRef,
      src: tab.requestedUrl,
      style: webviewSize
        ? { height: `${webviewSize.height}px`, width: `${webviewSize.width}px` }
        : { height: "100%", width: "100%" },
      useragent: userAgent,
    };
    return <webview {...webviewProps} />;
  },
  (prevProps, nextProps) => {
    const comparisons = {
      activeSame: prevProps.active === nextProps.active,
      canGoBackSame: prevProps.tab.canGoBack === nextProps.tab.canGoBack,
      canGoForwardSame:
        prevProps.tab.canGoForward === nextProps.tab.canGoForward,
      currentUrlSame: prevProps.tab.currentUrl === nextProps.tab.currentUrl,
      fingerprintScriptSame:
        prevProps.fingerprintScript === nextProps.fingerprintScript,
      isLoadingSame: prevProps.tab.isLoading === nextProps.tab.isLoading,
      partitionSame: prevProps.partition === nextProps.partition,
      requestedUrlSame:
        prevProps.tab.requestedUrl === nextProps.tab.requestedUrl,
      tabIdSame: prevProps.tab.id === nextProps.tab.id,
      userAgentSame: prevProps.userAgent === nextProps.userAgent,
    };

    return Object.values(comparisons).every(Boolean);
  }
);
