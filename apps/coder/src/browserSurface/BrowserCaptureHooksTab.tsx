import { memo } from "react";
import { IconCopy, IconListFilter, IconSearch } from "../icons";
import type { BrowserCaptureHookEventUi } from "./types";

export interface BrowserCaptureHooksTabProps {
  captureHookQuery: string;
  setCaptureHookQuery: (query: string) => void;
  captureHookEventTotal: number;
  captureHookCategoryFilter: string;
  setCaptureHookCategoryFilter: (category: string) => void;
  captureHookEvents: BrowserCaptureHookEventUi[];
  captureIsActive: boolean;
  copyCaptureText: (label: string, text: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const BrowserCaptureHooksTab = memo(function BrowserCaptureHooksTab({
  captureHookQuery,
  setCaptureHookQuery,
  captureHookEventTotal,
  captureHookCategoryFilter,
  setCaptureHookCategoryFilter,
  captureHookEvents,
  captureIsActive,
  copyCaptureText,
  t,
}: BrowserCaptureHooksTabProps) {
  return (
    <div className="ref-browser-capture-hooks-panel">
      <div className="ref-browser-capture-list-toolbar">
        <div className="ref-browser-capture-list-toolbar-row">
          <label className="ref-browser-capture-search-wrap">
            <IconSearch className="ref-browser-capture-search-icon" />
            <input
              aria-label={t("app.browserCaptureHookSearchPlaceholder")}
              className="ref-browser-capture-search"
              onChange={(event) => setCaptureHookQuery(event.target.value)}
              placeholder={t("app.browserCaptureHookSearchPlaceholder")}
              type="search"
              value={captureHookQuery}
            />
          </label>
          <span
            className="ref-browser-capture-bulk-status"
            title={t("app.browserCaptureHookCount", {
              count: String(captureHookEventTotal),
            })}
          >
            {t("app.browserCaptureHookCount", {
              count: String(captureHookEventTotal),
            })}
          </span>
        </div>
        <div
          aria-label={t("app.browserCaptureHookCategoryLabel")}
          className="ref-browser-capture-filter-row"
        >
          <div
            aria-label={t("app.browserCaptureHookCategoryLabel")}
            className="ref-browser-capture-filter-strip"
          >
            <span className="ref-browser-capture-filter-label">
              <IconListFilter className="ref-browser-capture-filter-icon" />
              {t("app.browserCaptureHookCategoryLabel")}
            </span>
            {(
              [
                "all",
                "fetch",
                "xhr",
                "crypto.subtle",
                "crypto.lib",
              ] as const
            ).map((key) => (
              <button
                className={`ref-browser-capture-filter-chip${captureHookCategoryFilter === key ? " is-active" : ""}`}
                key={key}
                onClick={() => setCaptureHookCategoryFilter(key)}
                type="button"
              >
                {key === "all" ? t("app.browserCaptureFilterAll") : key}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="ref-browser-capture-hooks-list">
        {captureHookEvents.length > 0 ? (
          captureHookEvents
            .slice()
            .reverse()
            .map((event) => (
              <div
                className="ref-browser-capture-hook-row"
                data-category={event.category}
                key={event.id}
              >
                <div className="ref-browser-capture-hook-row-head">
                  <span className="ref-browser-capture-hook-category">
                    {event.category}
                  </span>
                  <span className="ref-browser-capture-hook-label">
                    {event.label}
                  </span>
                  <span className="ref-browser-capture-hook-time">
                    {new Date(event.ts).toLocaleTimeString()}
                  </span>
                  <button
                    aria-label={t("app.browserCaptureCopied")}
                    className="ref-browser-copy-icon-btn"
                    onClick={() => {
                      const payload = `${event.label}\n${event.url}\nargs: ${event.args}\nresult: ${event.result ?? ""}\n${event.stack}`;
                      void copyCaptureText(`hook:${event.id}`, payload);
                    }}
                    title={t("app.browserCaptureCopied")}
                    type="button"
                  >
                    <IconCopy />
                  </button>
                </div>
                {event.url ? (
                  <div
                    className="ref-browser-capture-hook-url"
                    title={event.url}
                  >
                    {event.url}
                  </div>
                ) : null}
                {event.args ? (
                  <pre className="ref-browser-capture-hook-args">
                    {event.args}
                  </pre>
                ) : null}
                {event.result ? (
                  <pre className="ref-browser-capture-hook-result">
                    → {event.result}
                  </pre>
                ) : null}
                {event.stack ? (
                  <details className="ref-browser-capture-hook-stack">
                    <summary>{t("app.browserCaptureHookStack")}</summary>
                    <pre>{event.stack}</pre>
                  </details>
                ) : null}
              </div>
            ))
        ) : (
          <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
            <div className="ref-browser-capture-empty-title">
              {t("app.browserCaptureHookEmptyTitle")}
            </div>
            <div className="ref-browser-capture-empty-hint">
              {captureIsActive
                ? t("app.browserCaptureHookEmptyHintActive")
                : t("app.browserCaptureHookEmptyHintIdle")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
