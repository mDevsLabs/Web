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
var diameter_exports = {};
__export(diameter_exports, {
  DiameterIcon: () => DiameterIcon
});
module.exports = __toCommonJS(diameter_exports);
var import_create_icon = require("../../create-icon.cjs");
const DiameterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DiameterIcon", [["circle", { "cx": "19", "cy": "19", "r": "2" }], ["circle", { "cx": "5", "cy": "5", "r": "2" }], ["path", { "d": "M6.48 3.66a10 10 0 0 1 13.86 13.86" }], ["path", { "d": "m6.41 6.41 11.18 11.18" }], ["path", { "d": "M3.66 6.48a10 10 0 0 0 13.86 13.86" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DiameterIcon
});
