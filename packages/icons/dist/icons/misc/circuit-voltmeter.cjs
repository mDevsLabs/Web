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
var circuit_voltmeter_exports = {};
__export(circuit_voltmeter_exports, {
  CircuitVoltmeterIcon: () => CircuitVoltmeterIcon
});
module.exports = __toCommonJS(circuit_voltmeter_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitVoltmeterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitVoltmeterIcon", [["path", { "d": "M5 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" }], ["path", { "d": "M5 12h-3" }], ["path", { "d": "M19 12h3" }], ["path", { "d": "M10 10l2 4l2 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitVoltmeterIcon
});
