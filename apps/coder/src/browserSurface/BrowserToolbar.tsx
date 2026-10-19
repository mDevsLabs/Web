import type React from "react";
import type { TFunction } from "../i18n";
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconGlobe,
  IconRefresh,
  IconStop,
  IconTrash,
} from "../icons";
import type { BrowserTab } from "./BrowserTabView";

export interface BrowserToolbarProps {
  activeTab?: BrowserTab;
  onGoBack: () => void;
  onGoForward: () => void;
  onReloadOrStop: () => void;
  clearDataTitle: string;
  clearDataBusy: boolean;
  clearDataConfirmOpen: boolean;
  clearDataError: string | null;
  onToggleClearDataConfirm: () => void;
  onClearData: () => void;
  onCancelClearData: () => void;
  onAddressSubmit: (event: React.FormEvent) => void;
  onAddressChange: (val: string) => void;
  onAddressKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  t: TFunction;
}

export function BrowserToolbar({
  activeTab,
  onGoBack,
  onGoForward,
  onReloadOrStop,
  clearDataTitle,
  clearDataBusy,
  clearDataConfirmOpen,
  clearDataError,
  onToggleClearDataConfirm,
  onClearData,
  onCancelClearData,
  onAddressSubmit,
  onAddressChange,
  onAddressKeyDown,
  addressInputRef,
  t,
}: BrowserToolbarProps) {
  return (
    <div className="ref-right-toolbar ref-browser-toolbar">
      <div className="ref-browser-toolbar-group ref-browser-toolbar-group--nav">
        <button
          aria-label={t("common.back")}
          className="ref-icon-tile ref-browser-tool-btn"
          disabled={!activeTab?.canGoBack}
          onClick={onGoBack}
          title={t("common.back")}
          type="button"
        >
          <IconArrowLeft />
        </button>
        <button
          aria-label={t("app.browserForward")}
          className="ref-icon-tile ref-browser-tool-btn"
          disabled={!activeTab?.canGoForward}
          onClick={onGoForward}
          title={t("app.browserForward")}
          type="button"
        >
          <IconArrowRight />
        </button>
        <button
          aria-label={
            activeTab?.isLoading
              ? t("app.browserStop")
              : t("common.refresh")
          }
          className="ref-icon-tile ref-browser-tool-btn"
          onClick={onReloadOrStop}
          title={
            activeTab?.isLoading
              ? t("app.browserStop")
              : t("common.refresh")
          }
          type="button"
        >
          {activeTab?.isLoading ? <IconStop /> : <IconRefresh />}
        </button>
        <div className="ref-browser-clear-wrap">
          <button
            aria-label={clearDataTitle}
            className="ref-icon-tile ref-browser-tool-btn"
            disabled={clearDataBusy}
            onClick={onToggleClearDataConfirm}
            title={clearDataTitle}
            type="button"
          >
            <IconTrash />
          </button>
          {clearDataConfirmOpen ? (
            <div
              aria-label={t("app.browserClearData")}
              className="ref-browser-clear-confirm"
              role="dialog"
            >
              <span className="ref-browser-clear-confirm-copy">
                {clearDataError || t("app.browserClearDataConfirm")}
              </span>
              <div className="ref-browser-clear-confirm-actions">
                <button
                  className="ref-browser-mini-btn ref-browser-mini-btn--danger"
                  disabled={clearDataBusy}
                  onClick={onClearData}
                  type="button"
                >
                  {clearDataBusy
                    ? t("app.browserClearingData")
                    : t("app.browserClearDataAction")}
                </button>
                <button
                  className="ref-browser-mini-btn"
                  disabled={clearDataBusy}
                  onClick={onCancelClearData}
                  type="button"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <form
        className="ref-browser-address-form"
        onSubmit={onAddressSubmit}
      >
        <IconGlobe className="ref-browser-address-icon" />
        <input
          autoCapitalize="none"
          autoCorrect="off"
          className="ref-browser-address-input"
          onChange={(event) => onAddressChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={onAddressKeyDown}
          placeholder={t("app.browserAddressPlaceholder")}
          ref={addressInputRef}
          spellCheck={false}
          type="text"
          value={activeTab?.draftUrl ?? ""}
        />
        <button
          aria-label={t("app.browserGo")}
          className="ref-browser-address-go"
          disabled={!String(activeTab?.draftUrl ?? "").trim()}
          title={t("app.browserGo")}
          type="submit"
        >
          <IconArrowUp />
        </button>
      </form>
    </div>
  );
}
