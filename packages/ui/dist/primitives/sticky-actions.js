"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function StickyActions({ label, position = "bottom", children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-sticky-actions md-glass", className), "data-position": position, role: "group", "aria-label": label, children });
}
export {
  StickyActions
};
