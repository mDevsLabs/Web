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
var exposure_off_exports = {};
__export(exposure_off_exports, {
  ExposureOffIcon: () => ExposureOffIcon
});
module.exports = __toCommonJS(exposure_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ExposureOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ExposureOffIcon", [["path", { "d": "M3.6 20.4l8.371 -8.371m2.04 -2.04l6.389 -6.389" }], ["path", { "d": "M6 8h2m0 0v2" }], ["path", { "d": "M14 16h2" }], ["path", { "d": "M7 3h12a2 2 0 0 1 2 2v12m-.5 3.5c-.362 .36 -.95 .5 -1.5 .5h-14a2 2 0 0 1 -2 -2v-14c0 -.541 .215 -1.033 .565 -1.393" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExposureOffIcon
});
