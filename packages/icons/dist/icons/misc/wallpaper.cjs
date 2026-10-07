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
var wallpaper_exports = {};
__export(wallpaper_exports, {
  WallpaperIcon: () => WallpaperIcon
});
module.exports = __toCommonJS(wallpaper_exports);
var import_create_icon = require("../../create-icon.cjs");
const WallpaperIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WallpaperIcon", [["path", { "d": "M12 17v4" }], ["path", { "d": "M8 21h8" }], ["path", { "d": "m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" }], ["circle", { "cx": "8", "cy": "9", "r": "2" }], ["rect", { "x": "2", "y": "3", "width": "20", "height": "14", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WallpaperIcon
});
