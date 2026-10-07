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
var picture_in_picture_exports = {};
__export(picture_in_picture_exports, {
  PictureInPictureIcon: () => PictureInPictureIcon
});
module.exports = __toCommonJS(picture_in_picture_exports);
var import_create_icon = require("../../create-icon.cjs");
const PictureInPictureIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PictureInPictureIcon", [["path", { "d": "M2 10h6V4" }], ["path", { "d": "m2 4 6 6" }], ["path", { "d": "M21 10V7a2 2 0 0 0-2-2h-7" }], ["path", { "d": "M3 14v2a2 2 0 0 0 2 2h3" }], ["rect", { "x": "12", "y": "14", "width": "10", "height": "7", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PictureInPictureIcon
});
