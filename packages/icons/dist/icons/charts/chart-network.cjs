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
var chart_network_exports = {};
__export(chart_network_exports, {
  ChartNetworkIcon: () => ChartNetworkIcon
});
module.exports = __toCommonJS(chart_network_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartNetworkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartNetworkIcon", [["path", { "d": "m13.11 7.664 1.78 2.672" }], ["path", { "d": "m14.162 12.788-3.324 1.424" }], ["path", { "d": "m20 4-6.06 1.515" }], ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["circle", { "cx": "12", "cy": "6", "r": "2" }], ["circle", { "cx": "16", "cy": "12", "r": "2" }], ["circle", { "cx": "9", "cy": "15", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartNetworkIcon
});
