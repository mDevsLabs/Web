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
var cpu_exports = {};
__export(cpu_exports, {
  CpuIcon: () => CpuIcon
});
module.exports = __toCommonJS(cpu_exports);
var import_create_icon = require("../../create-icon.cjs");
const CpuIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CpuIcon", [["path", { "d": "M12 20v2" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M17 20v2" }], ["path", { "d": "M17 2v2" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "M2 17h2" }], ["path", { "d": "M2 7h2" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "M20 17h2" }], ["path", { "d": "M20 7h2" }], ["path", { "d": "M7 20v2" }], ["path", { "d": "M7 2v2" }], ["rect", { "x": "4", "y": "4", "width": "16", "height": "16", "rx": "2" }], ["rect", { "x": "8", "y": "8", "width": "8", "height": "8", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CpuIcon
});
