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
var chart_arrows_exports = {};
__export(chart_arrows_exports, {
  ChartArrowsIcon: () => ChartArrowsIcon
});
module.exports = __toCommonJS(chart_arrows_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartArrowsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartArrowsIcon", [["path", { "d": "M3 18l14 0" }], ["path", { "d": "M9 9l3 3l-3 3" }], ["path", { "d": "M14 15l3 3l-3 3" }], ["path", { "d": "M3 3l0 18" }], ["path", { "d": "M3 12l9 0" }], ["path", { "d": "M18 3l3 3l-3 3" }], ["path", { "d": "M3 6l18 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartArrowsIcon
});
