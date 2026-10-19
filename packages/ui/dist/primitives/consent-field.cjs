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
var consent_field_exports = {};
__export(consent_field_exports, {
  ConsentField: () => ConsentField
});
module.exports = __toCommonJS(consent_field_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ConsentField({ label, checked, onCheckedChange, children, required = true, disabled, name, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-consent-field", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: id, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id, type: "checkbox", name, required, disabled, checked, "aria-describedby": children ? `${id}-terms` : void 0, onChange: (event) => onCheckedChange(event.target.checked) }),
      label,
      required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: " *" })
    ] }),
    children && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: `${id}-terms`, className: "md-muted", children })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConsentField
});
