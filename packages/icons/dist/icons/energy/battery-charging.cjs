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
var battery_charging_exports = {};
__export(battery_charging_exports, {
  BatteryChargingIcon: () => BatteryChargingIcon
});
module.exports = __toCommonJS(battery_charging_exports);
var import_create_icon = require("../../create-icon.cjs");
const BatteryChargingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BatteryChargingIcon", [["path", { "d": "m11 7-3 5h4l-3 5" }], ["path", { "d": "M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" }], ["path", { "d": "M22 14v-4" }], ["path", { "d": "M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryChargingIcon
});
