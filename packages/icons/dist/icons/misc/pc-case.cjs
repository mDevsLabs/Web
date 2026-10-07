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
var pc_case_exports = {};
__export(pc_case_exports, {
  PcCaseIcon: () => PcCaseIcon
});
module.exports = __toCommonJS(pc_case_exports);
var import_create_icon = require("../../create-icon.cjs");
const PcCaseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PcCaseIcon", [["rect", { "width": "14", "height": "20", "x": "5", "y": "2", "rx": "2" }], ["path", { "d": "M15 14h.01" }], ["path", { "d": "M9 6h6" }], ["path", { "d": "M9 10h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PcCaseIcon
});
