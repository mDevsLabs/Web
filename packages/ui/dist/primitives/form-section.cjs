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
var form_section_exports = {};
__export(form_section_exports, {
  FormSection: () => FormSection
});
module.exports = __toCommonJS(form_section_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function FormSection({ legend, hint, children, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { ...props, className: (0, import_utils.cx)("md-form-section", className), "aria-describedby": hint ? id : void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: legend }),
    hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id, className: "md-muted", children: hint }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-stack", children })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormSection
});
