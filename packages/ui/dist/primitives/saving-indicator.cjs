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
var saving_indicator_exports = {};
__export(saving_indicator_exports, {
  SavingIndicator: () => SavingIndicator
});
module.exports = __toCommonJS(saving_indicator_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function SavingIndicator({ state, labels, className, ...props }) {
  const text = { idle: "Aucune modification", saving: "Enregistrement en cours\u2026", saved: "Enregistr\xE9", error: "\xC9chec de l\u2019enregistrement" };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { ...props, role: "status", className: (0, import_utils.cx)("md-saving-indicator", className), "data-state": state, children: [
    state === "saving" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", className: "md-spinner" }),
    labels?.[state] ?? text[state]
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SavingIndicator
});
