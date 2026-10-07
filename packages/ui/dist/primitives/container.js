"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Container({ maxWidth = "80rem", className, style, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-container", className), style: { maxWidth, ...style } });
}
export {
  Container
};
