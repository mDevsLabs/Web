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
var align_horizontal_distribute_end_exports = {};
__export(align_horizontal_distribute_end_exports, {
  AlignHorizontalDistributeEndIcon: () => AlignHorizontalDistributeEndIcon
});
module.exports = __toCommonJS(align_horizontal_distribute_end_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignHorizontalDistributeEndIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignHorizontalDistributeEndIcon", [["rect", { "width": "6", "height": "14", "x": "4", "y": "5", "rx": "2" }], ["rect", { "width": "6", "height": "10", "x": "14", "y": "7", "rx": "2" }], ["path", { "d": "M10 2v20" }], ["path", { "d": "M20 2v20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignHorizontalDistributeEndIcon
});
