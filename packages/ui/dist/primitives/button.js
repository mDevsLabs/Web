"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const Button = forwardRef(function Button2({ variant = "solid", size = "md", loading = false, disabled, type = "button", className, children, ...props }, ref) {
  return /* @__PURE__ */ jsxs("button", { ...props, ref, type, disabled: disabled || loading, "aria-busy": loading || void 0, className: cx("md-button", `md-button-${variant}`, `md-button-${size}`, className), children: [
    loading && /* @__PURE__ */ jsx("span", { className: "md-spinner", "aria-hidden": "true" }),
    children
  ] });
});
export {
  Button
};
