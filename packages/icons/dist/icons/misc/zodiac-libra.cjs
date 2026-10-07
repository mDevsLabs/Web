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
var zodiac_libra_exports = {};
__export(zodiac_libra_exports, {
  ZodiacLibraIcon: () => ZodiacLibraIcon
});
module.exports = __toCommonJS(zodiac_libra_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacLibraIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacLibraIcon", [["path", { "d": "M3 16h6.857c.162-.012.19-.323.038-.38a6 6 0 1 1 4.212 0c-.153.057-.125.368.038.38H21" }], ["path", { "d": "M3 20h18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacLibraIcon
});
