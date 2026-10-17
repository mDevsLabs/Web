"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Separator({ orientation = "horizontal", decorative = true, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, role: decorative ? "none" : "separator", "aria-orientation": decorative ? void 0 : orientation, className: cx("md-separator", className), "data-orientation": orientation });
}
export {
  Separator
};
