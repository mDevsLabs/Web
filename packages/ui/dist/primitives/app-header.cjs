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
var app_header_exports = {};
__export(app_header_exports, {
  AppHeader: () => AppHeader
});
module.exports = __toCommonJS(app_header_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function AppHeader({ brand, navigation, actions, children, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { ...props, className: (0, import_utils.cx)("md-app-header md-glass", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-app-brand", children: brand }),
    navigation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-app-navigation", children: navigation }),
    actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-cluster", children: actions }),
    children
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppHeader
});
