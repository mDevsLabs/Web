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
var sun_moon_exports = {};
__export(sun_moon_exports, {
  SunMoonIcon: () => SunMoonIcon
});
module.exports = __toCommonJS(sun_moon_exports);
var import_create_icon = require("../../create-icon.cjs");
const SunMoonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SunMoonIcon", [["path", { "d": "M12 2v2" }], ["path", { "d": "M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715" }], ["path", { "d": "M16 12a4 4 0 0 0-4-4" }], ["path", { "d": "m19 5-1.256 1.256" }], ["path", { "d": "M20 12h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SunMoonIcon
});
