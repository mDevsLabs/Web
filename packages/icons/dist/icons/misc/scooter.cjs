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
var scooter_exports = {};
__export(scooter_exports, {
  ScooterIcon: () => ScooterIcon
});
module.exports = __toCommonJS(scooter_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScooterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScooterIcon", [["path", { "d": "M21 4h-3.5l2 11.05" }], ["path", { "d": "M6.95 17h5.142c.523 0 .95-.406 1.063-.916a6.5 6.5 0 0 1 5.345-5.009" }], ["circle", { "cx": "19.5", "cy": "17.5", "r": "2.5" }], ["circle", { "cx": "4.5", "cy": "17.5", "r": "2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScooterIcon
});
