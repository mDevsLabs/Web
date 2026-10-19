import {
  memo,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import {
  IconArrowUpRight,
  IconCopy,
  IconDownload,
  IconListFilter,
  IconSearch,
  IconTrash,
} from "../icons";
import {
  browserCaptureBuildCurl,
  browserCaptureFormatDuration,
  browserCaptureFormatHeaders,
  browserCaptureUrlHost,
  browserCaptureUrlPath,
} from "./captureUtils";
import type {
  BrowserCaptureAnalysisRecordUi,
  BrowserCaptureDetailTab,
  BrowserCaptureExportAction,
  BrowserCaptureMethodFilter,
  BrowserCaptureProxyBusy,
  BrowserCaptureRequestDetailUi,
  BrowserCaptureRequestSummaryUi,
  BrowserCaptureResourceFilter,
  BrowserCaptureSourceFilter,
  BrowserCaptureStatusFilter,
} from "./types";

export interface BrowserCaptureRequestsTabProps {
  captureDetailVisible: boolean;
  setCaptureDetailVisible: React.Dispatch<React.SetStateAction<boolean>>;
  captureQuery: string;
  setCaptureQuery: (query: string) => void;
  captureExportError: string | null;
  captureBulkStatusText: string;
  captureAnalyzeMenuRef: RefObject<HTMLDivElement | null>;
  captureAnalyzeMenuOpen: boolean;
  setCaptureAnalyzeMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  captureBulkActionsDisabled: boolean;
  shell: { invoke: (channel: string, ...args: any[]) => Promise<any> } | null | undefined;
  captureAnalyzeBusy: boolean;
  copiedCaptureField: string | null;
  analyzeBrowserCapture: (
    mode:
      | "auto"
      | "api-reverse"
      | "security-audit"
      | "performance"
      | "crypto-reverse"
  ) => Promise<void>;
  sendBrowserCaptureToAgentDraft: () => Promise<void>;
  captureRecentAnalyses: BrowserCaptureAnalysisRecordUi[];
  openCaptureAnalysisThread: (
    entry: BrowserCaptureAnalysisRecordUi
  ) => Promise<void>;
  removeCaptureAnalysisRecord: (id: string) => Promise<void>;
  copyBrowserCaptureCurl: () => Promise<void>;
  captureExportBusy: BrowserCaptureExportAction | null;
  captureExportMenuRef: RefObject<HTMLDivElement | null>;
  captureExportMenuOpen: boolean;
  setCaptureExportMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  exportBrowserCaptureRequests: (format: "json" | "har") => Promise<void>;
  captureStatusFilters: Array<{
    key: BrowserCaptureStatusFilter;
    label: string;
  }>;
  captureStatusFilter: BrowserCaptureStatusFilter;
  setCaptureStatusFilter: (filter: BrowserCaptureStatusFilter) => void;
  captureMethodFilters: Array<{
    key: BrowserCaptureMethodFilter;
    label: string;
  }>;
  captureMethodFilter: BrowserCaptureMethodFilter;
  setCaptureMethodFilter: (filter: BrowserCaptureMethodFilter) => void;
  captureSourceFilters: Array<{
    key: BrowserCaptureSourceFilter;
    label: string;
  }>;
  captureSourceFilter: BrowserCaptureSourceFilter;
  setCaptureSourceFilter: (filter: BrowserCaptureSourceFilter) => void;
  captureResourceFilters: Array<{
    key: BrowserCaptureResourceFilter;
    label: string;
  }>;
  captureResourceFilter: BrowserCaptureResourceFilter;
  setCaptureResourceFilter: (filter: BrowserCaptureResourceFilter) => void;
  captureListCaption: string;
  captureSelectAllChecked: boolean;
  captureRequests: BrowserCaptureRequestSummaryUi[];
  toggleVisibleCaptureRequestsSelected: () => void;
  captureSelectAllRef: RefObject<HTMLInputElement | null>;
  selectedCaptureRequestId: string | null;
  selectedCaptureRequestIds: Set<string>;
  setSelectedCaptureRequestId: (id: string) => void;
  handleCaptureRowKeyDown: (
    event: ReactKeyboardEvent<HTMLDivElement>,
    id: string
  ) => void;
  toggleCaptureRequestSelected: (id: string, selected: boolean) => void;
  captureCanLoadMore: boolean;
  captureListBusy: boolean;
  refreshBrowserCaptureRequests: (mode: "replace" | "append") => Promise<void>;
  captureRemainingRequestCount: number;
  captureIsActive: boolean;
  captureBusy: string | null;
  runBrowserCaptureAction: (action: "start" | "stop") => Promise<void>;
  captureProxyIsRunning: boolean;
  captureProxyBusy: BrowserCaptureProxyBusy | null;
  runBrowserCaptureProxyAction: (action: "start" | "stop") => Promise<void>;
  selectedCaptureView:
    | BrowserCaptureRequestDetailUi
    | BrowserCaptureRequestSummaryUi
    | null;
  selectedCaptureRequest: BrowserCaptureRequestDetailUi | null;
  selectedCaptureBusy: boolean;
  captureDetailTabs: Array<{ key: BrowserCaptureDetailTab; label: string }>;
  captureDetailTab: BrowserCaptureDetailTab;
  setCaptureDetailTab: (tab: BrowserCaptureDetailTab) => void;
  selectedRequestHeaderEntries: Array<[string, string]>;
  selectedResponseHeaderEntries: Array<[string, string]>;
  selectedRequestBodyText: string;
  selectedResponseBodyText: string;
  selectedResponseOmissionText: string;
  copyCaptureText: (label: string, text: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const BrowserCaptureRequestsTab = memo(
  function BrowserCaptureRequestsTab({
    captureDetailVisible,
    setCaptureDetailVisible,
    captureQuery,
    setCaptureQuery,
    captureExportError,
    captureBulkStatusText,
    captureAnalyzeMenuRef,
    captureAnalyzeMenuOpen,
    setCaptureAnalyzeMenuOpen,
    captureBulkActionsDisabled,
    shell,
    captureAnalyzeBusy,
    copiedCaptureField,
    analyzeBrowserCapture,
    sendBrowserCaptureToAgentDraft,
    captureRecentAnalyses,
    openCaptureAnalysisThread,
    removeCaptureAnalysisRecord,
    copyBrowserCaptureCurl,
    captureExportBusy,
    captureExportMenuRef,
    captureExportMenuOpen,
    setCaptureExportMenuOpen,
    exportBrowserCaptureRequests,
    captureStatusFilters,
    captureStatusFilter,
    setCaptureStatusFilter,
    captureMethodFilters,
    captureMethodFilter,
    setCaptureMethodFilter,
    captureSourceFilters,
    captureSourceFilter,
    setCaptureSourceFilter,
    captureResourceFilters,
    captureResourceFilter,
    setCaptureResourceFilter,
    captureListCaption,
    captureSelectAllChecked,
    captureRequests,
    toggleVisibleCaptureRequestsSelected,
    captureSelectAllRef,
    selectedCaptureRequestId,
    selectedCaptureRequestIds,
    setSelectedCaptureRequestId,
    handleCaptureRowKeyDown,
    toggleCaptureRequestSelected,
    captureCanLoadMore,
    captureListBusy,
    refreshBrowserCaptureRequests,
    captureRemainingRequestCount,
    captureIsActive,
    captureBusy,
    runBrowserCaptureAction,
    captureProxyIsRunning,
    captureProxyBusy,
    runBrowserCaptureProxyAction,
    selectedCaptureView,
    selectedCaptureRequest,
    selectedCaptureBusy,
    captureDetailTabs,
    captureDetailTab,
    setCaptureDetailTab,
    selectedRequestHeaderEntries,
    selectedResponseHeaderEntries,
    selectedRequestBodyText,
    selectedResponseBodyText,
    selectedResponseOmissionText,
    copyCaptureText,
    t,
  }: BrowserCaptureRequestsTabProps) {
    return (
      <div
        className={`ref-browser-capture-network${captureDetailVisible ? "" : " is-detail-collapsed"}`}
      >
        <div className="ref-browser-capture-list">
          <div className="ref-browser-capture-list-toolbar">
            <div className="ref-browser-capture-list-toolbar-row">
              <label className="ref-browser-capture-search-wrap">
                <IconSearch className="ref-browser-capture-search-icon" />
                <input
                  aria-label={t("app.browserCaptureSearchPlaceholder")}
                  className="ref-browser-capture-search"
                  onChange={(event) => setCaptureQuery(event.target.value)}
                  placeholder={t("app.browserCaptureSearchPlaceholder")}
                  type="search"
                  value={captureQuery}
                />
              </label>
              <div className="ref-browser-capture-bulk-actions">
                <span
                  className={`ref-browser-capture-bulk-status${captureExportError ? " has-error" : ""}`}
                  title={captureBulkStatusText}
                >
                  {captureBulkStatusText}
                </span>
                <div
                  className="ref-browser-capture-analyze-menu"
                  ref={captureAnalyzeMenuRef}
                >
                  <button
                    aria-expanded={captureAnalyzeMenuOpen}
                    aria-haspopup="menu"
                    className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--primary"
                    disabled={
                      captureBulkActionsDisabled || !shell || captureAnalyzeBusy
                    }
                    onClick={() => setCaptureAnalyzeMenuOpen((open) => !open)}
                    title={t("app.browserCaptureAnalyzeLabel")}
                    type="button"
                  >
                    <IconArrowUpRight />
                    <span>
                      {captureAnalyzeBusy
                        ? t("app.browserCaptureAnalyzing")
                        : copiedCaptureField?.startsWith("analyze:")
                          ? t("app.browserCaptureSentToAgent")
                          : t("app.browserCaptureAnalyzeLabel")}
                    </span>
                  </button>
                  {captureAnalyzeMenuOpen ? (
                    <div
                      className="ref-browser-capture-analyze-popover"
                      role="menu"
                    >
                      <div className="ref-browser-capture-analyze-popover-head">
                        {t("app.browserCaptureAnalyzeHeading")}
                      </div>
                      {(
                        [
                          [
                            "auto",
                            "app.browserCaptureAnalyzeAuto",
                            "app.browserCaptureAnalyzeAutoHint",
                          ],
                          [
                            "api-reverse",
                            "app.browserCaptureAnalyzeApi",
                            "app.browserCaptureAnalyzeApiHint",
                          ],
                          [
                            "security-audit",
                            "app.browserCaptureAnalyzeSecurity",
                            "app.browserCaptureAnalyzeSecurityHint",
                          ],
                          [
                            "performance",
                            "app.browserCaptureAnalyzePerf",
                            "app.browserCaptureAnalyzePerfHint",
                          ],
                          [
                            "crypto-reverse",
                            "app.browserCaptureAnalyzeCrypto",
                            "app.browserCaptureAnalyzeCryptoHint",
                          ],
                        ] as const
                      ).map(([key, labelKey, hintKey]) => (
                        <button
                          disabled={captureAnalyzeBusy}
                          key={key}
                          onClick={() => void analyzeBrowserCapture(key)}
                          role="menuitem"
                          type="button"
                        >
                          <strong>{t(labelKey)}</strong>
                          <span>{t(hintKey)}</span>
                        </button>
                      ))}
                      <div className="ref-browser-capture-analyze-popover-divider" />
                      <button
                        disabled={captureBulkActionsDisabled || !shell}
                        onClick={() => {
                          setCaptureAnalyzeMenuOpen(false);
                          void sendBrowserCaptureToAgentDraft();
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <strong>{t("app.browserCaptureSendToAgent")}</strong>
                        <span>{t("app.browserCaptureSendToAgentHint")}</span>
                      </button>
                      {captureRecentAnalyses.length > 0 ? (
                        <>
                          <div className="ref-browser-capture-analyze-popover-divider" />
                          <div className="ref-browser-capture-analyze-popover-head">
                            {t("app.browserCaptureRecentAnalyses")}
                          </div>
                          <div className="ref-browser-capture-analyze-recents">
                            {captureRecentAnalyses.map((entry) => (
                              <div
                                className="ref-browser-capture-analyze-recent"
                                key={entry.id}
                              >
                                <button
                                  className="ref-browser-capture-analyze-recent-main"
                                  onClick={() => {
                                    setCaptureAnalyzeMenuOpen(false);
                                    void openCaptureAnalysisThread(entry);
                                  }}
                                  title={`${entry.title}\n${new Date(entry.createdAt).toLocaleString()}`}
                                  type="button"
                                >
                                  <strong>{entry.title}</strong>
                                  <span>
                                    {entry.mode} ·{" "}
                                    {new Date(
                                      entry.createdAt
                                    ).toLocaleTimeString()}
                                  </span>
                                </button>
                                <button
                                  aria-label={t(
                                    "app.browserCaptureSessionsDelete"
                                  )}
                                  className="ref-browser-copy-icon-btn"
                                  onClick={() =>
                                    void removeCaptureAnalysisRecord(entry.id)
                                  }
                                  title={t("app.browserCaptureSessionsDelete")}
                                  type="button"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <button
                  aria-label={t("app.browserCaptureCopyCurl")}
                  className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--icon"
                  disabled={captureBulkActionsDisabled}
                  onClick={() => void copyBrowserCaptureCurl()}
                  title={
                    copiedCaptureField === "curl"
                      ? t("app.browserCaptureCopied")
                      : captureExportBusy === "curl"
                        ? t("app.browserCaptureExporting")
                        : t("app.browserCaptureCopyCurl")
                  }
                  type="button"
                >
                  <IconCopy />
                </button>
                <div
                  className="ref-browser-capture-export-menu"
                  ref={captureExportMenuRef}
                >
                  <button
                    aria-expanded={captureExportMenuOpen}
                    aria-haspopup="menu"
                    className="ref-browser-capture-mini-btn ref-browser-capture-mini-btn--icon"
                    disabled={captureBulkActionsDisabled}
                    onClick={() => setCaptureExportMenuOpen((open) => !open)}
                    title={t("app.browserCaptureExportMenuLabel")}
                    type="button"
                  >
                    <IconDownload />
                  </button>
                  {captureExportMenuOpen ? (
                    <div
                      className="ref-browser-capture-export-popover"
                      role="menu"
                    >
                      <button
                        disabled={captureBulkActionsDisabled}
                        onClick={() => {
                          setCaptureExportMenuOpen(false);
                          void exportBrowserCaptureRequests("json");
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {captureExportBusy === "json"
                          ? t("app.browserCaptureExporting")
                          : t("app.browserCaptureExportJson")}
                      </button>
                      <button
                        disabled={captureBulkActionsDisabled}
                        onClick={() => {
                          setCaptureExportMenuOpen(false);
                          void exportBrowserCaptureRequests("har");
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {captureExportBusy === "har"
                          ? t("app.browserCaptureExporting")
                          : t("app.browserCaptureExportHar")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div
              aria-label={t("app.browserCaptureFilterLabel")}
              className="ref-browser-capture-filter-row"
            >
              <div
                aria-label={t("app.browserCaptureStatusFilterLabel")}
                className="ref-browser-capture-filter-strip"
              >
                <span className="ref-browser-capture-filter-label">
                  <IconListFilter className="ref-browser-capture-filter-icon" />
                  {t("app.browserCaptureStatus")}
                </span>
                {captureStatusFilters.map((filter) => (
                  <button
                    className={`ref-browser-capture-filter-chip${
                      captureStatusFilter === filter.key ? " is-active" : ""
                    }`}
                    key={filter.key}
                    onClick={() => setCaptureStatusFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div
                aria-label={t("app.browserCaptureMethodFilterLabel")}
                className="ref-browser-capture-filter-strip"
              >
                <span className="ref-browser-capture-filter-label">
                  {t("app.browserCaptureColumnMethod")}
                </span>
                {captureMethodFilters.map((filter) => (
                  <button
                    className={`ref-browser-capture-filter-chip${
                      captureMethodFilter === filter.key ? " is-active" : ""
                    }`}
                    key={filter.key}
                    onClick={() => setCaptureMethodFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div
                aria-label={t("app.browserCaptureSourceFilterLabel")}
                className="ref-browser-capture-filter-strip"
              >
                <span className="ref-browser-capture-filter-label">
                  {t("app.browserCaptureColumnSource")}
                </span>
                {captureSourceFilters.map((filter) => (
                  <button
                    className={`ref-browser-capture-filter-chip${
                      captureSourceFilter === filter.key ? " is-active" : ""
                    }`}
                    key={filter.key}
                    onClick={() => setCaptureSourceFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div
                aria-label={t("app.browserCaptureResourceFilterLabel")}
                className="ref-browser-capture-filter-strip"
              >
                <span className="ref-browser-capture-filter-label">
                  {t("app.browserCaptureResourceType")}
                </span>
                {captureResourceFilters.map((filter) => (
                  <button
                    className={`ref-browser-capture-filter-chip${
                      captureResourceFilter === filter.key ? " is-active" : ""
                    }`}
                    key={filter.key}
                    onClick={() => setCaptureResourceFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <span
                className="ref-browser-capture-list-count"
                title={captureListCaption}
              >
                {captureListCaption}
              </span>
              <button
                aria-pressed={captureDetailVisible}
                className={`ref-browser-capture-detail-toggle${captureDetailVisible ? " is-active" : ""}`}
                onClick={() => setCaptureDetailVisible((v) => !v)}
                title={
                  captureDetailVisible
                    ? t("app.browserCaptureHideDetail")
                    : t("app.browserCaptureShowDetail")
                }
                type="button"
              >
                {captureDetailVisible
                  ? t("app.browserCaptureHideDetail")
                  : t("app.browserCaptureShowDetail")}
              </button>
            </div>
          </div>
          <div
            aria-label={t("app.browserCaptureRequests")}
            className="ref-browser-capture-table"
            role="table"
          >
            <div
              className="ref-browser-capture-table-head"
              role="row"
            >
              <label
                className="ref-browser-capture-check-cell"
                title={t("app.browserCaptureToggleVisible")}
              >
                <input
                  aria-label={t("app.browserCaptureToggleVisible")}
                  checked={captureSelectAllChecked}
                  disabled={captureRequests.length <= 0}
                  onChange={toggleVisibleCaptureRequestsSelected}
                  ref={captureSelectAllRef}
                  type="checkbox"
                />
              </label>
              <span>{t("app.browserCaptureColumnSeq")}</span>
              <span>{t("app.browserCaptureColumnSource")}</span>
              <span>{t("app.browserCaptureColumnMethod")}</span>
              <span>{t("app.browserCaptureColumnStatus")}</span>
              <span>{t("app.browserCaptureColumnHost")}</span>
              <span>{t("app.browserCaptureColumnPath")}</span>
              <span>{t("app.browserCaptureColumnTime")}</span>
            </div>
            <div className="ref-browser-capture-table-body">
              {captureRequests.length > 0 ? (
                <>
                  {captureRequests.map((request) => {
                    const activeRequest =
                      request.id === selectedCaptureRequestId;
                    const checkedRequest = selectedCaptureRequestIds.has(
                      request.id
                    );
                    return (
                      <div
                        className={`ref-browser-capture-row${activeRequest ? " is-selected" : ""}${
                          request.errorText ? " has-error" : ""
                        }${checkedRequest ? " is-checked" : ""}`}
                        key={request.id}
                        onClick={() => setSelectedCaptureRequestId(request.id)}
                        onKeyDown={(event) =>
                          handleCaptureRowKeyDown(event, request.id)
                        }
                        role="row"
                        tabIndex={0}
                      >
                        <label
                          className="ref-browser-capture-check-cell"
                          onClick={(event) => event.stopPropagation()}
                          title={t("app.browserCaptureToggleRequest")}
                        >
                          <input
                            aria-label={t("app.browserCaptureToggleRequest")}
                            checked={checkedRequest}
                            onChange={(event) =>
                              toggleCaptureRequestSelected(
                                request.id,
                                event.currentTarget.checked
                              )
                            }
                            type="checkbox"
                          />
                        </label>
                        <span className="ref-browser-capture-cell ref-browser-capture-seq">
                          #{request.seq}
                        </span>
                        <span
                          className={`ref-browser-capture-source ref-browser-capture-source--${request.source}`}
                          title={
                            request.source === "proxy"
                              ? t("app.browserCaptureSourceProxy")
                              : t("app.browserCaptureSourceBrowser")
                          }
                        >
                          {request.source === "proxy"
                            ? t("app.browserCaptureSourceProxyShort")
                            : t("app.browserCaptureSourceBrowserShort")}
                        </span>
                        <span
                          className="ref-browser-capture-method"
                          data-method={request.method}
                        >
                          {request.method}
                        </span>
                        <span
                          className="ref-browser-capture-status"
                          data-status={
                            request.status == null
                              ? "pending"
                              : String(Math.floor(request.status / 100))
                          }
                        >
                          {request.status ?? "--"}
                        </span>
                        <span
                          className="ref-browser-capture-host"
                          title={browserCaptureUrlHost(request.url)}
                        >
                          {browserCaptureUrlHost(request.url) || "--"}
                        </span>
                        <span
                          className="ref-browser-capture-path"
                          title={request.url}
                        >
                          {browserCaptureUrlPath(request.url)}
                        </span>
                        <span className="ref-browser-capture-time">
                          {browserCaptureFormatDuration(request.durationMs)}
                        </span>
                      </div>
                    );
                  })}
                  {captureCanLoadMore ? (
                    <div className="ref-browser-capture-load-more">
                      <button
                        className="ref-browser-capture-load-more-btn"
                        disabled={captureListBusy}
                        onClick={() =>
                          void refreshBrowserCaptureRequests("append")
                        }
                        type="button"
                      >
                        <span>
                          {captureListBusy
                            ? t("app.browserCaptureLoadingRequests")
                            : t("app.browserCaptureLoadMore")}
                        </span>
                        <span className="ref-browser-capture-load-more-count">
                          {t("app.browserCaptureRemainingCount", {
                            count: String(captureRemainingRequestCount),
                          })}
                        </span>
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="ref-browser-capture-empty ref-browser-capture-empty--list">
                  {captureListBusy ? (
                    <span>{t("app.browserCaptureLoadingRequests")}</span>
                  ) : (
                    <>
                      <div className="ref-browser-capture-empty-title">
                        {t("app.browserCaptureNoRequests")}
                      </div>
                      <div className="ref-browser-capture-empty-hint">
                        {captureIsActive
                          ? t("app.browserCaptureEmptyHintActive")
                          : t("app.browserCaptureEmptyHintIdle")}
                      </div>
                      <div className="ref-browser-capture-empty-actions">
                        {captureIsActive ? null : (
                          <button
                            className="ref-browser-capture-btn ref-browser-capture-btn--primary"
                            disabled={Boolean(captureBusy)}
                            onClick={() => void runBrowserCaptureAction("start")}
                            type="button"
                          >
                            {captureBusy === "start"
                              ? t("app.browserCaptureStarting")
                              : t("app.browserCaptureStart")}
                          </button>
                        )}
                        {captureProxyIsRunning ? null : (
                          <button
                            className="ref-browser-capture-btn ref-browser-capture-btn--ghost"
                            disabled={Boolean(captureProxyBusy)}
                            onClick={() =>
                              void runBrowserCaptureProxyAction("start")
                            }
                            type="button"
                          >
                            {captureProxyBusy === "start"
                              ? t("app.browserCaptureProxyStarting")
                              : t("app.browserCaptureProxyStart")}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {captureDetailVisible ? (
          <div className="ref-browser-capture-detail">
            {selectedCaptureView ? (
              <>
                <div className="ref-browser-capture-detail-head">
                  <div className="ref-browser-capture-detail-meta">
                    <span
                      className="ref-browser-capture-method"
                      data-method={selectedCaptureView.method}
                    >
                      {selectedCaptureView.method}
                    </span>
                    <span
                      className="ref-browser-capture-status"
                      data-status={
                        selectedCaptureView.status == null
                          ? "pending"
                          : String(
                              Math.floor(selectedCaptureView.status / 100)
                            )
                      }
                    >
                      {selectedCaptureView.status ?? "--"}
                    </span>
                    <span className="ref-browser-capture-detail-time">
                      {browserCaptureFormatDuration(
                        selectedCaptureView.durationMs
                      )}
                    </span>
                  </div>
                  <div className="ref-browser-capture-detail-actions">
                    <button
                      className="ref-browser-copy-btn"
                      disabled={!selectedCaptureRequest}
                      onClick={() => {
                        if (selectedCaptureRequest) {
                          void copyCaptureText(
                            "curl",
                            browserCaptureBuildCurl(selectedCaptureRequest)
                          );
                        }
                      }}
                      type="button"
                    >
                      <IconCopy />
                      <span>
                        {copiedCaptureField === "curl"
                          ? t("app.browserCaptureCopied")
                          : t("app.browserCaptureCopyCurl")}
                      </span>
                    </button>
                    <button
                      className="ref-browser-copy-btn"
                      disabled={!selectedCaptureView.url}
                      onClick={() =>
                        void copyCaptureText("url", selectedCaptureView.url)
                      }
                      type="button"
                    >
                      <IconCopy />
                      <span>
                        {copiedCaptureField === "url"
                          ? t("app.browserCaptureCopied")
                          : t("app.browserCaptureCopyUrl")}
                      </span>
                    </button>
                  </div>
                </div>
                <div
                  className="ref-browser-capture-detail-url"
                  title={selectedCaptureView.url}
                >
                  {selectedCaptureView.url}
                </div>
                {selectedCaptureBusy ? (
                  <div className="ref-browser-capture-empty">
                    {t("app.browserCaptureLoadingRequest")}
                  </div>
                ) : selectedCaptureRequest ? (
                  <>
                    <div
                      className="ref-browser-capture-detail-tabs"
                      role="tablist"
                    >
                      {captureDetailTabs.map((tab) => (
                        <button
                          aria-selected={captureDetailTab === tab.key}
                          className={`ref-browser-capture-detail-tab${
                            captureDetailTab === tab.key ? " is-active" : ""
                          }`}
                          key={tab.key}
                          onClick={() => setCaptureDetailTab(tab.key)}
                          role="tab"
                          type="button"
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="ref-browser-capture-detail-scroll">
                      {captureDetailTab === "headers" ? (
                        <>
                          <div className="ref-browser-capture-detail-section">
                            <div className="ref-browser-capture-section-head">
                              <div className="ref-browser-capture-section-title">
                                {t("app.browserCaptureRequestHeaders")}
                              </div>
                              <button
                                aria-label={t(
                                  "app.browserCaptureCopyRequestHeaders"
                                )}
                                className="ref-browser-copy-icon-btn"
                                disabled={
                                  selectedRequestHeaderEntries.length <= 0
                                }
                                onClick={() =>
                                  void copyCaptureText(
                                    "requestHeaders",
                                    browserCaptureFormatHeaders(
                                      selectedCaptureRequest.requestHeaders
                                    )
                                  )
                                }
                                title={t(
                                  "app.browserCaptureCopyRequestHeaders"
                                )}
                                type="button"
                              >
                                <IconCopy />
                              </button>
                            </div>
                            <div className="ref-browser-capture-kv-list">
                              {selectedRequestHeaderEntries.length > 0 ? (
                                selectedRequestHeaderEntries.map(
                                  ([key, value]) => (
                                    <div
                                      className="ref-browser-capture-kv"
                                      key={`req-${key}`}
                                    >
                                      <span>{key}</span>
                                      <code>{value}</code>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="ref-browser-capture-inline-empty">
                                  {t("app.browserCaptureEmptyBody")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ref-browser-capture-detail-section">
                            <div className="ref-browser-capture-section-head">
                              <div className="ref-browser-capture-section-title">
                                {t("app.browserCaptureResponseHeaders")}
                              </div>
                              <button
                                aria-label={t(
                                  "app.browserCaptureCopyResponseHeaders"
                                )}
                                className="ref-browser-copy-icon-btn"
                                disabled={
                                  selectedResponseHeaderEntries.length <= 0
                                }
                                onClick={() =>
                                  void copyCaptureText(
                                    "responseHeaders",
                                    browserCaptureFormatHeaders(
                                      selectedCaptureRequest.responseHeaders
                                    )
                                  )
                                }
                                title={t(
                                  "app.browserCaptureCopyResponseHeaders"
                                )}
                                type="button"
                              >
                                <IconCopy />
                              </button>
                            </div>
                            <div className="ref-browser-capture-kv-list">
                              {selectedResponseHeaderEntries.length > 0 ? (
                                selectedResponseHeaderEntries.map(
                                  ([key, value]) => (
                                    <div
                                      className="ref-browser-capture-kv"
                                      key={`res-${key}`}
                                    >
                                      <span>{key}</span>
                                      <code>{value}</code>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="ref-browser-capture-inline-empty">
                                  {t("app.browserCaptureEmptyBody")}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : captureDetailTab === "request" ? (
                        <div className="ref-browser-capture-detail-section">
                          <div className="ref-browser-capture-section-head">
                            <div className="ref-browser-capture-section-title">
                              {t("app.browserCaptureRequestBody")}
                            </div>
                            <button
                              aria-label={t(
                                "app.browserCaptureCopyRequestBody"
                              )}
                              className="ref-browser-copy-icon-btn"
                              disabled={!selectedRequestBodyText}
                              onClick={() =>
                                void copyCaptureText(
                                  "requestBody",
                                  selectedRequestBodyText
                                )
                              }
                              title={t("app.browserCaptureCopyRequestBody")}
                              type="button"
                            >
                              <IconCopy />
                            </button>
                          </div>
                          <pre className="ref-browser-capture-body-block ref-browser-capture-body-block--large">
                            {selectedRequestBodyText ||
                              t("app.browserCaptureEmptyBody")}
                          </pre>
                          {selectedCaptureRequest.requestBodyTruncated ? (
                            <div className="ref-browser-capture-note">
                              {t("app.browserCaptureBodyTruncated")}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="ref-browser-capture-detail-section">
                          <div className="ref-browser-capture-meta-grid">
                            <span>{t("app.browserCaptureColumnSource")}</span>
                            <strong>
                              {selectedCaptureRequest.source === "proxy"
                                ? t("app.browserCaptureSourceProxy")
                                : t("app.browserCaptureSourceBrowser")}
                            </strong>
                            <span>{t("app.browserCaptureColumnStatus")}</span>
                            <strong>
                              {selectedCaptureRequest.status ?? "--"}
                            </strong>
                            <span>{t("app.browserCaptureContentType")}</span>
                            <strong>
                              {selectedCaptureRequest.contentType ?? "--"}
                            </strong>
                            <span>{t("app.browserCaptureResourceType")}</span>
                            <strong>
                              {selectedCaptureRequest.resourceType ?? "--"}
                            </strong>
                          </div>
                          <div className="ref-browser-capture-section-head">
                            <div className="ref-browser-capture-section-title">
                              {t("app.browserCaptureResponseBody")}
                            </div>
                            <button
                              aria-label={t(
                                "app.browserCaptureCopyResponseBody"
                              )}
                              className="ref-browser-copy-icon-btn"
                              disabled={!selectedResponseBodyText}
                              onClick={() =>
                                void copyCaptureText(
                                  "responseBody",
                                  selectedResponseBodyText
                                )
                              }
                              title={t("app.browserCaptureCopyResponseBody")}
                              type="button"
                            >
                              <IconCopy />
                            </button>
                          </div>
                          <pre className="ref-browser-capture-body-block ref-browser-capture-body-block--large">
                            {selectedResponseBodyText ||
                              selectedResponseOmissionText ||
                              t("app.browserCaptureEmptyBody")}
                          </pre>
                          {selectedCaptureRequest.responseBodyTruncated ? (
                            <div className="ref-browser-capture-note">
                              {t("app.browserCaptureBodyTruncated")}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="ref-browser-capture-empty">
                    {t("app.browserCaptureRequestNotFound")}
                  </div>
                )}
              </>
            ) : (
              <div className="ref-browser-capture-empty">
                {t("app.browserCaptureSelectRequest")}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }
);
