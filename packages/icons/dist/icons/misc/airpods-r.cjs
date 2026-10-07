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
var airpods_r_exports = {};
__export(airpods_r_exports, {
  AirpodsRIcon: () => AirpodsRIcon
});
module.exports = __toCommonJS(airpods_r_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirpodsRIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirpodsRIcon", [["path", { "d": "M18 4a4 4 0 0 0 -4 3.8v10.7a1.5 1.5 0 1 0 3 0v-6.5h1a4 4 0 0 0 4 -3.8v-.2a4 4 0 0 0 -4 -4" }], ["path", { "d": "M5 12h2a2 2 0 1 0 0 -4h-2v8m4 0l-3 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirpodsRIcon
});
