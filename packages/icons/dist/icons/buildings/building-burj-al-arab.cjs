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
var building_burj_al_arab_exports = {};
__export(building_burj_al_arab_exports, {
  BuildingBurjAlArabIcon: () => BuildingBurjAlArabIcon
});
module.exports = __toCommonJS(building_burj_al_arab_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingBurjAlArabIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingBurjAlArabIcon", [["path", { "d": "M3 21h18" }], ["path", { "d": "M7 21v-18" }], ["path", { "d": "M7 4c5.675 .908 10 5.613 10 11.28a11 11 0 0 1 -1.605 5.72" }], ["path", { "d": "M5 9h12" }], ["path", { "d": "M7 13h4" }], ["path", { "d": "M7 17h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingBurjAlArabIcon
});
