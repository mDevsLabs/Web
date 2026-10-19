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
var range_slider_exports = {};
__export(range_slider_exports, {
  RangeSlider: () => RangeSlider
});
module.exports = __toCommonJS(range_slider_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function RangeSlider({ label, id, className, ...props }) {
  const generated = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: id ?? generated, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, id: id ?? generated, type: "range", className: (0, import_utils.cx)("md-range", className) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RangeSlider
});
