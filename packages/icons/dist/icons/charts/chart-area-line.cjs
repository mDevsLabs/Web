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
var chart_area_line_exports = {};
__export(chart_area_line_exports, {
  ChartAreaLineIcon: () => ChartAreaLineIcon
});
module.exports = __toCommonJS(chart_area_line_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartAreaLineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartAreaLineIcon", [["path", { "d": "M4 19l4 -6l4 2l4 -5l4 4l0 5l-16 0" }], ["path", { "d": "M4 12l3 -4l4 2l5 -6l4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartAreaLineIcon
});
