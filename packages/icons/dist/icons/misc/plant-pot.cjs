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
var plant_pot_exports = {};
__export(plant_pot_exports, {
  PlantPotIcon: () => PlantPotIcon
});
module.exports = __toCommonJS(plant_pot_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlantPotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlantPotIcon", [["path", { "d": "M14 8.536V6a4 4 0 014-4h1.5a.5.5 0 01.5.5V4a4 4 0 01-4 4 4 4 0 00-4 4 5 5 0 01-8-4 5 5 0 018 4c0 2 1 3 1 5" }], ["path", { "d": "m18 17-1.085 3.58A2 2 0 0115 22H9.002a2 2 0 01-1.913-1.418L6 17" }], ["path", { "d": "M5 17h14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlantPotIcon
});
