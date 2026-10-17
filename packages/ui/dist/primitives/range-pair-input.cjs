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
var range_pair_input_exports = {};
__export(range_pair_input_exports, {
  RangePairInput: () => RangePairInput
});
module.exports = __toCommonJS(range_pair_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function RangePairInput({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const upper = Math.max(min, max);
  const low = Math.max(min, Math.min(upper, Number.isFinite(value[0]) ? value[0] : min));
  const high = Math.max(low, Math.min(upper, Number.isFinite(value[1]) ? value[1] : upper));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: `${id}-low`, children: [
      "Minimum : ",
      low,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${id}-low`, type: "range", className: "md-range", min, max: high, step: step > 0 ? step : 1, value: low, onChange: (event) => onValueChange([event.target.valueAsNumber, high]) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: `${id}-high`, children: [
      "Maximum : ",
      high,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${id}-high`, type: "range", className: "md-range", min: low, max: upper, step: step > 0 ? step : 1, value: high, onChange: (event) => onValueChange([low, event.target.valueAsNumber]) })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RangePairInput
});
