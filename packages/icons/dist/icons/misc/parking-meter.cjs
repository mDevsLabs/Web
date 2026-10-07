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
var parking_meter_exports = {};
__export(parking_meter_exports, {
  ParkingMeterIcon: () => ParkingMeterIcon
});
module.exports = __toCommonJS(parking_meter_exports);
var import_create_icon = require("../../create-icon.cjs");
const ParkingMeterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ParkingMeterIcon", [["path", { "d": "M11 15h2" }], ["path", { "d": "M12 12v3" }], ["path", { "d": "M12 19v3" }], ["path", { "d": "M15.282 19a1 1 0 0 0 .948-.68l2.37-6.988a7 7 0 1 0-13.2 0l2.37 6.988a1 1 0 0 0 .948.68z" }], ["path", { "d": "M9 9a3 3 0 1 1 6 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParkingMeterIcon
});
