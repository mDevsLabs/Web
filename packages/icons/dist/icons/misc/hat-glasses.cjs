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
var hat_glasses_exports = {};
__export(hat_glasses_exports, {
  HatGlassesIcon: () => HatGlassesIcon
});
module.exports = __toCommonJS(hat_glasses_exports);
var import_create_icon = require("../../create-icon.cjs");
const HatGlassesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HatGlassesIcon", [["path", { "d": "M14 18a2 2 0 0 0-4 0" }], ["path", { "d": "m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" }], ["path", { "d": "M2 11h20" }], ["circle", { "cx": "17", "cy": "18", "r": "3" }], ["circle", { "cx": "7", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HatGlassesIcon
});
