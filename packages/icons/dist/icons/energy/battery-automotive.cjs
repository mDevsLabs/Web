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
var battery_automotive_exports = {};
__export(battery_automotive_exports, {
  BatteryAutomotiveIcon: () => BatteryAutomotiveIcon
});
module.exports = __toCommonJS(battery_automotive_exports);
var import_create_icon = require("../../create-icon.cjs");
const BatteryAutomotiveIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BatteryAutomotiveIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -10" }], ["path", { "d": "M6 5v-2" }], ["path", { "d": "M18 3v2" }], ["path", { "d": "M6.5 12h3" }], ["path", { "d": "M14.5 12h3" }], ["path", { "d": "M16 10.5v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryAutomotiveIcon
});
