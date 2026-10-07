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
var bar_chart_2_exports = {};
__export(bar_chart_2_exports, {
  BarChart2Icon: () => BarChart2Icon
});
module.exports = __toCommonJS(bar_chart_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarChart2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarChart2Icon", [["path", { "d": "M5 21v-6" }], ["path", { "d": "M12 21V3" }], ["path", { "d": "M19 21V9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarChart2Icon
});
