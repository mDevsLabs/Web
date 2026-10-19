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
var selectable_table_exports = {};
__export(selectable_table_exports, {
  SelectableTable: () => SelectableTable
});
module.exports = __toCommonJS(selectable_table_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function SelectableTable({ caption, columns, rows, selectedIds, onSelectionChange, className, ...props }) {
  const all = (0, import_react.useRef)(null);
  const count = rows.filter((row) => selectedIds.includes(row.id)).length;
  (0, import_react.useEffect)(() => {
    if (all.current)
      all.current.indeterminate = count > 0 && count < rows.length;
  }, [count, rows.length]);
  const selectPage = (checked) => onSelectionChange(checked ? [.../* @__PURE__ */ new Set([...selectedIds, ...rows.map((row) => row.id)])] : selectedIds.filter((id) => !rows.some((row) => row.id === id)));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-table-wrap", className), tabIndex: 0, role: "region", "aria-label": caption, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "md-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: caption }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: all, type: "checkbox", "aria-label": "S\xE9lectionner les lignes de cette page", disabled: !rows.length, checked: !!rows.length && count === rows.length, onChange: (event) => selectPage(event.target.checked) }) }),
      columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: column.label }, column.key))
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
      rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { "data-selected": selectedIds.includes(row.id) || void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", "aria-label": `S\xE9lectionner la ligne ${row.id}`, checked: selectedIds.includes(row.id), onChange: (event) => onSelectionChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter((id) => id !== row.id)) }) }),
        columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row[column.key] }, column.key))
      ] }, row.id)),
      !rows.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: columns.length + 1, children: "Aucune ligne." }) })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SelectableTable
});
