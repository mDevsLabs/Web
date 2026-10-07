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
var battery_warning_exports = {};
__export(battery_warning_exports, {
  BatteryWarningIcon: () => BatteryWarningIcon
});
module.exports = __toCommonJS(battery_warning_exports);
var import_create_icon = require("../../create-icon.cjs");
const BatteryWarningIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BatteryWarningIcon", [["path", { "d": "M10 17h.01" }], ["path", { "d": "M10 7v6" }], ["path", { "d": "M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M22 14v-4" }], ["path", { "d": "M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatteryWarningIcon
});
