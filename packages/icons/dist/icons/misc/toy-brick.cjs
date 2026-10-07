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
var toy_brick_exports = {};
__export(toy_brick_exports, {
  ToyBrickIcon: () => ToyBrickIcon
});
module.exports = __toCommonJS(toy_brick_exports);
var import_create_icon = require("../../create-icon.cjs");
const ToyBrickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ToyBrickIcon", [["rect", { "width": "18", "height": "12", "x": "3", "y": "8", "rx": "1" }], ["path", { "d": "M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3" }], ["path", { "d": "M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToyBrickIcon
});
