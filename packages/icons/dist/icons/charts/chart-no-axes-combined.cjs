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
var chart_no_axes_combined_exports = {};
__export(chart_no_axes_combined_exports, {
  ChartNoAxesCombinedIcon: () => ChartNoAxesCombinedIcon
});
module.exports = __toCommonJS(chart_no_axes_combined_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChartNoAxesCombinedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChartNoAxesCombinedIcon", [["path", { "d": "M12 16v5" }], ["path", { "d": "M16 14.639V21" }], ["path", { "d": "M20 10.656V21" }], ["path", { "d": "m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" }], ["path", { "d": "M4 18.463V21" }], ["path", { "d": "M8 14.656V21" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChartNoAxesCombinedIcon
});
