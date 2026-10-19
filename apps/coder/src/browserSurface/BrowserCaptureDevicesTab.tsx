import { memo } from "react";
import { IconCopy } from "../icons";
import type {
  BrowserCapturePanelTab,
  BrowserCaptureProxyBusy,
  BrowserCaptureSourceFilter,
} from "./types";

export interface BrowserCaptureDevicesTabProps {
  captureProxyIsRunning: boolean;
  captureProxyStatusText: string;
  captureProxyBusy: BrowserCaptureProxyBusy | null;
  captureBusy: string | null;
  runBrowserCaptureProxyAction: (action: "start" | "stop") => Promise<void>;
  setCaptureSourceFilter: (filter: BrowserCaptureSourceFilter) => void;
  setCapturePanelTab: (tab: BrowserCapturePanelTab) => void;
  captureProxyPrimaryAddress: string;
  captureProxyPort: number | string;
  captureProxyUrl: string;
  captureProxySystemEnabled: boolean;
  toggleSystemProxy: (enable: boolean) => Promise<void>;
  captureProxyCaInstalled: boolean;
  installBrowserCaptureProxyCa: (uninstall?: boolean) => Promise<void>;
  exportBrowserCaptureProxyCa: () => Promise<void>;
  copiedCaptureField: string | null;
  shell: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  } | null | undefined;
  captureProxyCaUrl: string;
  copyBrowserCaptureProxySnippet: (
    kind: "curl" | "wget" | "python" | "node" | "env"
  ) => Promise<void>;
  copyCaptureText: (label: string, text: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const BrowserCaptureDevicesTab = memo(function BrowserCaptureDevicesTab({
  captureProxyIsRunning,
  captureProxyStatusText,
  captureProxyBusy,
  captureBusy,
  runBrowserCaptureProxyAction,
  setCaptureSourceFilter,
  setCapturePanelTab,
  captureProxyPrimaryAddress,
  captureProxyPort,
  captureProxyUrl,
  captureProxySystemEnabled,
  toggleSystemProxy,
  captureProxyCaInstalled,
  installBrowserCaptureProxyCa,
  exportBrowserCaptureProxyCa,
  copiedCaptureField,
  shell,
  captureProxyCaUrl,
  copyBrowserCaptureProxySnippet,
  copyCaptureText,
  t,
}: BrowserCaptureDevicesTabProps) {
  return (
    <div className="ref-browser-capture-device-panel">
      <div className="ref-browser-capture-device-main">
        <div className="ref-browser-capture-device-head">
          <div className="ref-browser-capture-device-title">
            <span
              className={`ref-browser-capture-device-dot${captureProxyIsRunning ? " is-active" : ""}`}
            />
            <div>
              <strong>{t("app.browserCaptureDeviceTitle")}</strong>
              <span>{captureProxyStatusText}</span>
            </div>
          </div>
          <div className="ref-browser-capture-device-actions">
            <button
              className={`ref-browser-capture-btn${captureProxyIsRunning ? " ref-browser-capture-btn--danger" : " ref-browser-capture-btn--primary"}`}
              disabled={Boolean(captureProxyBusy || captureBusy)}
              onClick={() =>
                void runBrowserCaptureProxyAction(
                  captureProxyIsRunning ? "stop" : "start"
                )
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
              onClick={() => {
                setCaptureSourceFilter("proxy");
                setCapturePanelTab("requests");
              }}
              type="button"
            >
              {t("app.browserCaptureShowProxyRequests")}
            </button>
          </div>
        </div>
        <div className="ref-browser-capture-device-stepgrid">
          <div
            className={`ref-browser-capture-device-card${captureProxyIsRunning ? " is-done" : ""}`}
          >
            <div className="ref-browser-capture-device-card-head">
              <span className="ref-browser-capture-device-card-step">1</span>
              <strong>{t("app.browserCaptureProxyAddress")}</strong>
              <span
                className={`ref-browser-capture-device-badge${captureProxyIsRunning ? " is-on" : ""}`}
              >
                {captureProxyIsRunning
                  ? t("app.browserCaptureProxyShortOn")
                  : t("app.browserCaptureProxyShortOff")}
              </span>
            </div>
            <div className="ref-browser-capture-device-fields">
              <div className="ref-browser-capture-device-field">
                <span>{t("app.browserCaptureProxyHost")}</span>
                <code title={captureProxyPrimaryAddress}>
                  {captureProxyPrimaryAddress}
                </code>
                <button
                  aria-label={t("app.browserCaptureCopyProxyHost")}
                  className="ref-browser-copy-icon-btn"
                  onClick={() =>
                    void copyCaptureText(
                      "proxyHost",
                      captureProxyPrimaryAddress
                    )
                  }
                  title={t("app.browserCaptureCopyProxyHost")}
                  type="button"
                >
                  <IconCopy />
                </button>
              </div>
              <div className="ref-browser-capture-device-field">
                <span>{t("app.browserCaptureProxyPort")}</span>
                <code>{captureProxyPort}</code>
                <button
                  aria-label={t("app.browserCaptureCopyProxyPort")}
                  className="ref-browser-copy-icon-btn"
                  onClick={() =>
                    void copyCaptureText("proxyPort", String(captureProxyPort))
                  }
                  title={t("app.browserCaptureCopyProxyPort")}
                  type="button"
                >
                  <IconCopy />
                </button>
              </div>
              <div className="ref-browser-capture-device-field ref-browser-capture-device-field--wide">
                <span>{t("app.browserCaptureProxyAddress")}</span>
                <code title={captureProxyUrl}>{captureProxyUrl}</code>
                <button
                  aria-label={t("app.browserCaptureCopyProxyAddress")}
                  className="ref-browser-copy-icon-btn"
                  onClick={() =>
                    void copyCaptureText("proxyUrl", captureProxyUrl)
                  }
                  title={t("app.browserCaptureCopyProxyAddress")}
                  type="button"
                >
                  <IconCopy />
                </button>
              </div>
            </div>
            <p className="ref-browser-capture-device-card-hint">
              {t("app.browserCaptureDeviceStepWifi")}
            </p>
          </div>
          <div
            className={`ref-browser-capture-device-card${captureProxySystemEnabled ? " is-done" : ""}`}
          >
            <div className="ref-browser-capture-device-card-head">
              <span className="ref-browser-capture-device-card-step">2</span>
              <strong>{t("app.browserCaptureSystemProxy")}</strong>
              <span
                className={`ref-browser-capture-device-badge${captureProxySystemEnabled ? " is-on" : ""}`}
              >
                {captureProxySystemEnabled
                  ? t("app.browserCaptureSystemProxyOn")
                  : t("app.browserCaptureSystemProxyOff")}
              </span>
            </div>
            <p className="ref-browser-capture-device-card-hint">
              {t("app.browserCaptureSystemProxyHint")}
            </p>
            <div className="ref-browser-capture-device-card-actions">
              <button
                className={`ref-browser-capture-btn${captureProxySystemEnabled ? " ref-browser-capture-btn--ghost is-active" : " ref-browser-capture-btn--primary"}`}
                disabled={
                  !captureProxyIsRunning || Boolean(captureProxyBusy)
                }
                onClick={() =>
                  void toggleSystemProxy(!captureProxySystemEnabled)
                }
                type="button"
              >
                {captureProxyBusy === "refresh"
                  ? t("app.browserCaptureProxyStarting")
                  : captureProxySystemEnabled
                    ? t("app.browserCaptureSystemProxyDisable")
                    : t("app.browserCaptureSystemProxyEnable")}
              </button>
            </div>
          </div>
          <div
            className={`ref-browser-capture-device-card${captureProxyCaInstalled ? " is-done" : ""}`}
          >
            <div className="ref-browser-capture-device-card-head">
              <span className="ref-browser-capture-device-card-step">3</span>
              <strong>{t("app.browserCaptureCaTitle")}</strong>
              <span
                className={`ref-browser-capture-device-badge${captureProxyCaInstalled ? " is-on" : ""}`}
              >
                {captureProxyCaInstalled
                  ? t("app.browserCaptureCaInstalled")
                  : t("app.browserCaptureCaNotInstalled")}
              </span>
            </div>
            <p className="ref-browser-capture-device-card-hint">
              {t("app.browserCaptureCaHint")}
            </p>
            <div className="ref-browser-capture-device-card-actions">
              <button
                className={`ref-browser-capture-btn${captureProxyCaInstalled ? " ref-browser-capture-btn--ghost" : " ref-browser-capture-btn--primary"}`}
                disabled={Boolean(captureProxyBusy)}
                onClick={() =>
                  void installBrowserCaptureProxyCa(captureProxyCaInstalled)
                }
                type="button"
              >
                {captureProxyBusy === "ca"
                  ? t("app.browserCaptureExporting")
                  : captureProxyCaInstalled
                    ? t("app.browserCaptureCaUninstall")
                    : t("app.browserCaptureCaInstall")}
              </button>
              <button
                className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                disabled={captureProxyBusy === "ca"}
                onClick={() => void exportBrowserCaptureProxyCa()}
                type="button"
              >
                {copiedCaptureField === "ca"
                  ? t("app.browserCaptureProxyCaDownloaded")
                  : t("app.browserCaptureProxyDownloadCa")}
              </button>
              <button
                className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                onClick={() => {
                  void shell
                    ?.invoke("browserCapture:proxyOpenCaPath")
                    .catch(() => {
                      /* ignore */
                    });
                }}
                type="button"
              >
                {t("app.browserCaptureCaShowFile")}
              </button>
            </div>
            <div className="ref-browser-capture-device-field ref-browser-capture-device-field--wide">
              <span>{t("app.browserCaptureProxyCaUrl")}</span>
              <code title={captureProxyCaUrl}>{captureProxyCaUrl}</code>
              <button
                aria-label={t("app.browserCaptureCopyProxyCaUrl")}
                className="ref-browser-copy-icon-btn"
                onClick={() =>
                  void copyCaptureText("proxyCaUrl", captureProxyCaUrl)
                }
                title={t("app.browserCaptureCopyProxyCaUrl")}
                type="button"
              >
                <IconCopy />
              </button>
            </div>
          </div>
          <div className="ref-browser-capture-device-card">
            <div className="ref-browser-capture-device-card-head">
              <span className="ref-browser-capture-device-card-step">4</span>
              <strong>{t("app.browserCaptureSnippetsTitle")}</strong>
            </div>
            <p className="ref-browser-capture-device-card-hint">
              {t("app.browserCaptureSnippetsHint")}
            </p>
            <div className="ref-browser-capture-device-card-actions ref-browser-capture-device-card-actions--snippets">
              {(
                ["curl", "wget", "python", "node", "env"] as const
              ).map((kind) => (
                <button
                  className="ref-browser-capture-mini-btn"
                  disabled={!captureProxyIsRunning}
                  key={kind}
                  onClick={() => void copyBrowserCaptureProxySnippet(kind)}
                  type="button"
                >
                  <IconCopy />
                  <span>
                    {copiedCaptureField === `snippet:${kind}`
                      ? t("app.browserCaptureCopied")
                      : kind === "env"
                        ? t("app.browserCaptureSnippetEnv")
                        : kind.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ref-browser-capture-device-note">
          {t("app.browserCaptureDeviceLimit")}
        </div>
      </div>
    </div>
  );
});
