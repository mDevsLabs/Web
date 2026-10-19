"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Cluster({ gap = ".75rem", justify, style, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-cluster", className), style: { gap, justifyContent: justify, ...style } });
}
export {
  Cluster
};
