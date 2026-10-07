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
var zodiac_cancer_exports = {};
__export(zodiac_cancer_exports, {
  ZodiacCancerIcon: () => ZodiacCancerIcon
});
module.exports = __toCommonJS(zodiac_cancer_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZodiacCancerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZodiacCancerIcon", [["path", { "d": "M21 14.5A9 6.5 0 0 1 5.5 19" }], ["path", { "d": "M3 9.5A9 6.5 0 0 1 18.5 5" }], ["circle", { "cx": "17.5", "cy": "14.5", "r": "3.5" }], ["circle", { "cx": "6.5", "cy": "9.5", "r": "3.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZodiacCancerIcon
});
