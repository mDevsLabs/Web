"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function VisuallyHidden({ className, ...props }) {
  return /* @__PURE__ */ jsx("span", { ...props, className: cx("md-sr-only", className) });
}
export {
  VisuallyHidden
};
