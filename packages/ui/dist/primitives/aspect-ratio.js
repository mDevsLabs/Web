"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function AspectRatio({ ratio = 16 / 9, style, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-aspect", className), style: { aspectRatio: Math.max(0.01, ratio), ...style } });
}
export {
  AspectRatio
};
