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
var earth_exports = {};
__export(earth_exports, {
  EarthIcon: () => EarthIcon
});
module.exports = __toCommonJS(earth_exports);
var import_create_icon = require("../../create-icon.cjs");
const EarthIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EarthIcon", [["path", { "d": "M21.54 15H17a2 2 0 0 0-2 2v4.54" }], ["path", { "d": "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" }], ["path", { "d": "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EarthIcon
});
