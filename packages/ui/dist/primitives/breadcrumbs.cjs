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
var breadcrumbs_exports = {};
__export(breadcrumbs_exports, {
  Breadcrumbs: () => Breadcrumbs
});
module.exports = __toCommonJS(breadcrumbs_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Breadcrumbs({ items, label = "Fil d\u2019Ariane", className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { ...props, "aria-label": label, className: (0, import_utils.cx)("md-breadcrumbs", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
    i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "/" }),
    i === items.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-current": "page", children: item.label }) : item.href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: item.href, children: item.label }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })
  ] }, i)) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Breadcrumbs
});
