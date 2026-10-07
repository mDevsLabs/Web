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
var fishing_rod_exports = {};
__export(fishing_rod_exports, {
  FishingRodIcon: () => FishingRodIcon
});
module.exports = __toCommonJS(fishing_rod_exports);
var import_create_icon = require("../../create-icon.cjs");
const FishingRodIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FishingRodIcon", [["path", { "d": "M4 11h1" }], ["path", { "d": "M8 15a2 2 0 0 1-4 0V3a1 1 0 0 1 1-1h.5C14 2 20 9 20 18v4" }], ["circle", { "cx": "18", "cy": "18", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FishingRodIcon
});
