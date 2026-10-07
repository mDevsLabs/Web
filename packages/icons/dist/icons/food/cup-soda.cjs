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
var cup_soda_exports = {};
__export(cup_soda_exports, {
  CupSodaIcon: () => CupSodaIcon
});
module.exports = __toCommonJS(cup_soda_exports);
var import_create_icon = require("../../create-icon.cjs");
const CupSodaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CupSodaIcon", [["path", { "d": "m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" }], ["path", { "d": "M5 8h14" }], ["path", { "d": "M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }], ["path", { "d": "m12 8 1-6h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CupSodaIcon
});
