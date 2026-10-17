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
var expandable_table_exports = {};
__export(expandable_table_exports, {
  ExpandableTable: () => ExpandableTable
});
module.exports = __toCommonJS(expandable_table_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ExpandableTable({ caption, columns, rows, expandedIds, onExpandedChange, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-table-wrap", className), role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "md-table", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", { children: caption }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: "D\xE9tails" }),
      columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", children: column.label }, column.key))
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
      rows.map((row, index) => {
        const expanded = expandedIds.includes(row.id);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", "aria-label": `D\xE9tails de la ligne ${row.id}`, "aria-expanded": expanded, "aria-controls": `${id}-${index}`, onClick: () => onExpandedChange(expanded ? expandedIds.filter((item) => item !== row.id) : [...expandedIds, row.id]), children: expanded ? "\u2212" : "+" }) }),
            columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row[column.key] }, column.key))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { id: `${id}-${index}`, hidden: !expanded, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: columns.length + 1, children: row.details }) })
        ] }, row.id);
      }),
      !rows.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: columns.length + 1, children: "Aucune ligne." }) })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExpandableTable
});
