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
var zodiac_capricorn_exports = {};
__export(zodiac_capricorn_exports, {
  ZodiacCapricornIcon: () => ZodiacCapricornIcon
});
module.exports = __toCommonJS(zodiac_capricorn_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacCapricornIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacCapricornIcon", [["path", { "d": "M11 21a3 3 0 0 0 3-3V6.5a1 1 0 0 0-7 0" }], ["path", { "d": "M7 19V6a3 3 0 0 0-3-3h0" }], ["circle", { "cx": "17", "cy": "17", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacCapricornIcon
});
