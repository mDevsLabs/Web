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
var building_carousel_exports = {};
__export(building_carousel_exports, {
  BuildingCarouselIcon: () => BuildingCarouselIcon
});
module.exports = __toCommonJS(building_carousel_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingCarouselIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingCarouselIcon", [["path", { "d": "M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" }], ["path", { "d": "M3 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M10 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M17 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M3 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M17 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M8 22l4 -10l4 10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingCarouselIcon
});
