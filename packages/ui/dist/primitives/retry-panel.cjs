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
var retry_panel_exports = {};
__export(retry_panel_exports, {
  RetryPanel: () => RetryPanel
});
module.exports = __toCommonJS(retry_panel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function RetryPanel({ message, onRetry, pending = false, retryLabel = "R\xE9essayer", className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-retry-panel md-glass md-pad-md", className), "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button", disabled: pending, onClick: onRetry, children: pending ? "Chargement\u2026" : retryLabel }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { role: "status", className: "md-sr-only", children: pending ? "Nouvelle tentative en cours." : "" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RetryPanel
});
