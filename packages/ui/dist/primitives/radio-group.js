"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx, useControllable } from "../internal/utils.js";
function RadioGroup({ label, name, options, value, defaultValue = "", onValueChange, className, ...props }) {
  const [current, update] = useControllable(value, defaultValue, onValueChange);
  const id = useId();
  return /* @__PURE__ */ jsxs("fieldset", { ...props, className: cx("md-fieldset md-radio-group", className), children: [
    /* @__PURE__ */ jsx("legend", { children: label }),
    options.map((o, i) => /* @__PURE__ */ jsxs("div", { className: "md-check-row", children: [
      /* @__PURE__ */ jsx("input", { id: `${id}-${i}`, type: "radio", name, value: o.value, checked: current === o.value, disabled: o.disabled, onChange: () => update(o.value) }),
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-${i}`, children: o.label })
    ] }, o.value))
  ] });
}
export {
  RadioGroup
};
