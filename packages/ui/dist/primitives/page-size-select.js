"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function PageSizeSelect({ value, onValueChange, options = [10, 25, 50, 100], label = "Lignes par page", disabled, className, ...props }) {
  const id = useId();
  const sizes = [...new Set(options)].filter((size) => Number.isInteger(size) && size > 0);
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field md-page-size", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx("select", { id, className: "md-select", value, disabled, onChange: (event) => onValueChange(Number(event.target.value)), children: sizes.map((size) => /* @__PURE__ */ jsx("option", { value: size, children: size }, size)) })
  ] });
}
export {
  PageSizeSelect
};
