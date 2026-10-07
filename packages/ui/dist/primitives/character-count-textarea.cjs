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
var character_count_textarea_exports = {};
__export(character_count_textarea_exports, {
  CharacterCountTextarea: () => CharacterCountTextarea
});
module.exports = __toCommonJS(character_count_textarea_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function CharacterCountTextarea({ label, value, onValueChange, maxLength = 500, id: givenId, "aria-describedby": describedBy, className, ...props }) {
  const generated = (0, import_react.useId)();
  const id = givenId ?? generated;
  const counter = `${id}-count`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { ...props, id, value, maxLength, onChange: (event) => onValueChange(event.target.value), "aria-describedby": [describedBy, counter].filter(Boolean).join(" "), className: (0, import_utils.cx)("md-textarea", className) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { id: counter, className: "md-muted", children: [
      value.length,
      " / ",
      maxLength,
      " caract\xE8res"
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CharacterCountTextarea
});
