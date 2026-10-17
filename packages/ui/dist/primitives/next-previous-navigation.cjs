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
var next_previous_navigation_exports = {};
__export(next_previous_navigation_exports, {
  NextPreviousNavigation: () => NextPreviousNavigation
});
module.exports = __toCommonJS(next_previous_navigation_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function NextPreviousNavigation({ previous, next, label = "Documents voisins", className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { ...props, "aria-label": label, className: (0, import_utils.cx)("md-neighbor-navigation", className), children: [
    previous ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: previous.href, rel: "prev", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Pr\xE9c\xE9dent" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: previous.label })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
    next ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: next.href, rel: "next", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Suivant" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: next.label })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NextPreviousNavigation
});
