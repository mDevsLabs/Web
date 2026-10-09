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
var arrow_up_down_exports = {};
__export(arrow_up_down_exports, {
  ArrowUpDownIcon: () => ArrowUpDownIcon
});
module.exports = __toCommonJS(arrow_up_down_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowUpDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowUpDownIcon", [["path", { "d": "m21 16-4 4-4-4" }], ["path", { "d": "M17 20V4" }], ["path", { "d": "m3 8 4-4 4 4" }], ["path", { "d": "M7 4v16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowUpDownIcon
});
