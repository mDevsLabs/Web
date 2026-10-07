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
var image_down_exports = {};
__export(image_down_exports, {
  ImageDownIcon: () => ImageDownIcon
});
module.exports = __toCommonJS(image_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const ImageDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ImageDownIcon", [["path", { "d": "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" }], ["path", { "d": "m14 19 3 3v-5.5" }], ["path", { "d": "m17 22 3-3" }], ["circle", { "cx": "9", "cy": "9", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageDownIcon
});
