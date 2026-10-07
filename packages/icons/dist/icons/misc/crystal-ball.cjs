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
var crystal_ball_exports = {};
__export(crystal_ball_exports, {
  CrystalBallIcon: () => CrystalBallIcon
});
module.exports = __toCommonJS(crystal_ball_exports);
var import_create_icon = require("../../create-icon.cjs");
const CrystalBallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CrystalBallIcon", [["path", { "d": "M6.73 17.018a8 8 0 1 1 10.54 0" }], ["path", { "d": "M5 19a2 2 0 0 0 2 2h10a2 2 0 1 0 0 -4h-10a2 2 0 0 0 -2 2" }], ["path", { "d": "M11 7a3 3 0 0 0 -3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CrystalBallIcon
});
