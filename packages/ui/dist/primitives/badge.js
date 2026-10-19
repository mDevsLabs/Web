"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Badge({ tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ jsx("span", { ...props, "data-tone": tone, className: cx("md-badge", className) });
}
export {
  Badge
};
