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
var choice_cards_exports = {};
__export(choice_cards_exports, {
  ChoiceCards: () => ChoiceCards
});
module.exports = __toCommonJS(choice_cards_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
function ChoiceCards({ label, options, value, onValueChange, disabled, className, ...props }) {
  const name = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ...props, className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "md-form-section", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md-choice-cards", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-choice-card", "data-selected": value === option.value || void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name, value: option.value, checked: value === option.value, disabled: option.disabled, onChange: () => onValueChange(option.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: option.label }),
        option.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-muted", children: option.description })
      ] })
    ] }, option.value)) })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChoiceCards
});
