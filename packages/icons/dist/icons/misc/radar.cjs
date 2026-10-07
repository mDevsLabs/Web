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
var radar_exports = {};
__export(radar_exports, {
  RadarIcon: () => RadarIcon
});
module.exports = __toCommonJS(radar_exports);
var import_create_icon = require("../../create-icon.cjs");
const RadarIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RadarIcon", [["path", { "d": "M19.07 4.93A10 10 0 0 0 6.99 3.34" }], ["path", { "d": "M4 6h.01" }], ["path", { "d": "M2.29 9.62A10 10 0 1 0 21.31 8.35" }], ["path", { "d": "M16.24 7.76A6 6 0 1 0 8.23 16.67" }], ["path", { "d": "M12 18h.01" }], ["path", { "d": "M17.99 11.66A6 6 0 0 1 15.77 16.67" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }], ["path", { "d": "m13.41 10.59 5.66-5.66" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadarIcon
});
