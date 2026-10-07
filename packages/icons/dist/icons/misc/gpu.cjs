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
var gpu_exports = {};
__export(gpu_exports, {
  GpuIcon: () => GpuIcon
});
module.exports = __toCommonJS(gpu_exports);
var import_create_icon = require("../../create-icon.cjs");
const GpuIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GpuIcon", [["path", { "d": "M2 17h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2" }], ["path", { "d": "M2 21V3" }], ["path", { "d": "M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" }], ["circle", { "cx": "16", "cy": "11", "r": "2" }], ["circle", { "cx": "8", "cy": "11", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GpuIcon
});
