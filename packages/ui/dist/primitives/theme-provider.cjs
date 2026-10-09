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
var theme_provider_exports = {};
__export(theme_provider_exports, {
  ThemeProvider: () => ThemeProvider
});
module.exports = __toCommonJS(theme_provider_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
var import_theme = require("../internal/theme.cjs");
function ThemeProvider({ theme = "system", accent, radius, glass = true, className, style, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_theme.ThemeContext.Provider, { value: { theme, accent, radius, glass, variables: Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => key.startsWith("--"))) }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-root", className), "data-md-theme": theme, "data-md-glass": glass ? "on" : "off", style: { ...style, ...accent ? { "--md-accent": accent } : {}, ...radius ? { "--md-radius": radius } : {} } }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ThemeProvider
});
