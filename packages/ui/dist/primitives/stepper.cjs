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
var stepper_exports = {};
__export(stepper_exports, {
  Stepper: () => Stepper
});
module.exports = __toCommonJS(stepper_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Stepper({ steps, currentStep, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { ...props, className: (0, import_utils.cx)("md-stepper", className), children: steps.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { "aria-current": i === currentStep ? "step" : void 0, "data-complete": i < currentStep || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: i < currentStep ? "\u2713" : i + 1 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step }),
    i < currentStep && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-sr-only", children: " termin\xE9" })
  ] }, i)) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Stepper
});
