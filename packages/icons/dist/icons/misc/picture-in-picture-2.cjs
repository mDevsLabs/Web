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
var picture_in_picture_2_exports = {};
__export(picture_in_picture_2_exports, {
  PictureInPicture2Icon: () => PictureInPicture2Icon
});
module.exports = __toCommonJS(picture_in_picture_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const PictureInPicture2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PictureInPicture2Icon", [["path", { "d": "M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" }], ["rect", { "width": "10", "height": "7", "x": "12", "y": "13", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PictureInPicture2Icon
});
