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
var dna_2_exports = {};
__export(dna_2_exports, {
  Dna2Icon: () => Dna2Icon
});
module.exports = __toCommonJS(dna_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Dna2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Dna2Icon", [["path", { "d": "M17 3v1c-.01 3.352 -1.68 6.023 -5.008 8.014c-3.328 1.99 3.336 -2 .008 -.014c-3.328 1.99 -5 4.662 -5.008 8.014v1" }], ["path", { "d": "M17 21.014v-1c-.01 -3.352 -1.68 -6.023 -5.008 -8.014c-3.328 -1.99 3.336 2 .008 .014c-3.328 -1.991 -5 -4.662 -5.008 -8.014v-1" }], ["path", { "d": "M7 4h10" }], ["path", { "d": "M7 20h10" }], ["path", { "d": "M8 8h8" }], ["path", { "d": "M8 16h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dna2Icon
});
