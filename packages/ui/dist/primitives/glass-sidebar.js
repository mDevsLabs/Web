"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function GlassSidebar({ label, className, ...props }) {
  return /* @__PURE__ */ jsx("aside", { ...props, "aria-label": label, className: cx("md-glass md-sidebar", className) });
}
export {
  GlassSidebar
};
