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
var confucius_exports = {};
__export(confucius_exports, {
  ConfuciusIcon: () => ConfuciusIcon
});
module.exports = __toCommonJS(confucius_exports);
var import_create_icon = require("../../create-icon.cjs");
const ConfuciusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ConfuciusIcon", [["path", { "d": "M9 19l3 2v-18" }], ["path", { "d": "M4 10l8 -2" }], ["path", { "d": "M4 18l8 -10" }], ["path", { "d": "M20 18l-8 -8l8 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfuciusIcon
});
