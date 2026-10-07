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
var align_vertical_distribute_center_exports = {};
__export(align_vertical_distribute_center_exports, {
  AlignVerticalDistributeCenterIcon: () => AlignVerticalDistributeCenterIcon
});
module.exports = __toCommonJS(align_vertical_distribute_center_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignVerticalDistributeCenterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignVerticalDistributeCenterIcon", [["path", { "d": "M22 17h-3" }], ["path", { "d": "M22 7h-5" }], ["path", { "d": "M5 17H2" }], ["path", { "d": "M7 7H2" }], ["rect", { "x": "5", "y": "14", "width": "14", "height": "6", "rx": "2" }], ["rect", { "x": "7", "y": "4", "width": "10", "height": "6", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignVerticalDistributeCenterIcon
});
