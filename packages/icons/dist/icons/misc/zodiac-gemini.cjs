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
var zodiac_gemini_exports = {};
__export(zodiac_gemini_exports, {
  ZodiacGeminiIcon: () => ZodiacGeminiIcon
});
module.exports = __toCommonJS(zodiac_gemini_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacGeminiIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacGeminiIcon", [["path", { "d": "M16 4.525v14.948" }], ["path", { "d": "M20 3A17 17 0 0 1 4 3" }], ["path", { "d": "M4 21a17 17 0 0 1 16 0" }], ["path", { "d": "M8 4.525v14.948" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacGeminiIcon
});
