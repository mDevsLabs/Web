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
var baseline_exports = {};
__export(baseline_exports, {
  BaselineIcon: () => BaselineIcon
});
module.exports = __toCommonJS(baseline_exports);
var import_create_icon = require("../../create-icon.cjs");
const BaselineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BaselineIcon", [["path", { "d": "M4 20h16" }], ["path", { "d": "m6 16 6-12 6 12" }], ["path", { "d": "M8 12h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaselineIcon
});
