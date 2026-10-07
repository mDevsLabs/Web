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
var trophy_exports = {};
__export(trophy_exports, {
  TrophyIcon: () => TrophyIcon
});
module.exports = __toCommonJS(trophy_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrophyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrophyIcon", [["path", { "d": "M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" }], ["path", { "d": "M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" }], ["path", { "d": "M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" }], ["path", { "d": "M4 22h16" }], ["path", { "d": "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" }], ["path", { "d": "M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrophyIcon
});
