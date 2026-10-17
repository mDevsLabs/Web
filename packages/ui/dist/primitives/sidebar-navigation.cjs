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
var sidebar_navigation_exports = {};
__export(sidebar_navigation_exports, {
  SidebarNavigation: () => SidebarNavigation
});
module.exports = __toCommonJS(sidebar_navigation_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function SidebarNavigation({ label, sections, currentId, className, ...props }) {
  const prefix = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { ...props, "aria-label": label, className: (0, import_utils.cx)("md-sidebar-navigation", className), children: sections.map((section, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { "aria-labelledby": `${prefix}-${index}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: `${prefix}-${index}`, children: section.label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: section.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: item.href, "aria-current": item.id === currentId ? "page" : void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }),
      item.count !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-badge", children: item.count })
    ] }) }, item.id)) })
  ] }, section.id)) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SidebarNavigation
});
