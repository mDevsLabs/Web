import type { ReactNode } from "react";
import type { TFunction } from "../i18n";
import { IconCloseSmall, IconDoc } from "../icons";
import type { AgentRightSidebarView } from "./types";

export interface RightSidebarTabsProps {
  t: TFunction;
  hasPlan: boolean;
  openView: (view: AgentRightSidebarView) => void;
  closeSidebar: () => void;
  extraActions?: ReactNode;
}

export function RightSidebarTabs({
  t,
  hasPlan,
  openView,
  closeSidebar,
  extraActions,
}: RightSidebarTabsProps) {
  return (
    <div
      aria-label={t("app.rightSidebarViews")}
      className="ref-right-icon-tabs"
    >
      {hasPlan ? (
        <button
          aria-label={t("app.tabPlan")}
          className="ref-right-icon-tab"
          onClick={() => openView("plan")}
          title={t("app.tabPlan")}
          type="button"
        >
          <IconDoc />
        </button>
      ) : null}
      {extraActions}
      <button
        aria-label={t("common.close")}
        className="ref-right-icon-tab"
        onClick={closeSidebar}
        title={t("common.close")}
        type="button"
      >
        <IconCloseSmall />
      </button>
    </div>
  );
}
