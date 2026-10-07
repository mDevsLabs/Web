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
var circuit_diode_exports = {};
__export(circuit_diode_exports, {
  CircuitDiodeIcon: () => CircuitDiodeIcon
});
module.exports = __toCommonJS(circuit_diode_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitDiodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitDiodeIcon", [["path", { "d": "M22 12h-6" }], ["path", { "d": "M2 12h6" }], ["path", { "d": "M8 7l8 5l-8 5l0 -10" }], ["path", { "d": "M16 7v10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitDiodeIcon
});
