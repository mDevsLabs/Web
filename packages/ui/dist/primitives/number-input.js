"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const NumberInput = forwardRef(function NumberInput2({ onValueChange, className, ...props }, ref) {
  return /* @__PURE__ */ jsx("input", { ...props, ref, type: "number", className: cx("md-input", className), onChange: (e) => onValueChange?.(e.target.value === "" ? void 0 : e.target.valueAsNumber) });
});
export {
  NumberInput
};
