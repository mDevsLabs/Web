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
var galaxy_exports = {};
__export(galaxy_exports, {
  GalaxyIcon: () => GalaxyIcon
});
module.exports = __toCommonJS(galaxy_exports);
var import_create_icon = require("../../create-icon.cjs");
const GalaxyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GalaxyIcon", [["path", { "d": "M16.005 15.108a5.041 6.52 28.25 00-8.008-6.217 5.041 6.52 28.25 008.008 6.217A11.884 7.288-60.76 014.029 7.001" }], ["path", { "d": "M17 21h.01" }], ["path", { "d": "M7 3h.01" }], ["path", { "d": "M7.997 8.891a11.885 7.288-60.756 0111.977 8.107" }], ["circle", { "cx": "12", "cy": "12", "r": "1", "fill": "currentColor" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GalaxyIcon
});
