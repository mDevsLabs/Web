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
var image_plus_exports = {};
__export(image_plus_exports, {
  ImagePlusIcon: () => ImagePlusIcon
});
module.exports = __toCommonJS(image_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const ImagePlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ImagePlusIcon", [["path", { "d": "M16 5h6" }], ["path", { "d": "M19 2v6" }], ["path", { "d": "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" }], ["path", { "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }], ["circle", { "cx": "9", "cy": "9", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImagePlusIcon
});
