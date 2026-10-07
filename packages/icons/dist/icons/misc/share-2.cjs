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
var share_2_exports = {};
__export(share_2_exports, {
  Share2Icon: () => Share2Icon
});
module.exports = __toCommonJS(share_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Share2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Share2Icon", [["circle", { "cx": "18", "cy": "5", "r": "3" }], ["circle", { "cx": "6", "cy": "12", "r": "3" }], ["circle", { "cx": "18", "cy": "19", "r": "3" }], ["line", { "x1": "8.59", "x2": "15.42", "y1": "13.51", "y2": "17.49" }], ["line", { "x1": "15.41", "x2": "8.59", "y1": "6.51", "y2": "10.49" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Share2Icon
});
