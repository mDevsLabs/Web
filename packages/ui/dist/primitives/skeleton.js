"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Skeleton({ width = "100%", height = "1rem", style, className, ...props }) {
  return /* @__PURE__ */ jsx("span", { ...props, "aria-hidden": "true", className: cx("md-skeleton", className), style: { width, height, ...style } });
}
export {
  Skeleton
};
