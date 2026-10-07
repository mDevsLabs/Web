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
var building_broadcast_tower_exports = {};
__export(building_broadcast_tower_exports, {
  BuildingBroadcastTowerIcon: () => BuildingBroadcastTowerIcon
});
module.exports = __toCommonJS(building_broadcast_tower_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingBroadcastTowerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingBroadcastTowerIcon", [["path", { "d": "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }], ["path", { "d": "M16.616 13.924a5 5 0 1 0 -9.23 0" }], ["path", { "d": "M20.307 15.469a9 9 0 1 0 -16.615 0" }], ["path", { "d": "M9 21l3 -9l3 9" }], ["path", { "d": "M10 19h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingBroadcastTowerIcon
});
