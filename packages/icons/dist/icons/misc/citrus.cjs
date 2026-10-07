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
var citrus_exports = {};
__export(citrus_exports, {
  CitrusIcon: () => CitrusIcon
});
module.exports = __toCommonJS(citrus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CitrusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CitrusIcon", [["path", { "d": "M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z" }], ["path", { "d": "M19.65 15.66A8 8 0 0 1 8.35 4.34" }], ["path", { "d": "m14 10-5.5 5.5" }], ["path", { "d": "M14 17.85V10H6.15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CitrusIcon
});
