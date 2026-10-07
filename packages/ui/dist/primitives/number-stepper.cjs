"use client";
"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var number_stepper_exports = {};
__export(number_stepper_exports, {
  NumberStepper: () => NumberStepper
});
module.exports = __toCommonJS(number_stepper_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function NumberStepper({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) ? Math.max(lower, max) : 100;
  const current = Number.isFinite(value) ? Math.min(upper, Math.max(lower, value)) : lower;
  const change = (next) => onValueChange(Math.min(upper, Math.max(lower, next)));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-field", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-input-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "md-button md-button-outline", type: "button", "aria-label": `Diminuer : ${label}`, disabled: disabled || current <= lower, onClick: () => change(current - increment), children: "\u2212" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "md-input", id, type: "number", value: current, min: lower, max: upper, step: increment, disabled, onChange: (event) => {
        if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber))
          change(event.target.valueAsNumber);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "md-button md-button-outline", type: "button", "aria-label": `Augmenter : ${label}`, disabled: disabled || current >= upper, onClick: () => change(current + increment), children: "+" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NumberStepper
});
