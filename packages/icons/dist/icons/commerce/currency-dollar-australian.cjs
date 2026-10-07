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
var currency_dollar_australian_exports = {};
__export(currency_dollar_australian_exports, {
  CurrencyDollarAustralianIcon: () => CurrencyDollarAustralianIcon
});
module.exports = __toCommonJS(currency_dollar_australian_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDollarAustralianIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDollarAustralianIcon", [["path", { "d": "M3 18l3.279 -11.476a.75 .75 0 0 1 1.442 0l3.279 11.476" }], ["path", { "d": "M21 6h-4a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6h-4" }], ["path", { "d": "M17 20v-2" }], ["path", { "d": "M18 6v-2" }], ["path", { "d": "M4.5 14h5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDollarAustralianIcon
});
