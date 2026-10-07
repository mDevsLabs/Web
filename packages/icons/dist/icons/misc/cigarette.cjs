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
var cigarette_exports = {};
__export(cigarette_exports, {
  CigaretteIcon: () => CigaretteIcon
});
module.exports = __toCommonJS(cigarette_exports);
var import_create_icon = require("../../create-icon.cjs");
const CigaretteIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CigaretteIcon", [["path", { "d": "M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" }], ["path", { "d": "M18 8c0-2.5-2-2.5-2-5" }], ["path", { "d": "M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }], ["path", { "d": "M22 8c0-2.5-2-2.5-2-5" }], ["path", { "d": "M7 12v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CigaretteIcon
});
