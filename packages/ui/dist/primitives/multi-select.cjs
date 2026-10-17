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
var multi_select_exports = {};
__export(multi_select_exports, {
  MultiSelect: () => MultiSelect
});
module.exports = __toCommonJS(multi_select_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function MultiSelect({ label, options, value, onValueChange, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-multi-select", className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { disabled, className: "md-form-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { id, className: "md-muted", children: [
      value.length,
      " choix s\xE9lectionn\xE9(s)"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-choice-list", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", disabled: option.disabled, checked: value.includes(option.value), "aria-describedby": id, onChange: (event) => onValueChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value)) }),
      option.label
    ] }, option.value)) })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MultiSelect
});
