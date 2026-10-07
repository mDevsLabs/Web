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
var antenna_bars_off_exports = {};
__export(antenna_bars_off_exports, {
  AntennaBarsOffIcon: () => AntennaBarsOffIcon
});
module.exports = __toCommonJS(antenna_bars_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AntennaBarsOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AntennaBarsOffIcon", [["path", { "d": "M6 18v-3" }], ["path", { "d": "M10 18v-6" }], ["path", { "d": "M14 18v-4" }], ["path", { "d": "M14 10v-1" }], ["path", { "d": "M18 14v-8" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AntennaBarsOffIcon
});
