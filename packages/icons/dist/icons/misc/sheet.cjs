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
var sheet_exports = {};
__export(sheet_exports, {
  SheetIcon: () => SheetIcon
});
module.exports = __toCommonJS(sheet_exports);
var import_create_icon = require("../../create-icon.cjs");
const SheetIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SheetIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2", "ry": "2" }], ["line", { "x1": "3", "x2": "21", "y1": "9", "y2": "9" }], ["line", { "x1": "3", "x2": "21", "y1": "15", "y2": "15" }], ["line", { "x1": "9", "x2": "9", "y1": "9", "y2": "21" }], ["line", { "x1": "15", "x2": "15", "y1": "9", "y2": "21" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SheetIcon
});
