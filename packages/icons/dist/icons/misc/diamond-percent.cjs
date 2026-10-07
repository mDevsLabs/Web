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
var diamond_percent_exports = {};
__export(diamond_percent_exports, {
  DiamondPercentIcon: () => DiamondPercentIcon
});
module.exports = __toCommonJS(diamond_percent_exports);
var import_create_icon = require("../../create-icon.cjs");
const DiamondPercentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DiamondPercentIcon", [["path", { "d": "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z" }], ["path", { "d": "M9.2 9.2h.01" }], ["path", { "d": "m14.5 9.5-5 5" }], ["path", { "d": "M14.7 14.8h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DiamondPercentIcon
});
