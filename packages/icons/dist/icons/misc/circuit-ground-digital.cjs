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
var circuit_ground_digital_exports = {};
__export(circuit_ground_digital_exports, {
  CircuitGroundDigitalIcon: () => CircuitGroundDigitalIcon
});
module.exports = __toCommonJS(circuit_ground_digital_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitGroundDigitalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitGroundDigitalIcon", [["path", { "d": "M12 13v-10" }], ["path", { "d": "M12 21l-6 -8h12l-6 8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitGroundDigitalIcon
});
