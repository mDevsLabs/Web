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
var sun_snow_exports = {};
__export(sun_snow_exports, {
  SunSnowIcon: () => SunSnowIcon
});
module.exports = __toCommonJS(sun_snow_exports);
var import_create_icon = require("../../create-icon.cjs");
const SunSnowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SunSnowIcon", [["path", { "d": "M10 21v-1" }], ["path", { "d": "M10 4V3" }], ["path", { "d": "M10 9a3 3 0 0 0 0 6" }], ["path", { "d": "m14 20 1.25-2.5L18 18" }], ["path", { "d": "m14 4 1.25 2.5L18 6" }], ["path", { "d": "m17 21-3-6 1.5-3H22" }], ["path", { "d": "m17 3-3 6 1.5 3" }], ["path", { "d": "M2 12h1" }], ["path", { "d": "m20 10-1.5 2 1.5 2" }], ["path", { "d": "m3.64 18.36.7-.7" }], ["path", { "d": "m4.34 6.34-.7-.7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SunSnowIcon
});
