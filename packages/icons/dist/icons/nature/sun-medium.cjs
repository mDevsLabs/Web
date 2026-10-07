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
var sun_medium_exports = {};
__export(sun_medium_exports, {
  SunMediumIcon: () => SunMediumIcon
});
module.exports = __toCommonJS(sun_medium_exports);
var import_create_icon = require("../../create-icon.cjs");
const SunMediumIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SunMediumIcon", [["circle", { "cx": "12", "cy": "12", "r": "4" }], ["path", { "d": "M12 3v1" }], ["path", { "d": "M12 20v1" }], ["path", { "d": "M3 12h1" }], ["path", { "d": "M20 12h1" }], ["path", { "d": "m18.364 5.636-.707.707" }], ["path", { "d": "m6.343 17.657-.707.707" }], ["path", { "d": "m5.636 5.636.707.707" }], ["path", { "d": "m17.657 17.657.707.707" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SunMediumIcon
});
