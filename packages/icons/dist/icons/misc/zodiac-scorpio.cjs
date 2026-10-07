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
var zodiac_scorpio_exports = {};
__export(zodiac_scorpio_exports, {
  ZodiacScorpioIcon: () => ZodiacScorpioIcon
});
module.exports = __toCommonJS(zodiac_scorpio_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacScorpioIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacScorpioIcon", [["path", { "d": "M10 19V5.5a1 1 0 0 1 5 0V17a2 2 0 0 0 2 2h5l-3-3" }], ["path", { "d": "m22 19-3 3" }], ["path", { "d": "M5 19V5.5a1 1 0 0 1 5 0" }], ["path", { "d": "M5 5.5A2.5 2.5 0 0 0 2.5 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacScorpioIcon
});
