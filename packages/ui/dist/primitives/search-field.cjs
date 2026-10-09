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
var search_field_exports = {};
__export(search_field_exports, {
  SearchField: () => SearchField
});
module.exports = __toCommonJS(search_field_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function SearchField({ label, value, onValueChange, onSearch, pending = false, placeholder = "Rechercher\u2026", className, ...props }) {
  const id = (0, import_react.useId)();
  const input = (0, import_react.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", { role: "search", "aria-label": label, onSubmit: (event) => {
    event.preventDefault();
    if (!pending)
      onSearch(value.trim());
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: id, children: [
    label,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "md-input-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: input, id, className: "md-input", type: "search", value, placeholder, disabled: pending, onChange: (event) => onValueChange(event.target.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "submit", className: "md-button", disabled: pending, children: "Rechercher" }),
      value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", disabled: pending, "aria-label": "Effacer la recherche", onClick: () => {
        onValueChange("");
        input.current?.focus();
      }, children: "Effacer" })
    ] })
  ] }) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SearchField
});
