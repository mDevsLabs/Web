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
var chart_arcs_exports = {};
__export(chart_arcs_exports, {
  ChartArcsIcon: () => ChartArcsIcon
});
module.exports = __toCommonJS(chart_arcs_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartArcsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartArcsIcon", [["path", { "d": "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }], ["path", { "d": "M16.924 11.132a5 5 0 1 0 -4.056 5.792" }], ["path", { "d": "M3 12a9 9 0 1 0 9 -9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartArcsIcon
});
