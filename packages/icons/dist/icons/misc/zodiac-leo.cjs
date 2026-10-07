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
var zodiac_leo_exports = {};
__export(zodiac_leo_exports, {
  ZodiacLeoIcon: () => ZodiacLeoIcon
});
module.exports = __toCommonJS(zodiac_leo_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacLeoIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacLeoIcon", [["path", { "d": "M10 16c0-4-3-4.5-3-8a5 5 0 0 1 10 0c0 3.466-3 6.196-3 10a3 3 0 0 0 6 0" }], ["circle", { "cx": "7", "cy": "16", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacLeoIcon
});
