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
var theme_exports = {};
__export(theme_exports, {
  PortalScope: () => PortalScope,
  ThemeContext: () => ThemeContext
});
module.exports = __toCommonJS(theme_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
const ThemeContext = (0, import_react.createContext)({ theme: "system", glass: true });
function PortalScope({ children }) {
  const { theme, glass, accent, radius, variables } = (0, import_react.useContext)(ThemeContext);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-root md-portal-scope", "data-md-theme": theme, "data-md-glass": glass ? "on" : "off", style: { ...variables, ...accent ? { "--md-accent": accent } : {}, ...radius ? { "--md-radius": radius } : {} }, children });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PortalScope,
  ThemeContext
});
