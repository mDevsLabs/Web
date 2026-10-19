"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const Textarea = forwardRef(function Textarea2({ className, rows = 4, ...props }, ref) {
  return /* @__PURE__ */ jsx("textarea", { ...props, rows, ref, className: cx("md-input md-textarea", className) });
});
export {
  Textarea
};
