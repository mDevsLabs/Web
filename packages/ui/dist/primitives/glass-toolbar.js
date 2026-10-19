"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function GlassToolbar({ label, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, role: "group", "aria-label": label, className: cx("md-glass md-toolbar", className) });
}
export {
  GlassToolbar
};
