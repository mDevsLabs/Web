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
var field_array_exports = {};
__export(field_array_exports, {
  FieldArray: () => FieldArray
});
module.exports = __toCommonJS(field_array_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function FieldArray({ label, value, onValueChange, maxItems = 20, disabled, className, ...props }) {
  const prefix = (0, import_react.useId)();
  const sequence = (0, import_react.useRef)(0);
  const addButton = (0, import_react.useRef)(null);
  const focusAfterRemoval = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (focusAfterRemoval.current) {
      focusAfterRemoval.current = false;
      addButton.current?.focus();
    }
  }, [value.length]);
  const add = () => {
    let id;
    do {
      id = `${prefix}-${sequence.current++}`;
    } while (value.some((row) => row.id === id));
    onValueChange([...value, { id, value: "" }]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-stack", children: value.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-input-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "md-input", "aria-label": `${label} ${index + 1}`, value: row.value, onChange: (event) => onValueChange(value.map((item) => item.id === row.id ? { ...item, value: event.target.value } : item)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Supprimer ${label} ${index + 1}`, onClick: () => {
        focusAfterRemoval.current = true;
        onValueChange(value.filter((item) => item.id !== row.id));
      }, children: "Supprimer" })
    ] }, row.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: addButton, type: "button", className: "md-button md-button-soft", disabled: value.length >= maxItems, onClick: add, children: "Ajouter" })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FieldArray
});
