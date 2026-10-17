"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function StatusBadge({ status, labels, className, ...props }) {
  const defaults = { online: "En ligne", offline: "Hors ligne", busy: "Occup\xE9", away: "Absent" };
  return /* @__PURE__ */ jsxs("span", { ...props, className: cx("md-badge", className), "data-tone": status === "online" ? "success" : status === "busy" ? "danger" : "neutral", children: [
    /* @__PURE__ */ jsx("span", { className: "md-status-dot", "aria-hidden": "true" }),
    labels?.[status] ?? defaults[status]
  ] });
}
export {
  StatusBadge
};
