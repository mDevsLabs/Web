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
var circuit_bulb_exports = {};
__export(circuit_bulb_exports, {
  CircuitBulbIcon: () => CircuitBulbIcon
});
module.exports = __toCommonJS(circuit_bulb_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitBulbIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitBulbIcon", [["path", { "d": "M2 12h5" }], ["path", { "d": "M17 12h5" }], ["path", { "d": "M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" }], ["path", { "d": "M8.5 8.5l7 7" }], ["path", { "d": "M15.5 8.5l-7 7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitBulbIcon
});
