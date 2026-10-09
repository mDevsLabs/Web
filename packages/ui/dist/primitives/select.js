"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const Select = forwardRef(function Select2({ options, placeholder, className, ...props }, ref) {
  return /* @__PURE__ */ jsxs("select", { ...props, ref, className: cx("md-input md-select", className), children: [
    placeholder && /* @__PURE__ */ jsx("option", { value: "", children: placeholder }),
    options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, disabled: o.disabled, children: o.label }, o.value))
  ] });
});
export {
  Select
};
