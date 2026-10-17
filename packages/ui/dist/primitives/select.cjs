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
var select_exports = {};
__export(select_exports, {
  Select: () => Select
});
module.exports = __toCommonJS(select_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
const Select = (0, import_react.forwardRef)(function Select2({ options, placeholder, className, ...props }, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { ...props, ref, className: (0, import_utils.cx)("md-input md-select", className), children: [
    placeholder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: placeholder }),
    options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value, disabled: o.disabled, children: o.label }, o.value))
  ] });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Select
});
