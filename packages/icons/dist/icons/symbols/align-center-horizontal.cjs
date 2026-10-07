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
var align_center_horizontal_exports = {};
__export(align_center_horizontal_exports, {
  AlignCenterHorizontalIcon: () => AlignCenterHorizontalIcon
});
module.exports = __toCommonJS(align_center_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignCenterHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignCenterHorizontalIcon", [["path", { "d": "M2 12h20" }], ["path", { "d": "M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" }], ["path", { "d": "M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" }], ["path", { "d": "M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" }], ["path", { "d": "M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignCenterHorizontalIcon
});
