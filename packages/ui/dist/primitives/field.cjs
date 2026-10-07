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
var field_exports = {};
__export(field_exports, {
  Field: () => Field
});
module.exports = __toCommonJS(field_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Field({ label, htmlFor, hint, error, className, children, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-field", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor, children: label }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${htmlFor}-hint`, className: "md-muted", children: hint }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: `${htmlFor}-error`, className: "md-error", role: "alert", children: error })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Field
});
