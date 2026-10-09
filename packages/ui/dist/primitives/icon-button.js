"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const IconButton = forwardRef(function IconButton2({ label, className, type = "button", ...props }, ref) {
  return /* @__PURE__ */ jsx("button", { ...props, ref, type, "aria-label": label, className: cx("md-button md-button-ghost md-icon-button", className) });
});
export {
  IconButton
};
