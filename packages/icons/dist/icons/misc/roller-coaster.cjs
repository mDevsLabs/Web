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
var roller_coaster_exports = {};
__export(roller_coaster_exports, {
  RollerCoasterIcon: () => RollerCoasterIcon
});
module.exports = __toCommonJS(roller_coaster_exports);
var import_create_icon = require("../../create-icon.cjs");
const RollerCoasterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RollerCoasterIcon", [["path", { "d": "M6 19V5" }], ["path", { "d": "M10 19V6.8" }], ["path", { "d": "M14 19v-7.8" }], ["path", { "d": "M18 5v4" }], ["path", { "d": "M18 19v-6" }], ["path", { "d": "M22 19V9" }], ["path", { "d": "M2 19V9a4 4 0 0 1 4-4c2 0 4 1.33 6 4s4 4 6 4a4 4 0 1 0-3-6.65" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RollerCoasterIcon
});
