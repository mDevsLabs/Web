"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef } from "react";
import { cx } from "../internal/utils.js";
function ClearableInput({ label, value, onValueChange, clearLabel = "Effacer", id: givenId, disabled, className, ...props }) {
  const generated = useId();
  const id = givenId ?? generated;
  const input = useRef(null);
  return /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "md-input-group", children: [
      /* @__PURE__ */ jsx("input", { ...props, ref: input, id, disabled, value, onChange: (event) => onValueChange(event.target.value), className: cx("md-input", className) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", disabled: disabled || !value, "aria-label": clearLabel, onClick: () => {
        onValueChange("");
        input.current?.focus();
      }, children: "\xD7" })
    ] })
  ] });
}
export {
  ClearableInput
};
