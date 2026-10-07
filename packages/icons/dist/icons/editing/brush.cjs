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
var brush_exports = {};
__export(brush_exports, {
  BrushIcon: () => BrushIcon
});
module.exports = __toCommonJS(brush_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrushIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrushIcon", [["path", { "d": "m11 10 3 3" }], ["path", { "d": "M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" }], ["path", { "d": "M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrushIcon
});
