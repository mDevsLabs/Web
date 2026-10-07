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
var automatic_gearbox_exports = {};
__export(automatic_gearbox_exports, {
  AutomaticGearboxIcon: () => AutomaticGearboxIcon
});
module.exports = __toCommonJS(automatic_gearbox_exports);
var import_create_icon = require("../../create-icon.cjs");
const AutomaticGearboxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AutomaticGearboxIcon", [["path", { "d": "M17 17v4h1a2 2 0 1 0 0 -4h-1" }], ["path", { "d": "M17 11h1.5a1.5 1.5 0 0 0 0 -3h-1.5v5" }], ["path", { "d": "M3 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M5 7v3a1 1 0 0 0 1 1h3v7a1 1 0 0 0 1 1h3" }], ["path", { "d": "M9 11h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AutomaticGearboxIcon
});
