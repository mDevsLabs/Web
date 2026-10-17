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
var form_error_summary_exports = {};
__export(form_error_summary_exports, {
  FormErrorSummary: () => FormErrorSummary
});
module.exports = __toCommonJS(form_error_summary_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function FormErrorSummary({ errors, heading = "Corrigez les champs suivants", className, ...props }) {
  const id = (0, import_react.useId)();
  if (!errors.length)
    return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, role: "alert", "aria-labelledby": id, className: (0, import_utils.cx)("md-error-summary", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { id, children: heading }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: errors.map((error, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `#${error.fieldId}`, children: error.message }) }, `${error.fieldId}-${index}`)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormErrorSummary
});
