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
var dual_list_selector_exports = {};
__export(dual_list_selector_exports, {
  DualListSelector: () => DualListSelector
});
module.exports = __toCommonJS(dual_list_selector_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function DualListSelector({ label, options, value, onValueChange, disabled, className, ...props }) {
  const id = (0, import_react.useId)();
  const [left, setLeft] = (0, import_react.useState)([]);
  const [right, setRight] = (0, import_react.useState)([]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-transfer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: `${id}-available`, children: [
        "Disponibles",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { id: `${id}-available`, className: "md-select", multiple: true, size: 5, value: left, onChange: (event) => setLeft(Array.from(event.target.selectedOptions, (option) => option.value)), children: options.filter((option) => !value.includes(option.value)).map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.value, children: option.label }, option.value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-stack", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", disabled: !left.length, onClick: () => {
          onValueChange([.../* @__PURE__ */ new Set([...value, ...left])]);
          setLeft([]);
        }, children: "Ajouter \u2192" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", disabled: !right.length, onClick: () => {
          onValueChange(value.filter((item) => !right.includes(item)));
          setRight([]);
        }, children: "\u2190 Retirer" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: `${id}-selected`, children: [
        "S\xE9lectionn\xE9s",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { id: `${id}-selected`, className: "md-select", multiple: true, size: 5, value: right, onChange: (event) => setRight(Array.from(event.target.selectedOptions, (option) => option.value)), children: options.filter((option) => value.includes(option.value)).map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.value, children: option.label }, option.value)) })
      ] })
    ] })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DualListSelector
});
