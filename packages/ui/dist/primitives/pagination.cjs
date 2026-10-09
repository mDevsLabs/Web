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
var pagination_exports = {};
__export(pagination_exports, {
  Pagination: () => Pagination
});
module.exports = __toCommonJS(pagination_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Pagination({ page, totalPages, onPageChange, label = "Pagination", className, ...props }) {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.max(1, Math.min(total, page));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { ...props, "aria-label": label, className: (0, import_utils.cx)("md-pagination", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", disabled: current <= 1, onClick: () => onPageChange(current - 1), children: "Pr\xE9c\xE9dent" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { "aria-live": "polite", children: [
      current,
      " / ",
      total
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", disabled: current >= total, onClick: () => onPageChange(current + 1), children: "Suivant" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Pagination
});
