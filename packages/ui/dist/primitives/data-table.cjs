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
var data_table_exports = {};
__export(data_table_exports, {
  DataTable: () => DataTable
});
module.exports = __toCommonJS(data_table_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function DataTable({ columns, rows, getRowKey, caption, emptyMessage = "Aucun r\xE9sultat.", className }) {
  const [sort, setSort] = (0, import_react.useState)(null);
  const ordered = (0, import_react.useMemo)(() => sort ? [...rows].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    const n = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), void 0, { numeric: true });
    return sort.asc ? n : -n;
  }) : rows, [rows, sort]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: (0, import_utils.cx)("md-table-scroll", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "md-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: caption }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", "aria-sort": sort?.key === c.key ? sort.asc ? "ascending" : "descending" : void 0, children: c.sortable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "md-sort", onClick: () => setSort({ key: c.key, asc: sort?.key === c.key ? !sort.asc : true }), children: [
      c.label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: " \u2195" })
    ] }) : c.label }, c.key)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ordered.length ? ordered.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "\u2014") }, c.key)) }, getRowKey(row))) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: columns.length, children: emptyMessage }) }) })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DataTable
});
