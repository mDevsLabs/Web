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
var air_balloon_exports = {};
__export(air_balloon_exports, {
  AirBalloonIcon: () => AirBalloonIcon
});
module.exports = __toCommonJS(air_balloon_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirBalloonIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirBalloonIcon", [["path", { "d": "M9 21v-3h6v3a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1" }], ["path", { "d": "M9 18c-2.347 -2.169 -5 -5.226 -5 -8a8 8 0 1 1 16 0c0 2.774 -2.653 5.831 -5 8" }], ["path", { "d": "M5.5 14h13" }], ["path", { "d": "M10 14c-1.69 -4.712 -.924 -8.197 0 -11.602" }], ["path", { "d": "M14 14c1.469 -3.867 1.19 -7.735 0 -11.602" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirBalloonIcon
});
