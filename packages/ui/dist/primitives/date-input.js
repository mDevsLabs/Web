"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const DateInput = forwardRef(function DateInput2({ className, ...props }, ref) {
  return /* @__PURE__ */ jsx("input", { ...props, ref, type: "date", className: cx("md-input", className) });
});
export {
  DateInput
};
