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
var brightness_off_exports = {};
__export(brightness_off_exports, {
  BrightnessOffIcon: () => BrightnessOffIcon
});
module.exports = __toCommonJS(brightness_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrightnessOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrightnessOffIcon", [["path", { "d": "M12 3v5m0 4v9" }], ["path", { "d": "M5.641 5.631a9 9 0 1 0 12.719 12.738m1.68 -2.318a9 9 0 0 0 -12.074 -12.098" }], ["path", { "d": "M12.5 8.5l4.15 -4.15" }], ["path", { "d": "M12 14l1.025 -.983m2.065 -1.981l4.28 -4.106" }], ["path", { "d": "M12 19.6l3.79 -3.79m2 -2l3.054 -3.054" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrightnessOffIcon
});
