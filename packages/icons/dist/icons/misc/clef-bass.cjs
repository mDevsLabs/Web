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
var clef_bass_exports = {};
__export(clef_bass_exports, {
  ClefBassIcon: () => ClefBassIcon
});
module.exports = __toCommonJS(clef_bass_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClefBassIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClefBassIcon", [["path", { "d": "M19 11h.01" }], ["path", { "d": "M19 6h.01" }], ["path", { "d": "M5 8c0-4 4-4 4-4 6 0 6 6 6 6 0 7-10 11-10 11" }], ["circle", { "cx": "7", "cy": "8", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClefBassIcon
});
