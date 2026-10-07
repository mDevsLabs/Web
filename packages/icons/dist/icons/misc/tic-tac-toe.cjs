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
var tic_tac_toe_exports = {};
__export(tic_tac_toe_exports, {
  TicTacToeIcon: () => TicTacToeIcon
});
module.exports = __toCommonJS(tic_tac_toe_exports);
var import_create_icon = require("../../create-icon.cjs");
const TicTacToeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TicTacToeIcon", [["path", { "d": "M12 2v20" }], ["path", { "d": "m21 16-5 5" }], ["path", { "d": "m21 21-5-5" }], ["path", { "d": "M22 12H2" }], ["path", { "d": "M8 3 3 8" }], ["path", { "d": "M8 8 3 3" }], ["circle", { "cx": "18.5", "cy": "5.5", "r": "2.5" }], ["circle", { "cx": "5.5", "cy": "18.5", "r": "2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TicTacToeIcon
});
