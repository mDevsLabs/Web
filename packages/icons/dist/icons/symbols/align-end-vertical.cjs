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
var align_end_vertical_exports = {};
__export(align_end_vertical_exports, {
  AlignEndVerticalIcon: () => AlignEndVerticalIcon
});
module.exports = __toCommonJS(align_end_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignEndVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignEndVerticalIcon", [["rect", { "width": "16", "height": "6", "x": "2", "y": "4", "rx": "2" }], ["rect", { "width": "9", "height": "6", "x": "9", "y": "14", "rx": "2" }], ["path", { "d": "M22 22V2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignEndVerticalIcon
});
