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
var brightness_auto_exports = {};
__export(brightness_auto_exports, {
  BrightnessAutoIcon: () => BrightnessAutoIcon
});
module.exports = __toCommonJS(brightness_auto_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrightnessAutoIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrightnessAutoIcon", [["path", { "d": "M6 6h3.5l2.5 -2.5l2.5 2.5h3.5v3.5l2.5 2.5l-2.5 2.5v3.5h-3.5l-2.5 2.5l-2.5 -2.5h-3.5v-3.5l-2.5 -2.5l2.5 -2.5l0 -3.5" }], ["path", { "d": "M10 14.5v-3.5a2 2 0 1 1 4 0v3.5" }], ["path", { "d": "M10 13h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrightnessAutoIcon
});
