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
var clearable_input_exports = {};
__export(clearable_input_exports, {
  ClearableInput: () => ClearableInput
});
module.exports = __toCommonJS(clearable_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ClearableInput({ label, value, onValueChange, clearLabel = "Effacer", id: givenId, disabled, className, ...props }) {
  const generated = (0, import_react.useId)();
  const id = givenId ?? generated;
  const input = (0, import_react.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-input-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, ref: input, id, disabled, value, onChange: (event) => onValueChange(event.target.value), className: (0, import_utils.cx)("md-input", className) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", disabled: disabled || !value, "aria-label": clearLabel, onClick: () => {
        onValueChange("");
        input.current?.focus();
      }, children: "\xD7" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClearableInput
});
