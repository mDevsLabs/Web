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
var bed_exports = {};
__export(bed_exports, {
  BedIcon: () => BedIcon
});
module.exports = __toCommonJS(bed_exports);
var import_create_icon = require("../../create-icon.cjs");
const BedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BedIcon", [["path", { "d": "M2 4v16" }], ["path", { "d": "M2 8h18a2 2 0 0 1 2 2v10" }], ["path", { "d": "M2 17h20" }], ["path", { "d": "M6 8v9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BedIcon
});
