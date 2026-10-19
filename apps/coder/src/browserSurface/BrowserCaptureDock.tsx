import {
  type CSSProperties,
  memo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { IconChevron, IconCloseSmall, IconTrash } from "../icons";
import {
  BrowserCaptureDevicesTab,
  type BrowserCaptureDevicesTabProps,
} from "./BrowserCaptureDevicesTab";
import {
  BrowserCaptureHooksTab,
  type BrowserCaptureHooksTabProps,
} from "./BrowserCaptureHooksTab";
import {
  BrowserCaptureRequestsTab,
  type BrowserCaptureRequestsTabProps,
} from "./BrowserCaptureRequestsTab";
import {
  BrowserCaptureStorageTab,
  type BrowserCaptureStorageTabProps,
} from "./BrowserCaptureStorageTab";
import type {
  BrowserCapturePanelTab,
  BrowserCaptureProxyBusy,
  BrowserCaptureSessionSummaryUi,
} from "./types";

export interface BrowserCaptureDockProps {
  capturePanelExpanded: boolean;
  setCapturePanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  captureIsActive: boolean;
  captureTotalCount: number;
  captureHasAttachError: boolean;
  captureAttachedTabCount: number;
  captureKnownTabCount: number;
  tabsLength: number;
  captureProxyIsRunning: boolean;
  captureBusy: "start" | "stop" | "clear" | null;
  runBrowserCaptureAction: (action: "start" | "stop" | "clear") => Promise<void>;
  captureProxyBusy: BrowserCaptureProxyBusy | null;
  runBrowserCaptureProxyAction: (action: "start" | "stop") => Promise<void>;
  captureSessionsMenuRef: RefObject<HTMLDivElement | null>;
  captureSessionsMenuOpen: boolean;
  setCaptureSessionsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshBrowserCaptureSessions: () => Promise<void>;
  captureSessionsSaveName: string;
  setCaptureSessionsSaveName: (name: string) => void;
  captureSessionsBusy: "save" | "load" | "delete" | null;
  saveBrowserCaptureSession: () => Promise<void>;
  captureSessionsList: BrowserCaptureSessionSummaryUi[];
  loadBrowserCaptureSession: (id: string) => Promise<void>;
  deleteBrowserCaptureSession: (id: string) => Promise<void>;
  handleCaptureDockResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  captureDockBodyStyle: CSSProperties;
  captureError: string | null;
  setCaptureError: (error: string | null) => void;
  captureProxyError: string | null;
  setCaptureProxyError: (error: string | null) => void;
  capturePanelTabs: Array<{ key: BrowserCapturePanelTab; label: string }>;
  capturePanelTab: BrowserCapturePanelTab;
  setCapturePanelTab: (tab: BrowserCapturePanelTab) => void;
  requestsTabProps: BrowserCaptureRequestsTabProps;
  hooksTabProps: BrowserCaptureHooksTabProps;
  storageTabProps: BrowserCaptureStorageTabProps;
  devicesTabProps: BrowserCaptureDevicesTabProps;
  t: (key: string, params?: Record<string, string>) => string;
}

export const BrowserCaptureDock = memo(function BrowserCaptureDock({
  capturePanelExpanded,
  setCapturePanelExpanded,
  captureIsActive,
  captureTotalCount,
  captureHasAttachError,
  captureAttachedTabCount,
  captureKnownTabCount,
  tabsLength,
  captureProxyIsRunning,
  captureBusy,
  runBrowserCaptureAction,
  captureProxyBusy,
  runBrowserCaptureProxyAction,
  captureSessionsMenuRef,
  captureSessionsMenuOpen,
  setCaptureSessionsMenuOpen,
  refreshBrowserCaptureSessions,
  captureSessionsSaveName,
  setCaptureSessionsSaveName,
  captureSessionsBusy,
  saveBrowserCaptureSession,
  captureSessionsList,
  loadBrowserCaptureSession,
  deleteBrowserCaptureSession,
  handleCaptureDockResizePointerDown,
  captureDockBodyStyle,
  captureError,
  setCaptureError,
  captureProxyError,
  setCaptureProxyError,
  capturePanelTabs,
  capturePanelTab,
  setCapturePanelTab,
  requestsTabProps,
  hooksTabProps,
  storageTabProps,
  devicesTabProps,
  t,
}: BrowserCaptureDockProps) {
  return (
    <div
      className={`ref-browser-capture-dock${capturePanelExpanded ? " is-expanded" : " is-collapsed"}${
        captureIsActive ? " is-active" : ""
      }`}
    >
      <div className="ref-browser-capture-dock-summary">
        <button
          aria-expanded={capturePanelExpanded}
          aria-label={
            capturePanelExpanded
              ? t("app.browserCaptureCollapse")
              : t("app.browserCaptureExpand")
          }
          className="ref-browser-capture-dock-toggle"
          onClick={() => setCapturePanelExpanded((expanded) => !expanded)}
          title={
            capturePanelExpanded
              ? t("app.browserCaptureCollapse")
              : t("app.browserCaptureExpand")
          }
          type="button"
        >
          <span aria-hidden="true" className="ref-browser-capture-dot" />
          <span className="ref-browser-capture-dock-title">
            {captureIsActive
              ? t("app.browserCaptureCapturing")
              : t("app.browserCaptureReady")}
          </span>
          <span className="ref-browser-capture-dock-metric">
            {t("app.browserCaptureRequestsShort", {
              count: String(captureTotalCount),
            })}
          </span>
          <span
            className={`ref-browser-capture-dock-metric${captureHasAttachError ? " is-warning" : ""}`}
          >
            {t("app.browserCaptureTabsShort", {
              attached: String(captureAttachedTabCount),
              total: String(captureKnownTabCount || tabsLength),
            })}
          </span>
          <span
            className={`ref-browser-capture-dock-metric${captureProxyIsRunning ? " is-active" : ""}`}
          >
            {captureProxyIsRunning
              ? t("app.browserCaptureProxyShortOn")
              : t("app.browserCaptureProxyShortOff")}
          </span>
          <IconChevron className="ref-browser-capture-dock-chevron" />
        </button>
        <div
          className="ref-browser-capture-dock-quick-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className={`ref-browser-capture-btn${captureIsActive ? " ref-browser-capture-btn--danger" : " ref-browser-capture-btn--primary"}`}
            disabled={Boolean(captureBusy)}
            onClick={() =>
              void runBrowserCaptureAction(captureIsActive ? "stop" : "start")
            }
            title={
              captureIsActive
                ? t("app.browserCaptureStop")
                : t("app.browserCaptureStart")
            }
            type="button"
          >
            {captureBusy === "start"
              ? t("app.browserCaptureStarting")
              : captureBusy === "stop"
                ? t("app.browserCaptureStopping")
                : captureIsActive
                  ? t("app.browserCaptureStop")
                  : t("app.browserCaptureStart")}
          </button>
          <button
            className={`ref-browser-capture-btn ref-browser-capture-btn--ghost${captureProxyIsRunning ? " is-active" : ""}`}
            disabled={Boolean(captureProxyBusy || captureBusy)}
            onClick={() =>
              void runBrowserCaptureProxyAction(
                captureProxyIsRunning ? "stop" : "start"
              )
            }
            title={
              captureProxyIsRunning
                ? t("app.browserCaptureProxyStop")
                : t("app.browserCaptureProxyStart")
            }
            type="button"
          >
            {captureProxyBusy === "start"
              ? t("app.browserCaptureProxyStarting")
              : captureProxyBusy === "stop"
                ? t("app.browserCaptureProxyStopping")
                : captureProxyIsRunning
                  ? t("app.browserCaptureProxyStop")
                  : t("app.browserCaptureProxyStart")}
          </button>
          <button
            className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
            disabled={Boolean(captureBusy) || captureTotalCount <= 0}
            onClick={() => void runBrowserCaptureAction("clear")}
            title={t("app.browserCaptureClear")}
            type="button"
          >
            {captureBusy === "clear"
              ? t("app.browserCaptureClearing")
              : t("app.browserCaptureClear")}
          </button>
          <div
            className="ref-browser-capture-sessions-menu"
            ref={captureSessionsMenuRef}
          >
            <button
              aria-expanded={captureSessionsMenuOpen}
              aria-haspopup="menu"
              className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
              onClick={() => {
                setCaptureSessionsMenuOpen((open) => {
                  const next = !open;
                  if (next) {
                    void refreshBrowserCaptureSessions();
                  }
                  return next;
                });
              }}
              title={t("app.browserCaptureSessionsTitle")}
              type="button"
            >
              {t("app.browserCaptureSessionsLabel")}
            </button>
            {captureSessionsMenuOpen ? (
              <div
                className="ref-browser-capture-sessions-popover"
                role="menu"
              >
                <div className="ref-browser-capture-sessions-popover-head">
                  <input
                    aria-label={t("app.browserCaptureSessionsSavePlaceholder")}
                    className="ref-browser-capture-search"
                    onChange={(event) =>
                      setCaptureSessionsSaveName(event.target.value)
                    }
                    placeholder={t(
                      "app.browserCaptureSessionsSavePlaceholder"
                    )}
                    type="text"
                    value={captureSessionsSaveName}
                  />
                  <button
                    className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--primary"
                    disabled={
                      captureSessionsBusy === "save" || captureTotalCount <= 0
                    }
                    onClick={() => void saveBrowserCaptureSession()}
                    type="button"
                  >
                    {captureSessionsBusy === "save"
                      ? t("app.browserCaptureSendingToAgent")
                      : t("app.browserCaptureSessionsSave")}
                  </button>
                </div>
                <div className="ref-browser-capture-sessions-popover-list">
                  {captureSessionsList.length > 0 ? (
                    captureSessionsList.map((session) => (
                      <div
                        className="ref-browser-capture-sessions-row"
                        key={session.id}
                      >
                        <button
                          className="ref-browser-capture-sessions-row-main"
                          disabled={captureSessionsBusy === "load"}
                          onClick={() =>
                            void loadBrowserCaptureSession(session.id)
                          }
                          title={`${session.name}\n${new Date(session.updatedAt).toLocaleString()}`}
                          type="button"
                        >
                          <span className="ref-browser-capture-sessions-row-name">
                            {session.name}
                          </span>
                          <span className="ref-browser-capture-sessions-row-meta">
                            {t("app.browserCaptureRequestsShort", {
                              count: String(session.requestCount),
                            })}{" "}
                            ·{" "}
                            {new Date(
                              session.updatedAt
                            ).toLocaleDateString()}
                          </span>
                        </button>
                        <button
                          aria-label={t("app.browserCaptureSessionsDelete")}
                          className="ref-browser-copy-icon-btn"
                          onClick={() =>
                            void deleteBrowserCaptureSession(session.id)
                          }
                          title={t("app.browserCaptureSessionsDelete")}
                          type="button"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="ref-browser-capture-inline-empty">
                      {t("app.browserCaptureSessionsEmpty")}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {capturePanelExpanded ? (
        <>
          <div
            aria-orientation="horizontal"
            className="ref-browser-capture-dock-resize"
            onPointerDown={handleCaptureDockResizePointerDown}
            role="separator"
            title={t("app.browserCaptureResizeDock")}
          >
            <span aria-hidden="true" />
          </div>
          <div
            className="ref-browser-capture-dock-body"
            style={captureDockBodyStyle}
          >
            {captureError ? (
              <div
                className="ref-browser-capture-banner ref-browser-capture-banner--error"
                role="alert"
              >
                <span>{captureError}</span>
                <button
                  aria-label={t("common.close")}
                  className="ref-browser-capture-banner-dismiss"
                  onClick={() => setCaptureError(null)}
                  title={t("common.close")}
                  type="button"
                >
                  <IconCloseSmall />
                </button>
              </div>
            ) : null}
            {captureProxyError ? (
              <div
                className="ref-browser-capture-banner ref-browser-capture-banner--error"
                role="alert"
              >
                <span>{captureProxyError}</span>
                <button
                  aria-label={t("common.close")}
                  className="ref-browser-capture-banner-dismiss"
                  onClick={() => setCaptureProxyError(null)}
                  title={t("common.close")}
                  type="button"
                >
                  <IconCloseSmall />
                </button>
              </div>
            ) : null}
            <div
              aria-label={t("app.browserCapturePanel")}
              className="ref-browser-capture-mode-tabs"
              role="tablist"
            >
              {capturePanelTabs.map((tab) => (
                <button
                  aria-selected={capturePanelTab === tab.key}
                  className={`ref-browser-capture-mode-tab${capturePanelTab === tab.key ? " is-active" : ""}`}
                  key={tab.key}
                  onClick={() => setCapturePanelTab(tab.key)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {capturePanelTab === "requests" ? (
              <BrowserCaptureRequestsTab {...requestsTabProps} />
            ) : capturePanelTab === "hooks" ? (
              <BrowserCaptureHooksTab {...hooksTabProps} />
            ) : capturePanelTab === "storage" ? (
              <BrowserCaptureStorageTab {...storageTabProps} />
            ) : (
              <BrowserCaptureDevicesTab {...devicesTabProps} />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
});
