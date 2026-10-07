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
var currency_dollar_guyanese_exports = {};
__export(currency_dollar_guyanese_exports, {
  CurrencyDollarGuyaneseIcon: () => CurrencyDollarGuyaneseIcon
});
module.exports = __toCommonJS(currency_dollar_guyanese_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDollarGuyaneseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDollarGuyaneseIcon", [["path", { "d": "M21 6h-4a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6h-4" }], ["path", { "d": "M10 6h-3a4 4 0 0 0 -4 4v4a4 4 0 0 0 4 4h3v-6h-2" }], ["path", { "d": "M17 20v-2" }], ["path", { "d": "M18 6v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDollarGuyaneseIcon
});
