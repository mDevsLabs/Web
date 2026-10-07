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
var chess_queen_exports = {};
__export(chess_queen_exports, {
  ChessQueenIcon: () => ChessQueenIcon
});
module.exports = __toCommonJS(chess_queen_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChessQueenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChessQueenIcon", [["path", { "d": "M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" }], ["path", { "d": "m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" }], ["path", { "d": "m20 9-3 9" }], ["path", { "d": "m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" }], ["path", { "d": "M7 18 4 9" }], ["circle", { "cx": "12", "cy": "4", "r": "2" }], ["circle", { "cx": "20", "cy": "7", "r": "2" }], ["circle", { "cx": "4", "cy": "7", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChessQueenIcon
});
