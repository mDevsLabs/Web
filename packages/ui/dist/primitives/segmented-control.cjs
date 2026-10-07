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
var segmented_control_exports = {};
__export(segmented_control_exports, {
  SegmentedControl: () => SegmentedControl
});
module.exports = __toCommonJS(segmented_control_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function SegmentedControl({ value, onValueChange, options, label }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-fieldset md-segmented", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { className: "md-sr-only", children: label }),
    options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { "data-active": value === o.value, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: id, value: o.value, checked: value === o.value, disabled: o.disabled, onChange: () => onValueChange(o.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: o.label })
    ] }, o.value))
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SegmentedControl
});
