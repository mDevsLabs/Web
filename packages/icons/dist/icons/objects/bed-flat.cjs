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
var bed_flat_exports = {};
__export(bed_flat_exports, {
  BedFlatIcon: () => BedFlatIcon
});
module.exports = __toCommonJS(bed_flat_exports);
var import_create_icon = require("../../create-icon.cjs");
const BedFlatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BedFlatIcon", [["path", { "d": "M3 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M10 13h11v-2a3 3 0 0 0 -3 -3h-8v5" }], ["path", { "d": "M3 16h18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BedFlatIcon
});
