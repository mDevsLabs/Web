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
var chess_bishop_exports = {};
__export(chess_bishop_exports, {
  ChessBishopIcon: () => ChessBishopIcon
});
module.exports = __toCommonJS(chess_bishop_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChessBishopIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChessBishopIcon", [["path", { "d": "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" }], ["path", { "d": "M15 18c1.5-.615 3-2.461 3-4.923C18 8.769 14.5 4.462 12 2 9.5 4.462 6 8.77 6 13.077 6 15.539 7.5 17.385 9 18" }], ["path", { "d": "m16 7-2.5 2.5" }], ["path", { "d": "M9 2h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChessBishopIcon
});
