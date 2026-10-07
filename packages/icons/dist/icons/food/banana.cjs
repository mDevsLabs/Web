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
var banana_exports = {};
__export(banana_exports, {
  BananaIcon: () => BananaIcon
});
module.exports = __toCommonJS(banana_exports);
var import_create_icon = require("../../create-icon.cjs");
const BananaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BananaIcon", [["path", { "d": "M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" }], ["path", { "d": "M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BananaIcon
});
