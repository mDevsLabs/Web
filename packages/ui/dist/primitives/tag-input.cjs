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
var tag_input_exports = {};
__export(tag_input_exports, {
  TagInput: () => TagInput
});
module.exports = __toCommonJS(tag_input_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function TagInput({ value, onValueChange, label, placeholder = "Ajouter une \xE9tiquette" }) {
  const [input, setInput] = (0, import_react.useState)("");
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-tags", children: [
      value.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "md-badge", children: [
        tag,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": `Supprimer ${tag}`, onClick: () => onValueChange(value.filter((t) => t !== tag)), children: "\xD7" })
      ] }, tag)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id, className: "md-input", value: input, placeholder, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          const tag = input.trim();
          if (tag && !value.includes(tag))
            onValueChange([...value, tag]);
          setInput("");
        }
      } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: "Appuyez sur Entr\xE9e pour ajouter." })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TagInput
});
