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
var password_requirements_exports = {};
__export(password_requirements_exports, {
  PasswordRequirements: () => PasswordRequirements
});
module.exports = __toCommonJS(password_requirements_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function PasswordRequirements({ value, minLength = 12, label = "Conditions du mot de passe", className, ...props }) {
  const id = (0, import_react.useId)();
  const rules = [{ label: `Au moins ${minLength} caract\xE8res`, met: value.length >= minLength }, { label: "Une lettre majuscule", met: /[A-Z]/.test(value) }, { label: "Une lettre minuscule", met: /[a-z]/.test(value) }, { label: "Un chiffre", met: /[0-9]/.test(value) }];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-password-rules", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: rules.map((rule) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { "data-met": rule.met || void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: rule.met ? "\u2713" : "\u25CB" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-sr-only", children: rule.met ? "Respect\xE9 : " : "\xC0 compl\xE9ter : " }),
      rule.label
    ] }, rule.label)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PasswordRequirements
});
