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
var radio_group_exports = {};
__export(radio_group_exports, {
  RadioGroup: () => RadioGroup
});
module.exports = __toCommonJS(radio_group_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function RadioGroup({ label, name, options, value, defaultValue = "", onValueChange, className, ...props }) {
  const [current, update] = (0, import_utils.useControllable)(value, defaultValue, onValueChange);
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { ...props, className: (0, import_utils.cx)("md-fieldset md-radio-group", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    options.map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-check-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${id}-${i}`, type: "radio", name, value: o.value, checked: current === o.value, disabled: o.disabled, onChange: () => update(o.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: `${id}-${i}`, children: o.label })
    ] }, o.value))
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioGroup
});
