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
var rat_exports = {};
__export(rat_exports, {
  RatIcon: () => RatIcon
});
module.exports = __toCommonJS(rat_exports);
var import_create_icon = require("../../create-icon.cjs");
const RatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RatIcon", [["path", { "d": "M13 22H4a2 2 0 0 1 0-4h12" }], ["path", { "d": "M13.236 18a3 3 0 0 0-2.2-5" }], ["path", { "d": "M16 9h.01" }], ["path", { "d": "M16.82 3.94a3 3 0 1 1 3.237 4.868l1.815 2.587a1.5 1.5 0 0 1-1.5 2.1l-2.872-.453a3 3 0 0 0-3.5 3" }], ["path", { "d": "M17 4.988a3 3 0 1 0-5.2 2.052A7 7 0 0 0 4 14.015 4 4 0 0 0 8 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RatIcon
});
