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
var bandage_exports = {};
__export(bandage_exports, {
  BandageIcon: () => BandageIcon
});
module.exports = __toCommonJS(bandage_exports);
var import_create_icon = require("../../create-icon.cjs");
const BandageIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BandageIcon", [["path", { "d": "M10 10.01h.01" }], ["path", { "d": "M10 14.01h.01" }], ["path", { "d": "M14 10.01h.01" }], ["path", { "d": "M14 14.01h.01" }], ["path", { "d": "M18 6v12" }], ["path", { "d": "M6 6v12" }], ["rect", { "x": "2", "y": "6", "width": "20", "height": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BandageIcon
});
