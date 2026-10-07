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
var satellite_dish_exports = {};
__export(satellite_dish_exports, {
  SatelliteDishIcon: () => SatelliteDishIcon
});
module.exports = __toCommonJS(satellite_dish_exports);
var import_create_icon = require("../../create-icon.cjs");
const SatelliteDishIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SatelliteDishIcon", [["path", { "d": "M18 12a6 6 0 00-6-6" }], ["path", { "d": "M2.824 10.459a8 8 0 0010.717 10.717c.558-.276.623-1.012.183-1.452l-9.448-9.448c-.44-.44-1.176-.375-1.452.183" }], ["path", { "d": "M22 12A10 10 0 0012 2" }], ["path", { "d": "m9 15 4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SatelliteDishIcon
});
