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
var editable_table_exports = {};
__export(editable_table_exports, {
  EditableTable: () => EditableTable
});
module.exports = __toCommonJS(editable_table_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function EditableTable({ caption, columns, value, onValueChange, disabled, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "md-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: caption }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: column.label }, column.key)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
      value.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "md-input", "aria-label": `${column.label}, ligne ${row.id}`, disabled: disabled || column.key === "id", value: row[column.key] ?? "", onChange: (event) => {
        if (column.key !== "id")
          onValueChange(value.map((item) => item.id === row.id ? { ...item, [column.key]: event.target.value } : item));
      } }) }, column.key)) }, row.id)),
      !value.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: Math.max(1, columns.length), children: "Aucune ligne." }) })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EditableTable
});
