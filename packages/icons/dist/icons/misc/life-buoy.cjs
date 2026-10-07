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
var life_buoy_exports = {};
__export(life_buoy_exports, {
  LifeBuoyIcon: () => LifeBuoyIcon
});
module.exports = __toCommonJS(life_buoy_exports);
var import_create_icon = require("../../create-icon.cjs");
const LifeBuoyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LifeBuoyIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "m4.93 4.93 4.24 4.24" }], ["path", { "d": "m14.83 9.17 4.24-4.24" }], ["path", { "d": "m14.83 14.83 4.24 4.24" }], ["path", { "d": "m9.17 14.83-4.24 4.24" }], ["circle", { "cx": "12", "cy": "12", "r": "4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LifeBuoyIcon
});
