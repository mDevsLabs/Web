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
var brick_wall_fire_exports = {};
__export(brick_wall_fire_exports, {
  BrickWallFireIcon: () => BrickWallFireIcon
});
module.exports = __toCommonJS(brick_wall_fire_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrickWallFireIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrickWallFireIcon", [["path", { "d": "M16 3v2.107" }], ["path", { "d": "M17 9c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 22 17a5 5 0 0 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C13 11.5 16 9 17 9" }], ["path", { "d": "M21 8.274V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.938" }], ["path", { "d": "M3 15h5.253" }], ["path", { "d": "M3 9h8.228" }], ["path", { "d": "M8 15v6" }], ["path", { "d": "M8 3v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrickWallFireIcon
});
