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
var scissors_line_dashed_exports = {};
__export(scissors_line_dashed_exports, {
  ScissorsLineDashedIcon: () => ScissorsLineDashedIcon
});
module.exports = __toCommonJS(scissors_line_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScissorsLineDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScissorsLineDashedIcon", [["path", { "d": "M5.42 9.42 8 12" }], ["circle", { "cx": "4", "cy": "8", "r": "2" }], ["path", { "d": "m14 6-8.58 8.58" }], ["circle", { "cx": "4", "cy": "16", "r": "2" }], ["path", { "d": "M10.8 14.8 14 18" }], ["path", { "d": "M16 12h-2" }], ["path", { "d": "M22 12h-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScissorsLineDashedIcon
});
