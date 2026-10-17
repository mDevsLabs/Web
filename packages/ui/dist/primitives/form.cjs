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
var form_exports = {};
__export(form_exports, {
  Form: () => Form
});
module.exports = __toCommonJS(form_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Form({ onValuesSubmit, onSubmit, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", { ...props, className: (0, import_utils.cx)("md-form-grid", className), onSubmit: (e) => {
    onSubmit?.(e);
    if (!e.defaultPrevented && onValuesSubmit) {
      e.preventDefault();
      onValuesSubmit(new FormData(e.currentTarget));
    }
  } });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Form
});
