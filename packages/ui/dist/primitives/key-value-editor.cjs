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
var key_value_editor_exports = {};
__export(key_value_editor_exports, {
  KeyValueEditor: () => KeyValueEditor
});
module.exports = __toCommonJS(key_value_editor_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function KeyValueEditor({ label, value, onValueChange, disabled, className, ...props }) {
  const prefix = (0, import_react.useId)();
  const sequence = (0, import_react.useRef)(0);
  const addButton = (0, import_react.useRef)(null);
  const update = (id, key, next) => onValueChange(value.map((row) => row.id === id ? { ...row, [key]: next } : row));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-stack", children: value.map((row, index) => {
      const duplicate = !!row.key.trim() && value.some((other) => other.id !== row.id && other.key.trim() === row.key.trim());
      const errorId = `${prefix}-${index}-error`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-key-value-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", children: [
          "Cl\xE9 ",
          index + 1,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "md-input", value: row.key, "aria-invalid": duplicate || void 0, "aria-describedby": duplicate ? errorId : void 0, onChange: (event) => update(row.id, "key", event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", children: [
          "Valeur ",
          index + 1,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "md-input", value: row.value, onChange: (event) => update(row.id, "value", event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Supprimer la paire ${index + 1}`, onClick: () => {
          onValueChange(value.filter((other) => other.id !== row.id));
          addButton.current?.focus();
        }, children: "Supprimer" }),
        duplicate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: errorId, className: "md-field-error", children: "Cette cl\xE9 est d\xE9j\xE0 utilis\xE9e." })
      ] }, row.id);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: addButton, type: "button", className: "md-button md-button-soft", onClick: () => {
      let id;
      do {
        id = `${prefix}-${sequence.current++}`;
      } while (value.some((row) => row.id === id));
      onValueChange([...value, { id, key: "", value: "" }]);
    }, children: "Ajouter une paire" })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KeyValueEditor
});
