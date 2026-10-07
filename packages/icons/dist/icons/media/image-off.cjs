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
var image_off_exports = {};
__export(image_off_exports, {
  ImageOffIcon: () => ImageOffIcon
});
module.exports = __toCommonJS(image_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ImageOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ImageOffIcon", [["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }], ["path", { "d": "M10.41 10.41a2 2 0 1 1-2.83-2.83" }], ["line", { "x1": "13.5", "x2": "6", "y1": "13.5", "y2": "21" }], ["line", { "x1": "18", "x2": "21", "y1": "12", "y2": "15" }], ["path", { "d": "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" }], ["path", { "d": "M21 15V5a2 2 0 0 0-2-2H9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImageOffIcon
});
