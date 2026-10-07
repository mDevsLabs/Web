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
var solar_panel_exports = {};
__export(solar_panel_exports, {
  SolarPanelIcon: () => SolarPanelIcon
});
module.exports = __toCommonJS(solar_panel_exports);
var import_create_icon = require("../../create-icon.cjs");
const SolarPanelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SolarPanelIcon", [["path", { "d": "M11 2h2" }], ["path", { "d": "m14.28 14-4.56 8" }], ["path", { "d": "m21 22-1.558-4H4.558" }], ["path", { "d": "M3 10v2" }], ["path", { "d": "M6.245 15.04A2 2 0 0 1 8 14h12a1 1 0 0 1 .864 1.505l-3.11 5.457A2 2 0 0 1 16 22H4a1 1 0 0 1-.863-1.506z" }], ["path", { "d": "M7 2a4 4 0 0 1-4 4" }], ["path", { "d": "m8.66 7.66 1.41 1.41" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SolarPanelIcon
});
