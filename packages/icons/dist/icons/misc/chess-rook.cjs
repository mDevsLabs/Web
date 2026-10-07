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
var chess_rook_exports = {};
__export(chess_rook_exports, {
  ChessRookIcon: () => ChessRookIcon
});
module.exports = __toCommonJS(chess_rook_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChessRookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChessRookIcon", [["path", { "d": "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }], ["path", { "d": "M10 2v2" }], ["path", { "d": "M14 2v2" }], ["path", { "d": "m17 18-1-9" }], ["path", { "d": "M6 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2" }], ["path", { "d": "M6 4h12" }], ["path", { "d": "m7 18 1-9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChessRookIcon
});
