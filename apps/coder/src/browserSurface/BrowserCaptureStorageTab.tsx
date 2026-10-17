import { memo } from "react";
import { IconCopy } from "../icons";
import type { BrowserCaptureStorageSnapshotUi } from "./types";

export interface BrowserCaptureStorageTabProps {
  captureStorageSnapshots: BrowserCaptureStorageSnapshotUi[];
  captureStorageActiveHost: string | null;
  setCaptureStorageActiveHost: (host: string) => void;
  captureIsActive: boolean;
  copyCaptureText: (label: string, text: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const BrowserCaptureStorageTab = memo(function BrowserCaptureStorageTab({
  captureStorageSnapshots,
  captureStorageActiveHost,
  setCaptureStorageActiveHost,
  captureIsActive,
  copyCaptureText,
  t,
}: BrowserCaptureStorageTabProps) {
  return (
    <div className="ref-browser-capture-storage-panel">
      <div
        className="ref-browser-capture-storage-host-list"
        role="tablist"
      >
        {captureStorageSnapshots.length > 0 ? (
          captureStorageSnapshots.map((snapshot) => (
            <button
              aria-selected={captureStorageActiveHost === snapshot.host}
              className={`ref-browser-capture-storage-host${captureStorageActiveHost === snapshot.host ? " is-active" : ""}`}
              key={snapshot.id}
              onClick={() => setCaptureStorageActiveHost(snapshot.host)}
              role="tab"
              type="button"
            >
              <span className="ref-browser-capture-storage-host-name">
                {snapshot.host}
              </span>
              <span className="ref-browser-capture-storage-host-meta">
                {snapshot.cookies
                  ? `${snapshot.cookies.split(";").filter(Boolean).length}c`
                  : "0c"}
                {" · "}
                {snapshot.localStorage.length}L ·{" "}
                {snapshot.sessionStorage.length}S
              </span>
            </button>
          ))
        ) : (
          <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
            <div className="ref-browser-capture-empty-title">
              {t("app.browserCaptureStorageEmptyTitle")}
            </div>
            <div className="ref-browser-capture-empty-hint">
              {captureIsActive
                ? t("app.browserCaptureStorageEmptyHintActive")
                : t("app.browserCaptureStorageEmptyHintIdle")}
            </div>
          </div>
        )}
      </div>
      <div className="ref-browser-capture-storage-detail">
        {(() => {
          const active =
            captureStorageSnapshots.find(
              (s) => s.host === captureStorageActiveHost
            ) ?? captureStorageSnapshots[0];
          if (!active) {
            return (
              <div className="ref-browser-capture-empty">
                {t("app.browserCaptureStorageSelect")}
              </div>
            );
          }
          return (
            <>
              <div className="ref-browser-capture-storage-section">
                <div className="ref-browser-capture-section-head">
                  <div className="ref-browser-capture-section-title">
                    {t("app.browserCaptureStorageCookies")}
                  </div>
                  <button
                    aria-label={t("app.browserCaptureCopied")}
                    className="ref-browser-copy-icon-btn"
                    onClick={() =>
                      void copyCaptureText(
                        `storage:cookies:${active.host}`,
                        active.cookies
                      )
                    }
                    title={t("app.browserCaptureCopied")}
                    type="button"
                  >
                    <IconCopy />
                  </button>
                </div>
                {active.cookies ? (
                  <pre className="ref-browser-capture-body-block">
                    {active.cookies}
                  </pre>
                ) : (
                  <div className="ref-browser-capture-inline-empty">
                    {t("app.browserCaptureEmptyBody")}
                  </div>
                )}
              </div>
              <div className="ref-browser-capture-storage-section">
                <div className="ref-browser-capture-section-head">
                  <div className="ref-browser-capture-section-title">
                    localStorage ({active.localStorage.length})
                  </div>
                  <button
                    aria-label={t("app.browserCaptureCopied")}
                    className="ref-browser-copy-icon-btn"
                    onClick={() =>
                      void copyCaptureText(
                        `storage:local:${active.host}`,
                        JSON.stringify(active.localStorage, null, 2)
                      )
                    }
                    title={t("app.browserCaptureCopied")}
                    type="button"
                  >
                    <IconCopy />
                  </button>
                </div>
                {active.localStorage.length > 0 ? (
                  <div className="ref-browser-capture-kv-list">
                    {active.localStorage.map((entry) => (
                      <div
                        className="ref-browser-capture-kv"
                        key={`local-${entry.key}`}
                      >
                        <span>{entry.key}</span>
                        <code>{entry.value}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ref-browser-capture-inline-empty">
                    {t("app.browserCaptureEmptyBody")}
                  </div>
                )}
              </div>
              <div className="ref-browser-capture-storage-section">
                <div className="ref-browser-capture-section-head">
                  <div className="ref-browser-capture-section-title">
                    sessionStorage ({active.sessionStorage.length})
                  </div>
                  <button
                    aria-label={t("app.browserCaptureCopied")}
                    className="ref-browser-copy-icon-btn"
                    onClick={() =>
                      void copyCaptureText(
                        `storage:session:${active.host}`,
                        JSON.stringify(active.sessionStorage, null, 2)
                      )
                    }
                    title={t("app.browserCaptureCopied")}
                    type="button"
                  >
                    <IconCopy />
                  </button>
                </div>
                {active.sessionStorage.length > 0 ? (
                  <div className="ref-browser-capture-kv-list">
                    {active.sessionStorage.map((entry) => (
                      <div
                        className="ref-browser-capture-kv"
                        key={`session-${entry.key}`}
                      >
                        <span>{entry.key}</span>
                        <code>{entry.value}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ref-browser-capture-inline-empty">
                    {t("app.browserCaptureEmptyBody")}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
});
