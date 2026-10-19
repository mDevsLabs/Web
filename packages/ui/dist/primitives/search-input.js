"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cx } from "../internal/utils.js";
const SearchInput = forwardRef(function SearchInput2({ onValueChange, label = "Rechercher", className, ...props }, ref) {
  return /* @__PURE__ */ jsxs("div", { className: "md-search", children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2315" }),
    /* @__PURE__ */ jsx("input", { ...props, ref, type: "search", "aria-label": label, className: cx("md-input", className), onChange: (e) => onValueChange?.(e.target.value) })
  ] });
});
export {
  SearchInput
};
