"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function MultiSelect({ label, options, value, onValueChange, disabled, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-multi-select", className), children: /* @__PURE__ */ jsxs("fieldset", { disabled, className: "md-form-section", children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    /* @__PURE__ */ jsxs("p", { id, className: "md-muted", children: [
      value.length,
      " choix s\xE9lectionn\xE9(s)"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "md-choice-list", children: options.map((option) => /* @__PURE__ */ jsxs("label", { children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: option.disabled, checked: value.includes(option.value), "aria-describedby": id, onChange: (event) => onValueChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value)) }),
      option.label
    ] }, option.value)) })
  ] }) });
}
export {
  MultiSelect
};
