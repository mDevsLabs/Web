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
var glass_water_exports = {};
__export(glass_water_exports, {
  GlassWaterIcon: () => GlassWaterIcon
});
module.exports = __toCommonJS(glass_water_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlassWaterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlassWaterIcon", [["path", { "d": "M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" }], ["path", { "d": "M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlassWaterIcon
});
