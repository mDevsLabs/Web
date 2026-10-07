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
var wash_dry_flat_exports = {};
__export(wash_dry_flat_exports, {
  WashDryFlatIcon: () => WashDryFlatIcon
});
module.exports = __toCommonJS(wash_dry_flat_exports);
var import_create_icon = require("../../create-icon.cjs");
const WashDryFlatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WashDryFlatIcon", [["path", { "d": "M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" }], ["path", { "d": "M7 12h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WashDryFlatIcon
});
