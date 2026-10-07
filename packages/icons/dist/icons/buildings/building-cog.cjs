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
var building_cog_exports = {};
__export(building_cog_exports, {
  BuildingCogIcon: () => BuildingCogIcon
});
module.exports = __toCommonJS(building_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingCogIcon", [["path", { "d": "M3 21h9" }], ["path", { "d": "M9 8h1" }], ["path", { "d": "M9 12h1" }], ["path", { "d": "M9 16h1" }], ["path", { "d": "M14 8h1" }], ["path", { "d": "M14 12h1" }], ["path", { "d": "M5 21v-16c0 -.53 .211 -1.039 .586 -1.414c.375 -.375 .884 -.586 1.414 -.586h10c.53 0 1.039 .211 1.414 .586c.375 .375 .586 .884 .586 1.414v7" }], ["path", { "d": "M16 18c0 .53 .211 1.039 .586 1.414c.375 .375 .884 .586 1.414 .586c.53 0 1.039 -.211 1.414 -.586c.375 -.375 .586 -.884 .586 -1.414c0 -.53 -.211 -1.039 -.586 -1.414c-.375 -.375 -.884 -.586 -1.414 -.586c-.53 0 -1.039 .211 -1.414 .586c-.375 .375 -.586 .884 -.586 1.414" }], ["path", { "d": "M18 14.5v1.5" }], ["path", { "d": "M18 20v1.5" }], ["path", { "d": "M21.032 16.25l-1.299 .75" }], ["path", { "d": "M16.27 19l-1.3 .75" }], ["path", { "d": "M14.97 16.25l1.3 .75" }], ["path", { "d": "M19.733 19l1.3 .75" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingCogIcon
});
