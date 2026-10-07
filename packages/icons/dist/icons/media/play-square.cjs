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
var play_square_exports = {};
__export(play_square_exports, {
  PlaySquareIcon: () => PlaySquareIcon
});
module.exports = __toCommonJS(play_square_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlaySquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlaySquareIcon", [["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }], ["path", { "d": "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlaySquareIcon
});
