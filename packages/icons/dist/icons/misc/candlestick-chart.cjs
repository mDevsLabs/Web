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
var candlestick_chart_exports = {};
__export(candlestick_chart_exports, {
  CandlestickChartIcon: () => CandlestickChartIcon
});
module.exports = __toCommonJS(candlestick_chart_exports);
var import_create_icon = require("../../create-icon.cjs");
const CandlestickChartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CandlestickChartIcon", [["path", { "d": "M9 5v4" }], ["rect", { "width": "4", "height": "6", "x": "7", "y": "9", "rx": "1" }], ["path", { "d": "M9 15v2" }], ["path", { "d": "M17 3v2" }], ["rect", { "width": "4", "height": "8", "x": "15", "y": "5", "rx": "1" }], ["path", { "d": "M17 13v3" }], ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CandlestickChartIcon
});
