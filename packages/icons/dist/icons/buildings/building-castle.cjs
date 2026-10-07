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
var building_castle_exports = {};
__export(building_castle_exports, {
  BuildingCastleIcon: () => BuildingCastleIcon
});
module.exports = __toCommonJS(building_castle_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingCastleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingCastleIcon", [["path", { "d": "M15 19v-2a3 3 0 0 0 -6 0v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14h4v3h3v-3h4v3h3v-3h4v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1" }], ["path", { "d": "M3 11l18 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingCastleIcon
});
