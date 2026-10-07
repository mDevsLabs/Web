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
var dna_exports = {};
__export(dna_exports, {
  DnaIcon: () => DnaIcon
});
module.exports = __toCommonJS(dna_exports);
var import_create_icon = require("../../create-icon.cjs");
const DnaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DnaIcon", [["path", { "d": "m10 16 1.5 1.5" }], ["path", { "d": "m14 8-1.5-1.5" }], ["path", { "d": "M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" }], ["path", { "d": "m16.5 10.5 1 1" }], ["path", { "d": "m17 6-2.891-2.891" }], ["path", { "d": "M2 15c6.667-6 13.333 0 20-6" }], ["path", { "d": "m20 9 .891.891" }], ["path", { "d": "M3.109 14.109 4 15" }], ["path", { "d": "m6.5 12.5 1 1" }], ["path", { "d": "m7 18 2.891 2.891" }], ["path", { "d": "M9 22c1.798-1.998 2.518-3.995 2.807-5.993" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DnaIcon
});
