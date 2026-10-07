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
var cloud_moon_rain_exports = {};
__export(cloud_moon_rain_exports, {
  CloudMoonRainIcon: () => CloudMoonRainIcon
});
module.exports = __toCommonJS(cloud_moon_rain_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudMoonRainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudMoonRainIcon", [["path", { "d": "M11 20v2" }], ["path", { "d": "M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36" }], ["path", { "d": "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }], ["path", { "d": "M7 19v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudMoonRainIcon
});
