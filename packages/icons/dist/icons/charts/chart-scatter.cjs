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
var chart_scatter_exports = {};
__export(chart_scatter_exports, {
  ChartScatterIcon: () => ChartScatterIcon
});
module.exports = __toCommonJS(chart_scatter_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartScatterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartScatterIcon", [["circle", { "cx": "7.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "18.5", "cy": "5.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "11.5", "cy": "11.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "7.5", "cy": "16.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "17.5", "cy": "14.5", "r": ".5", "fill": "currentColor" }], ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartScatterIcon
});
