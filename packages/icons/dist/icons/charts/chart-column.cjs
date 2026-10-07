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
var chart_column_exports = {};
__export(chart_column_exports, {
  ChartColumnIcon: () => ChartColumnIcon
});
module.exports = __toCommonJS(chart_column_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartColumnIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartColumnIcon", [["path", { "d": "M4 20h3" }], ["path", { "d": "M17 20h3" }], ["path", { "d": "M10.5 20h3" }], ["path", { "d": "M4 16h3" }], ["path", { "d": "M17 16h3" }], ["path", { "d": "M10.5 16h3" }], ["path", { "d": "M4 12h3" }], ["path", { "d": "M17 12h3" }], ["path", { "d": "M10.5 12h3" }], ["path", { "d": "M4 8h3" }], ["path", { "d": "M17 8h3" }], ["path", { "d": "M4 4h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartColumnIcon
});
