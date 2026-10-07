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
var alarm_clock_off_exports = {};
__export(alarm_clock_off_exports, {
  AlarmClockOffIcon: () => AlarmClockOffIcon
});
module.exports = __toCommonJS(alarm_clock_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlarmClockOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlarmClockOffIcon", [["path", { "d": "M6.87 6.87a8 8 0 1 0 11.26 11.26" }], ["path", { "d": "M19.9 14.25a8 8 0 0 0-9.15-9.15" }], ["path", { "d": "m22 6-3-3" }], ["path", { "d": "M6.26 18.67 4 21" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M4 4 2 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlarmClockOffIcon
});
