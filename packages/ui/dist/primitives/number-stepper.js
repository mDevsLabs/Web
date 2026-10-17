"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function NumberStepper({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }) {
  const id = useId();
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) ? Math.max(lower, max) : 100;
  const current = Number.isFinite(value) ? Math.min(upper, Math.max(lower, value)) : lower;
  const change = (next) => onValueChange(Math.min(upper, Math.max(lower, next)));
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "md-input-group", children: [
      /* @__PURE__ */ jsx("button", { className: "md-button md-button-outline", type: "button", "aria-label": `Diminuer : ${label}`, disabled: disabled || current <= lower, onClick: () => change(current - increment), children: "\u2212" }),
      /* @__PURE__ */ jsx("input", { className: "md-input", id, type: "number", value: current, min: lower, max: upper, step: increment, disabled, onChange: (event) => {
        if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber))
          change(event.target.valueAsNumber);
      } }),
      /* @__PURE__ */ jsx("button", { className: "md-button md-button-outline", type: "button", "aria-label": `Augmenter : ${label}`, disabled: disabled || current >= upper, onClick: () => change(current + increment), children: "+" })
    ] })
  ] });
}
export {
  NumberStepper
};
