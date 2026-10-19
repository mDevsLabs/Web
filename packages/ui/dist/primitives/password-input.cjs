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
var password_input_exports = {};
__export(password_input_exports, {
  PasswordInput: () => PasswordInput
});
module.exports = __toCommonJS(password_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
const PasswordInput = (0, import_react.forwardRef)(function PasswordInput2({ showLabel = "Afficher le mot de passe", hideLabel = "Masquer le mot de passe", className, ...props }, ref) {
  const [visible, setVisible] = (0, import_react.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-password", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, ref, type: visible ? "text" : "password", className: (0, import_utils.cx)("md-input", className) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", "aria-label": visible ? hideLabel : showLabel, "aria-pressed": visible, onClick: () => setVisible(!visible), children: visible ? "Masquer" : "Afficher" })
  ] });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PasswordInput
});
