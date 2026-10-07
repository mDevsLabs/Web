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
var waves_ladder_exports = {};
__export(waves_ladder_exports, {
  WavesLadderIcon: () => WavesLadderIcon
});
module.exports = __toCommonJS(waves_ladder_exports);
var import_create_icon = require("../../create-icon.cjs");
const WavesLadderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WavesLadderIcon", [["path", { "d": "M19 5a2 2 0 0 0-2 2v11" }], ["path", { "d": "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }], ["path", { "d": "M7 13h10" }], ["path", { "d": "M7 9h10" }], ["path", { "d": "M9 5a2 2 0 0 0-2 2v11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WavesLadderIcon
});
