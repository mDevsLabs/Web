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
var chart_dots_exports = {};
__export(chart_dots_exports, {
  ChartDotsIcon: () => ChartDotsIcon
});
module.exports = __toCommonJS(chart_dots_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartDotsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartDotsIcon", [["path", { "d": "M3 3v18h18" }], ["path", { "d": "M7 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M17 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M12 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M10.16 10.62l2.34 2.88" }], ["path", { "d": "M15.088 13.328l2.837 -4.586" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartDotsIcon
});
