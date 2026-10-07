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
var mirror_rectangular_exports = {};
__export(mirror_rectangular_exports, {
  MirrorRectangularIcon: () => MirrorRectangularIcon
});
module.exports = __toCommonJS(mirror_rectangular_exports);
var import_create_icon = require("../../create-icon.cjs");
const MirrorRectangularIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MirrorRectangularIcon", [["path", { "d": "M11 6 8 9" }], ["path", { "d": "m16 7-8 8" }], ["rect", { "x": "4", "y": "2", "width": "16", "height": "20", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MirrorRectangularIcon
});
