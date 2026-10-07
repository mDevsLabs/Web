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
var column_visibility_menu_exports = {};
__export(column_visibility_menu_exports, {
  ColumnVisibilityMenu: () => ColumnVisibilityMenu
});
module.exports = __toCommonJS(column_visibility_menu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function ColumnVisibilityMenu({ label, columns, visibleKeys, onVisibilityChange, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-column-menu", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Colonnes visibles" }),
      columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-choice-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: !!column.required || visibleKeys.includes(column.key), disabled: column.required, onChange: (event) => onVisibilityChange(event.target.checked ? [.../* @__PURE__ */ new Set([...visibleKeys, column.key])] : visibleKeys.filter((key) => key !== column.key)) }),
        column.label
      ] }, column.key))
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColumnVisibilityMenu
});
