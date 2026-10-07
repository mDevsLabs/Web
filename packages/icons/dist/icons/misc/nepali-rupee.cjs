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
var nepali_rupee_exports = {};
__export(nepali_rupee_exports, {
  NepaliRupeeIcon: () => NepaliRupeeIcon
});
module.exports = __toCommonJS(nepali_rupee_exports);
var import_create_icon = require("../../create-icon.cjs");
const NepaliRupeeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NepaliRupeeIcon", [["path", { "d": "M18 16.173 A4.74 4.74 0 0 0 13.496 8.005" }], ["path", { "d": "M4 3 L20 3" }], ["path", { "d": "M5 13 L13.5 21" }], ["path", { "d": "M5 13 L9 13" }], ["path", { "d": "M8 13 C15.5 13 14.667 3 8 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NepaliRupeeIcon
});
