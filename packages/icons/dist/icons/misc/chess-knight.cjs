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
var chess_knight_exports = {};
__export(chess_knight_exports, {
  ChessKnightIcon: () => ChessKnightIcon
});
module.exports = __toCommonJS(chess_knight_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChessKnightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChessKnightIcon", [["path", { "d": "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }], ["path", { "d": "M16.5 18c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456" }], ["path", { "d": "m15 5 1.425-1.425" }], ["path", { "d": "m17 8 1.53-1.53" }], ["path", { "d": "M9.713 12.185 7 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChessKnightIcon
});
