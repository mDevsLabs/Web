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
var ferris_wheel_exports = {};
__export(ferris_wheel_exports, {
  FerrisWheelIcon: () => FerrisWheelIcon
});
module.exports = __toCommonJS(ferris_wheel_exports);
var import_create_icon = require("../../create-icon.cjs");
const FerrisWheelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FerrisWheelIcon", [["circle", { "cx": "12", "cy": "12", "r": "2" }], ["path", { "d": "M12 2v4" }], ["path", { "d": "m6.8 15-3.5 2" }], ["path", { "d": "m20.7 7-3.5 2" }], ["path", { "d": "M6.8 9 3.3 7" }], ["path", { "d": "m20.7 17-3.5-2" }], ["path", { "d": "m9 22 3-8 3 8" }], ["path", { "d": "M8 22h8" }], ["path", { "d": "M18 18.7a9 9 0 1 0-12 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FerrisWheelIcon
});
