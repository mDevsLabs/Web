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
var arrow_down_0_1_exports = {};
__export(arrow_down_0_1_exports, {
  ArrowDown01Icon: () => ArrowDown01Icon
});
module.exports = __toCommonJS(arrow_down_0_1_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowDown01Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowDown01Icon", [["path", { "d": "m3 16 4 4 4-4" }], ["path", { "d": "M7 20V4" }], ["rect", { "x": "15", "y": "4", "width": "4", "height": "6", "ry": "2" }], ["path", { "d": "M17 20v-6h-2" }], ["path", { "d": "M15 20h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowDown01Icon
});
