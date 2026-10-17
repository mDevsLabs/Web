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
var editable_text_exports = {};
__export(editable_text_exports, {
  EditableText: () => EditableText
});
module.exports = __toCommonJS(editable_text_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function EditableText({ label, value, onCommit, disabled, emptyLabel = "Ajouter un texte", className, ...props }) {
  const id = (0, import_react.useId)();
  const button = (0, import_react.useRef)(null);
  const input = (0, import_react.useRef)(null);
  const [editing, setEditing] = (0, import_react.useState)(false);
  const [draft, setDraft] = (0, import_react.useState)(value);
  const wasEditing = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (editing)
      input.current?.focus();
    else if (wasEditing.current)
      button.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  const close = () => setEditing(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className: (0, import_utils.cx)("md-editable-text", className), children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { onSubmit: (event) => {
    event.preventDefault();
    onCommit(draft.trim());
    close();
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: id, children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: input, id, className: "md-input", value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-cluster", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "submit", className: "md-button", children: "Valider" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", onClick: close, children: "Annuler" })
    ] })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: button, className: "md-button md-button-ghost", type: "button", disabled, "aria-label": `Modifier : ${label}`, onClick: () => {
    setDraft(value);
    setEditing(true);
  }, children: value || emptyLabel }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EditableText
});
