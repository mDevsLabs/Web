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
var gavel_exports = {};
__export(gavel_exports, {
  GavelIcon: () => GavelIcon
});
module.exports = __toCommonJS(gavel_exports);
var import_create_icon = require("../../create-icon.cjs");
const GavelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GavelIcon", [["path", { "d": "m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" }], ["path", { "d": "m16 16 6-6" }], ["path", { "d": "m21.5 10.5-8-8" }], ["path", { "d": "m8 8 6-6" }], ["path", { "d": "m8.5 7.5 8 8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GavelIcon
});
