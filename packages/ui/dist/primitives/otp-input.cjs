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
var otp_input_exports = {};
__export(otp_input_exports, {
  OtpInput: () => OtpInput
});
module.exports = __toCommonJS(otp_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function OtpInput({ label, value, onValueChange, length = 6, id: givenId, className, ...props }) {
  const generated = (0, import_react.useId)();
  const id = givenId ?? generated;
  const count = Math.min(12, Math.max(1, Math.floor(length) || 6));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: id, children: [
    label,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, id, className: (0, import_utils.cx)("md-input md-otp", className), inputMode: "numeric", autoComplete: "one-time-code", pattern: `[0-9]{${count}}`, maxLength: count, value, onChange: (event) => onValueChange(event.target.value.replace(/[^0-9]/g, "").slice(0, count)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OtpInput
});
