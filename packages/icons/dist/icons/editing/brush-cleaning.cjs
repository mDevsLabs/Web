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
var brush_cleaning_exports = {};
__export(brush_cleaning_exports, {
  BrushCleaningIcon: () => BrushCleaningIcon
});
module.exports = __toCommonJS(brush_cleaning_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrushCleaningIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrushCleaningIcon", [["path", { "d": "m16 22-1-4" }], ["path", { "d": "M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1" }], ["path", { "d": "M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z" }], ["path", { "d": "m8 22 1-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrushCleaningIcon
});
