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
var shrimp_exports = {};
__export(shrimp_exports, {
  ShrimpIcon: () => ShrimpIcon
});
module.exports = __toCommonJS(shrimp_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShrimpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShrimpIcon", [["path", { "d": "M10 2a3.28 3.28 0 003.227 1.798l6.17-.561A1 1 0 1119.614 8H8.5a6.44 6.44 0 00-5.63 9.75A6.5 6.5 0 008.5 21c1.38 0 2-.5 2.5-1" }], ["path", { "d": "M10 8a8.5 8.5 0 000 8" }], ["path", { "d": "M11 22c-.5-.5-1.12-1-2.5-1a1 1 0 010-5H12a7 7 0 007-7V8" }], ["path", { "d": "M13 12h.01" }], ["path", { "d": "M8 16c-2 0-4.5-4-4-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShrimpIcon
});
