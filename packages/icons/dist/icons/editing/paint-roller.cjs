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
var paint_roller_exports = {};
__export(paint_roller_exports, {
  PaintRollerIcon: () => PaintRollerIcon
});
module.exports = __toCommonJS(paint_roller_exports);
var import_create_icon = require("../../create-icon.cjs");
const PaintRollerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PaintRollerIcon", [["rect", { "width": "16", "height": "6", "x": "2", "y": "2", "rx": "2" }], ["path", { "d": "M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" }], ["rect", { "width": "4", "height": "6", "x": "8", "y": "16", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaintRollerIcon
});
