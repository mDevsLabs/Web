"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const Input = forwardRef(function Input2({ className, ...props }, ref) {
  return /* @__PURE__ */ jsx("input", { ...props, ref, className: cx("md-input", className) });
});
export {
  Input
};
