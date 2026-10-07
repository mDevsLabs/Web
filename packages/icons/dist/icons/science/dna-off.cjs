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
var dna_off_exports = {};
__export(dna_off_exports, {
  DnaOffIcon: () => DnaOffIcon
});
module.exports = __toCommonJS(dna_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const DnaOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DnaOffIcon", [["path", { "d": "M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" }], ["path", { "d": "m17 6-2.891-2.891" }], ["path", { "d": "M2 15c3.333-3 6.667-3 10-3" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "m20 9 .891.891" }], ["path", { "d": "M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" }], ["path", { "d": "M3.109 14.109 4 15" }], ["path", { "d": "m6.5 12.5 1 1" }], ["path", { "d": "m7 18 2.891 2.891" }], ["path", { "d": "M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DnaOffIcon
});
