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
var align_vertical_space_between_exports = {};
__export(align_vertical_space_between_exports, {
  AlignVerticalSpaceBetweenIcon: () => AlignVerticalSpaceBetweenIcon
});
module.exports = __toCommonJS(align_vertical_space_between_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignVerticalSpaceBetweenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignVerticalSpaceBetweenIcon", [["rect", { "width": "14", "height": "6", "x": "5", "y": "15", "rx": "2" }], ["rect", { "width": "10", "height": "6", "x": "7", "y": "3", "rx": "2" }], ["path", { "d": "M2 21h20" }], ["path", { "d": "M2 3h20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignVerticalSpaceBetweenIcon
});
