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
var truck_electric_exports = {};
__export(truck_electric_exports, {
  TruckElectricIcon: () => TruckElectricIcon
});
module.exports = __toCommonJS(truck_electric_exports);
var import_create_icon = require("../../create-icon.cjs");
const TruckElectricIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TruckElectricIcon", [["path", { "d": "M14 19V7a2 2 0 0 0-2-2H9" }], ["path", { "d": "M15 19H9" }], ["path", { "d": "M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14" }], ["path", { "d": "M2 13v5a1 1 0 0 0 1 1h2" }], ["path", { "d": "M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02" }], ["circle", { "cx": "17", "cy": "19", "r": "2" }], ["circle", { "cx": "7", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TruckElectricIcon
});
