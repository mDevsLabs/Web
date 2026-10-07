"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Stack({ gap = "1rem", align, style, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-stack", className), style: { gap, alignItems: align, ...style } });
}
export {
  Stack
};
