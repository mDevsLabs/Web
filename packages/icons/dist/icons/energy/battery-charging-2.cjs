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
var battery_charging_2_exports = {};
__export(battery_charging_2_exports, {
  BatteryCharging2Icon: () => BatteryCharging2Icon
});
module.exports = __toCommonJS(battery_charging_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const BatteryCharging2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BatteryCharging2Icon", [["path", { "d": "M4 9a2 2 0 0 1 2 -2h11a2 2 0 0 1 2 2v.5a.5 .5 0 0 0 .5 .5a.5 .5 0 0 1 .5 .5v3a.5 .5 0 0 1 -.5 .5a.5 .5 0 0 0 -.5 .5v.5a2 2 0 0 1 -2 2h-4.5" }], ["path", { "d": "M3 15h6v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-2" }], ["path", { "d": "M6 22v-3" }], ["path", { "d": "M4 15v-2.5" }], ["path", { "d": "M8 15v-2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryCharging2Icon
});
