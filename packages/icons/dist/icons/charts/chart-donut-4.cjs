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
var chart_donut_4_exports = {};
__export(chart_donut_4_exports, {
  ChartDonut4Icon: () => ChartDonut4Icon
});
module.exports = __toCommonJS(chart_donut_4_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartDonut4Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartDonut4Icon", [["path", { "d": "M8.848 14.667l-3.348 2.833" }], ["path", { "d": "M12 3v5m4 4h5" }], ["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M14.219 15.328l2.781 4.172" }], ["path", { "d": "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartDonut4Icon
});
