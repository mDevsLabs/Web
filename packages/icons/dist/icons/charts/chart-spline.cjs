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
var chart_spline_exports = {};
__export(chart_spline_exports, {
  ChartSplineIcon: () => ChartSplineIcon
});
module.exports = __toCommonJS(chart_spline_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartSplineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartSplineIcon", [["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartSplineIcon
});
