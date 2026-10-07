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
var bar_chart_4_exports = {};
__export(bar_chart_4_exports, {
  BarChart4Icon: () => BarChart4Icon
});
module.exports = __toCommonJS(bar_chart_4_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarChart4Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarChart4Icon", [["path", { "d": "M13 17V9" }], ["path", { "d": "M18 17V5" }], ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "M8 17v-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarChart4Icon
});
