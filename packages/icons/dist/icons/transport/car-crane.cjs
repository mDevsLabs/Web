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
var car_crane_exports = {};
__export(car_crane_exports, {
  CarCraneIcon: () => CarCraneIcon
});
module.exports = __toCommonJS(car_crane_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarCraneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarCraneIcon", [["path", { "d": "M3 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M7 18h8m4 0h2v-6a5 5 0 0 0 -5 -5h-1l1.5 5h4.5" }], ["path", { "d": "M12 18v-11h3" }], ["path", { "d": "M3 17v-5h9" }], ["path", { "d": "M4 12v-6l18 -3v2" }], ["path", { "d": "M8 12v-4l-4 -2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarCraneIcon
});
