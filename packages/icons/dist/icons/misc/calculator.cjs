"use client";
"use strict";
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
var calculator_exports = {};
__export(calculator_exports, {
  CalculatorIcon: () => CalculatorIcon
});
module.exports = __toCommonJS(calculator_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalculatorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalculatorIcon", [["rect", { "width": "16", "height": "20", "x": "4", "y": "2", "rx": "2" }], ["line", { "x1": "8", "x2": "16", "y1": "6", "y2": "6" }], ["line", { "x1": "16", "x2": "16", "y1": "14", "y2": "18" }], ["path", { "d": "M16 10h.01" }], ["path", { "d": "M12 10h.01" }], ["path", { "d": "M8 10h.01" }], ["path", { "d": "M12 14h.01" }], ["path", { "d": "M8 14h.01" }], ["path", { "d": "M12 18h.01" }], ["path", { "d": "M8 18h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalculatorIcon
});
