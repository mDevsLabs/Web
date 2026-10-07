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
var grape_exports = {};
__export(grape_exports, {
  GrapeIcon: () => GrapeIcon
});
module.exports = __toCommonJS(grape_exports);
var import_create_icon = require("../../create-icon.cjs");
const GrapeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GrapeIcon", [["path", { "d": "M22 5V2l-5.89 5.89" }], ["circle", { "cx": "16.6", "cy": "15.89", "r": "3" }], ["circle", { "cx": "8.11", "cy": "7.4", "r": "3" }], ["circle", { "cx": "12.35", "cy": "11.65", "r": "3" }], ["circle", { "cx": "13.91", "cy": "5.85", "r": "3" }], ["circle", { "cx": "18.15", "cy": "10.09", "r": "3" }], ["circle", { "cx": "6.56", "cy": "13.2", "r": "3" }], ["circle", { "cx": "10.8", "cy": "17.44", "r": "3" }], ["circle", { "cx": "5", "cy": "19", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GrapeIcon
});
