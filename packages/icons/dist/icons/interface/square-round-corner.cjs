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
var square_round_corner_exports = {};
__export(square_round_corner_exports, {
  SquareRoundCornerIcon: () => SquareRoundCornerIcon
});
module.exports = __toCommonJS(square_round_corner_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareRoundCornerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareRoundCornerIcon", [["path", { "d": "M21 11a8 8 0 0 0-8-8" }], ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareRoundCornerIcon
});
