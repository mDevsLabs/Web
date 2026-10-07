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
var venetian_mask_exports = {};
__export(venetian_mask_exports, {
  VenetianMaskIcon: () => VenetianMaskIcon
});
module.exports = __toCommonJS(venetian_mask_exports);
var import_create_icon = require("../../create-icon.cjs");
const VenetianMaskIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VenetianMaskIcon", [["path", { "d": "M18 11c-1.5 0-2.5.5-3 2" }], ["path", { "d": "M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z" }], ["path", { "d": "M6 11c1.5 0 2.5.5 3 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VenetianMaskIcon
});
