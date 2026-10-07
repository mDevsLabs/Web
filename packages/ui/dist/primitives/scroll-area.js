"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ScrollArea({ label, maxHeight = "20rem", children, className, style, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, role: "region", "aria-label": label, tabIndex: 0, className: cx("md-scroll-area", className), style: { maxHeight, ...style }, children });
}
export {
  ScrollArea
};
