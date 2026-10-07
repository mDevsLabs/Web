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
var file_chart_pie_exports = {};
__export(file_chart_pie_exports, {
  FileChartPieIcon: () => FileChartPieIcon
});
module.exports = __toCommonJS(file_chart_pie_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileChartPieIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileChartPieIcon", [["path", { "d": "M15.941 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.704l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.512" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M4.017 11.512a6 6 0 1 0 8.466 8.475" }], ["path", { "d": "M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileChartPieIcon
});
