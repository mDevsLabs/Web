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
var comparison_table_exports = {};
__export(comparison_table_exports, {
  ComparisonTable: () => ComparisonTable
});
module.exports = __toCommonJS(comparison_table_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function ComparisonTable({ caption, columns, features, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "md-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: caption }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: "Fonctionnalit\xE9" }),
      columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: column.label }, column.id))
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: features.map((feature) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "row", children: feature.label }),
      columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: typeof feature.values[column.id] === "boolean" ? feature.values[column.id] ? "Inclus" : "Non inclus" : feature.values[column.id] ?? "\u2014" }, column.id))
    ] }, feature.id)) })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ComparisonTable
});
