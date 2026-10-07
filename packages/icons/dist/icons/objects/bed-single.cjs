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
var bed_single_exports = {};
__export(bed_single_exports, {
  BedSingleIcon: () => BedSingleIcon
});
module.exports = __toCommonJS(bed_single_exports);
var import_create_icon = require("../../create-icon.cjs");
const BedSingleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BedSingleIcon", [["path", { "d": "M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" }], ["path", { "d": "M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" }], ["path", { "d": "M3 18h18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BedSingleIcon
});
