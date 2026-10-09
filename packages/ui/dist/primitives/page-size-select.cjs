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
var page_size_select_exports = {};
__export(page_size_select_exports, {
  PageSizeSelect: () => PageSizeSelect
});
module.exports = __toCommonJS(page_size_select_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function PageSizeSelect({ value, onValueChange, options = [10, 25, 50, 100], label = "Lignes par page", disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const sizes = [...new Set(options)].filter((size) => Number.isInteger(size) && size > 0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-field md-page-size", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { id, className: "md-select", value, disabled, onChange: (event) => onValueChange(Number(event.target.value)), children: sizes.map((size) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: size, children: size }, size)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageSizeSelect
});
