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
var hard_hat_exports = {};
__export(hard_hat_exports, {
  HardHatIcon: () => HardHatIcon
});
module.exports = __toCommonJS(hard_hat_exports);
var import_create_icon = require("../../create-icon.cjs");
const HardHatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HardHatIcon", [["path", { "d": "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" }], ["path", { "d": "M14 6a6 6 0 0 1 6 6v3" }], ["path", { "d": "M4 15v-3a6 6 0 0 1 6-6" }], ["rect", { "x": "2", "y": "15", "width": "20", "height": "4", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HardHatIcon
});
