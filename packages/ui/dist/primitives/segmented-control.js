"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
function SegmentedControl({ value, onValueChange, options, label }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("fieldset", { className: "md-fieldset md-segmented", children: [
    /* @__PURE__ */ jsx("legend", { className: "md-sr-only", children: label }),
    options.map((o) => /* @__PURE__ */ jsxs("label", { "data-active": value === o.value, children: [
      /* @__PURE__ */ jsx("input", { type: "radio", name: id, value: o.value, checked: value === o.value, disabled: o.disabled, onChange: () => onValueChange(o.value) }),
      /* @__PURE__ */ jsx("span", { children: o.label })
    ] }, o.value))
  ] });
}
export {
  SegmentedControl
};
