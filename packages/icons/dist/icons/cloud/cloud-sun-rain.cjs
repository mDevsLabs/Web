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
var cloud_sun_rain_exports = {};
__export(cloud_sun_rain_exports, {
  CloudSunRainIcon: () => CloudSunRainIcon
});
module.exports = __toCommonJS(cloud_sun_rain_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudSunRainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudSunRainIcon", [["path", { "d": "M12 2v2" }], ["path", { "d": "m4.93 4.93 1.41 1.41" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "m19.07 4.93-1.41 1.41" }], ["path", { "d": "M15.947 12.65a4 4 0 0 0-5.925-4.128" }], ["path", { "d": "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }], ["path", { "d": "M11 20v2" }], ["path", { "d": "M7 19v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudSunRainIcon
});
