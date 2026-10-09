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
var date_range_input_exports = {};
__export(date_range_input_exports, {
  DateRangeInput: () => DateRangeInput
});
module.exports = __toCommonJS(date_range_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function DateRangeInput({ label, value, onValueChange, min, max, required, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: `${id}-start`, children: [
        "D\xE9but",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${id}-start`, className: "md-input", type: "date", value: value.start, min, max: value.end || max, required, onChange: (event) => onValueChange({ ...value, start: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: `${id}-end`, children: [
        "Fin",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${id}-end`, className: "md-input", type: "date", value: value.end, min: value.start || min, max, required, onChange: (event) => onValueChange({ ...value, end: event.target.value }) })
      ] })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DateRangeInput
});
