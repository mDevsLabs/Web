"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function GlassPanel({ title, defaultOpen = true, children, className, ...props }) {
  return /* @__PURE__ */ jsxs("details", { ...props, open: defaultOpen || void 0, className: cx("md-glass md-panel", className), children: [
    /* @__PURE__ */ jsx("summary", { children: title }),
    /* @__PURE__ */ jsx("div", { className: "md-pad-md", children })
  ] });
}
export {
  GlassPanel
};
