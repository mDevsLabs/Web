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
var chess_pawn_exports = {};
__export(chess_pawn_exports, {
  ChessPawnIcon: () => ChessPawnIcon
});
module.exports = __toCommonJS(chess_pawn_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChessPawnIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChessPawnIcon", [["path", { "d": "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }], ["path", { "d": "m14.5 10 1.5 8" }], ["path", { "d": "M7 10h10" }], ["path", { "d": "m8 18 1.5-8" }], ["circle", { "cx": "12", "cy": "6", "r": "4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChessPawnIcon
});
