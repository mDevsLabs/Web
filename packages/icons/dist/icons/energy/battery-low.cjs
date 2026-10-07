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
var battery_low_exports = {};
__export(battery_low_exports, {
  BatteryLowIcon: () => BatteryLowIcon
});
module.exports = __toCommonJS(battery_low_exports);
var import_create_icon = require("../../create-icon.cjs");
const BatteryLowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BatteryLowIcon", [["path", { "d": "M22 14v-4" }], ["path", { "d": "M6 14v-4" }], ["rect", { "x": "2", "y": "6", "width": "16", "height": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryLowIcon
});
