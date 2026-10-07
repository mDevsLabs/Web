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
var image_upscale_exports = {};
__export(image_upscale_exports, {
  ImageUpscaleIcon: () => ImageUpscaleIcon
});
module.exports = __toCommonJS(image_upscale_exports);
var import_create_icon = require("../../create-icon.cjs");
const ImageUpscaleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ImageUpscaleIcon", [["path", { "d": "M16 3h5v5" }], ["path", { "d": "M17 21h2a2 2 0 0 0 2-2" }], ["path", { "d": "M21 12v3" }], ["path", { "d": "m21 3-5 5" }], ["path", { "d": "M3 7V5a2 2 0 0 1 2-2" }], ["path", { "d": "m5 21 4.144-4.144a1.21 1.21 0 0 1 1.712 0L13 19" }], ["path", { "d": "M9 3h3" }], ["rect", { "x": "3", "y": "11", "width": "10", "height": "10", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageUpscaleIcon
});
