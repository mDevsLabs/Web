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
var metronome_exports = {};
__export(metronome_exports, {
  MetronomeIcon: () => MetronomeIcon
});
module.exports = __toCommonJS(metronome_exports);
var import_create_icon = require("../../create-icon.cjs");
const MetronomeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MetronomeIcon", [["path", { "d": "M12 11.4V9.1" }], ["path", { "d": "m12 17 6.59-6.59" }], ["path", { "d": "m15.05 5.7-.218-.691a3 3 0 0 0-5.663 0L4.418 19.695A1 1 0 0 0 5.37 21h13.253a1 1 0 0 0 .951-1.31L18.45 16.2" }], ["circle", { "cx": "20", "cy": "9", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MetronomeIcon
});
