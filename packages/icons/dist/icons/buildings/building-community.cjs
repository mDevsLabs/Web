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
var building_community_exports = {};
__export(building_community_exports, {
  BuildingCommunityIcon: () => BuildingCommunityIcon
});
module.exports = __toCommonJS(building_community_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingCommunityIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingCommunityIcon", [["path", { "d": "M8 9l5 5v7h-5v-4m0 4h-5v-7l5 -5m1 1v-6a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v17h-8" }], ["path", { "d": "M13 7l0 .01" }], ["path", { "d": "M17 7l0 .01" }], ["path", { "d": "M17 11l0 .01" }], ["path", { "d": "M17 15l0 .01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingCommunityIcon
});
