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
var facet_filter_exports = {};
__export(facet_filter_exports, {
  FacetFilter: () => FacetFilter
});
module.exports = __toCommonJS(facet_filter_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function FacetFilter({ label, options, value, onValueChange, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-facet-filter", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-choice-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", disabled: option.disabled, checked: value.includes(option.value), onChange: (event) => onValueChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-badge", children: option.count })
    ] }, option.value))
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FacetFilter
});
