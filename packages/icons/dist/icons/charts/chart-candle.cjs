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
var chart_candle_exports = {};
__export(chart_candle_exports, {
  ChartCandleIcon: () => ChartCandleIcon
});
module.exports = __toCommonJS(chart_candle_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartCandleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartCandleIcon", [["path", { "d": "M4 7a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -3" }], ["path", { "d": "M6 4l0 2" }], ["path", { "d": "M6 11l0 9" }], ["path", { "d": "M10 15a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -3" }], ["path", { "d": "M12 4l0 10" }], ["path", { "d": "M12 19l0 1" }], ["path", { "d": "M16 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -4" }], ["path", { "d": "M18 4l0 1" }], ["path", { "d": "M18 11l0 9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartCandleIcon
});
