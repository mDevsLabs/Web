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
var anchor_navigation_exports = {};
__export(anchor_navigation_exports, {
  AnchorNavigation: () => AnchorNavigation
});
module.exports = __toCommonJS(anchor_navigation_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function AnchorNavigation({ label, items, activeId, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { ...props, "aria-label": label, className: (0, import_utils.cx)("md-anchor-navigation", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `#${encodeURIComponent(item.id)}`, "aria-current": activeId === item.id ? "location" : void 0, children: item.label }) }, item.id)) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnchorNavigation
});
