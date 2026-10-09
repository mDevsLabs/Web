"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Grid({ minColumnWidth = "16rem", gap = "1rem", style, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-grid", className), style: { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${typeof minColumnWidth === "number" ? minColumnWidth + "px" : minColumnWidth}), 1fr))`, gap, ...style } });
}
export {
  Grid
};
