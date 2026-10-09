"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const GlassSurface = forwardRef(function GlassSurface2({ padding = "md", className, ...props }, ref) {
  return /* @__PURE__ */ jsx("div", { ...props, ref, className: cx("md-glass", `md-pad-${padding}`, className) });
});
export {
  GlassSurface
};
