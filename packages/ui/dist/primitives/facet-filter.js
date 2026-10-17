"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function FacetFilter({ label, options, value, onValueChange, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-facet-filter", className), children: /* @__PURE__ */ jsxs("fieldset", { className: "md-form-section", children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    options.map((option) => /* @__PURE__ */ jsxs("label", { className: "md-choice-row", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: option.disabled, checked: value.includes(option.value), onChange: (event) => onValueChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value)) }),
      /* @__PURE__ */ jsx("span", { children: option.label }),
      /* @__PURE__ */ jsx("span", { className: "md-badge", children: option.count })
    ] }, option.value))
  ] }) });
}
export {
  FacetFilter
};
