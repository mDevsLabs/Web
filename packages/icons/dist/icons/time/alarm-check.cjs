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
var alarm_check_exports = {};
__export(alarm_check_exports, {
  AlarmCheckIcon: () => AlarmCheckIcon
});
module.exports = __toCommonJS(alarm_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlarmCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlarmCheckIcon", [["circle", { "cx": "12", "cy": "13", "r": "8" }], ["path", { "d": "M5 3 2 6" }], ["path", { "d": "m22 6-3-3" }], ["path", { "d": "M6.38 18.7 4 21" }], ["path", { "d": "M17.64 18.67 20 21" }], ["path", { "d": "m9 13 2 2 4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlarmCheckIcon
});
