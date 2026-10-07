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
var land_plot_exports = {};
__export(land_plot_exports, {
  LandPlotIcon: () => LandPlotIcon
});
module.exports = __toCommonJS(land_plot_exports);
var import_create_icon = require("../../create-icon.cjs");
const LandPlotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LandPlotIcon", [["path", { "d": "m12 8 6-3-6-3v10" }], ["path", { "d": "m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12" }], ["path", { "d": "m6.49 12.85 11.02 6.3" }], ["path", { "d": "M17.51 12.85 6.5 19.15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LandPlotIcon
});
