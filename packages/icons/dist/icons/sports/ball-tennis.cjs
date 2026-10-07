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
var ball_tennis_exports = {};
__export(ball_tennis_exports, {
  BallTennisIcon: () => BallTennisIcon
});
module.exports = __toCommonJS(ball_tennis_exports);
var import_create_icon = require("../../create-icon.cjs");
const BallTennisIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BallTennisIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M6 5.3a9 9 0 0 1 0 13.4" }], ["path", { "d": "M18 5.3a9 9 0 0 0 0 13.4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallTennisIcon
});
