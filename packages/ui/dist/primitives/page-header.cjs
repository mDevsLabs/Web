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
var page_header_exports = {};
__export(page_header_exports, {
  PageHeader: () => PageHeader
});
module.exports = __toCommonJS(page_header_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function PageHeader({ title, description, breadcrumbs, actions, headingLevel = 1, className, ...props }) {
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { ...props, className: (0, import_utils.cx)("md-page-header", className), children: [
    breadcrumbs,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-page-title", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadingTag, { children: title }),
        description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: description })
      ] }),
      actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-cluster", children: actions })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageHeader
});
