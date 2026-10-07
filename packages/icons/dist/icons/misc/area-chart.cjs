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
var area_chart_exports = {};
__export(area_chart_exports, {
  AreaChartIcon: () => AreaChartIcon
});
module.exports = __toCommonJS(area_chart_exports);
var import_create_icon = require("../../create-icon.cjs");
const AreaChartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AreaChartIcon", [["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AreaChartIcon
});
