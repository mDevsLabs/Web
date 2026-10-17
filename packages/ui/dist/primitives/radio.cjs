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
var radio_exports = {};
__export(radio_exports, {
  Radio: () => Radio
});
module.exports = __toCommonJS(radio_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Radio({ label, className, id, ...props }) {
  const generated = (0, import_react.useId)();
  const inputId = id ?? generated;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-check-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, id: inputId, type: "radio", className: (0, import_utils.cx)("md-radio", className) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: inputId, children: label })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Radio
});
