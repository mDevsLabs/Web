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
var car_battery_exports = {};
__export(car_battery_exports, {
  CarBatteryIcon: () => CarBatteryIcon
});
module.exports = __toCommonJS(car_battery_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarBatteryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarBatteryIcon", [["path", { "d": "M14 13h4" }], ["path", { "d": "M16 15v-4" }], ["path", { "d": "M18 5v2" }], ["path", { "d": "M6 13h4" }], ["path", { "d": "M6 5v2" }], ["rect", { "x": "2", "y": "7", "width": "20", "height": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarBatteryIcon
});
