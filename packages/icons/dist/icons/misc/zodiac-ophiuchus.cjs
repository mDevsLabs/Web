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
var zodiac_ophiuchus_exports = {};
__export(zodiac_ophiuchus_exports, {
  ZodiacOphiuchusIcon: () => ZodiacOphiuchusIcon
});
module.exports = __toCommonJS(zodiac_ophiuchus_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacOphiuchusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacOphiuchusIcon", [["path", { "d": "M3 10A6.06 6.06 0 0 1 12 10 A6.06 6.06 0 0 0 21 10" }], ["path", { "d": "M6 3v12a6 6 0 0 0 12 0V3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacOphiuchusIcon
});
