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
var rating_exports = {};
__export(rating_exports, {
  Rating: () => Rating
});
module.exports = __toCommonJS(rating_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Rating({ value, defaultValue = 0, onValueChange, max = 5, label, disabled }) {
  const [current, update] = (0, import_utils.useControllable)(value, defaultValue, onValueChange);
  const id = (0, import_react.useId)();
  const count = Math.max(1, Math.min(10, Math.floor(max)));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { disabled, className: "md-fieldset md-rating", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
    Array.from({ length: count }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { title: `${i + 1} / ${count}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "radio", name: id, value: i + 1, checked: current === i + 1, onChange: () => update(i + 1), "aria-label": `${i + 1} / ${count}` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", "data-filled": current >= i + 1, children: "\u2605" })
    ] }, i))
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Rating
});
