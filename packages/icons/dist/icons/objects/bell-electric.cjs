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
var bell_electric_exports = {};
__export(bell_electric_exports, {
  BellElectricIcon: () => BellElectricIcon
});
module.exports = __toCommonJS(bell_electric_exports);
var import_create_icon = require("../../create-icon.cjs");
const BellElectricIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BellElectricIcon", [["path", { "d": "M18.518 17.347A7 7 0 0 1 14 19" }], ["path", { "d": "M18.8 4A11 11 0 0 1 20 9" }], ["path", { "d": "M9 9h.01" }], ["circle", { "cx": "20", "cy": "16", "r": "2" }], ["circle", { "cx": "9", "cy": "9", "r": "7" }], ["rect", { "x": "4", "y": "16", "width": "10", "height": "6", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BellElectricIcon
});
