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
var lamp_wall_down_exports = {};
__export(lamp_wall_down_exports, {
  LampWallDownIcon: () => LampWallDownIcon
});
module.exports = __toCommonJS(lamp_wall_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const LampWallDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LampWallDownIcon", [["path", { "d": "M19.929 18.629A1 1 0 0 1 19 20H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 13h6a1 1 0 0 1 .928.629z" }], ["path", { "d": "M6 3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" }], ["path", { "d": "M8 6h4a2 2 0 0 1 2 2v5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LampWallDownIcon
});
