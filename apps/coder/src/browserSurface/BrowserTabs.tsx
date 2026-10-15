import type { TFunction } from "../i18n";
import { IconCloseSmall, IconGlobe, IconPlus } from "../icons";
import type { BrowserTab } from "./BrowserTabView";

export interface BrowserTabsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  t: TFunction;
}

export function BrowserTabs({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onNewTab,
  t,
}: BrowserTabsProps) {
  return (
    <div
      aria-label={t("app.tabBrowser")}
      className="ref-browser-tabstrip"
      role="tablist"
    >
      <div className="ref-browser-tabstrip-scroll">
        {tabs.map((tab) => {
          const tabActive = tab.id === activeTabId;
          const tabLabel =
            (tab.pageTitle && tab.pageTitle.trim()) ||
            (tab.currentUrl
              ? tab.currentUrl.replace(/^https?:\/\//i, "")
              : "") ||
            t("app.browserUntitled");
          return (
            <div
              aria-selected={tabActive}
              className={`ref-browser-tab${tabActive ? " is-active" : ""}`}
              key={tab.id}
              onClick={() => onActivateTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivateTab(tab.id);
                }
              }}
              onMouseDown={(event) => {
                // Middle-click closes tab
                if (event.button === 1) {
                  event.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              role="tab"
              tabIndex={0}
              title={tab.currentUrl || tabLabel}
            >
              <span
                aria-hidden="true"
                className="ref-browser-tab-indicator"
              >
                {tab.isLoading ? (
                  <span className="ref-browser-tab-spinner" />
                ) : (
                  <IconGlobe className="ref-browser-tab-favicon" />
                )}
              </span>
              <span className="ref-browser-tab-label">{tabLabel}</span>
              <button
                aria-label={t("app.browserCloseTab")}
                className="ref-browser-tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title={t("app.browserCloseTab")}
                type="button"
              >
                <IconCloseSmall />
              </button>
            </div>
          );
        })}
      </div>
      <button
        aria-label={t("app.browserNewTab")}
        className="ref-browser-tabstrip-add"
        onClick={onNewTab}
        title={t("app.browserNewTab")}
        type="button"
      >
        <IconPlus />
      </button>
    </div>
  );
}
