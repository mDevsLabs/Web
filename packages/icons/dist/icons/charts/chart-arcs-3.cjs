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
var chart_arcs_3_exports = {};
__export(chart_arcs_3_exports, {
  ChartArcs3Icon: () => ChartArcs3Icon
});
module.exports = __toCommonJS(chart_arcs_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartArcs3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartArcs3Icon", [["path", { "d": "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }], ["path", { "d": "M7 12a5 5 0 1 0 5 -5" }], ["path", { "d": "M6.29 18.957a9 9 0 1 0 5.71 -15.957" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartArcs3Icon
});
