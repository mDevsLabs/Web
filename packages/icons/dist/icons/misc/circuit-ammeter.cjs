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
var circuit_ammeter_exports = {};
__export(circuit_ammeter_exports, {
  CircuitAmmeterIcon: () => CircuitAmmeterIcon
});
module.exports = __toCommonJS(circuit_ammeter_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitAmmeterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitAmmeterIcon", [["path", { "d": "M5 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" }], ["path", { "d": "M5 12h-3" }], ["path", { "d": "M19 12h3" }], ["path", { "d": "M10 14v-3c0 -1.036 .895 -2 2 -2s2 .964 2 2v3" }], ["path", { "d": "M14 12h-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitAmmeterIcon
});
