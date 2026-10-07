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
var currency_bitcoin_exports = {};
__export(currency_bitcoin_exports, {
  CurrencyBitcoinIcon: () => CurrencyBitcoinIcon
});
module.exports = __toCommonJS(currency_bitcoin_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyBitcoinIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyBitcoinIcon", [["path", { "d": "M6 6h8a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-8" }], ["path", { "d": "M8 6l0 12" }], ["path", { "d": "M8 12l6 0" }], ["path", { "d": "M9 3l0 3" }], ["path", { "d": "M13 3l0 3" }], ["path", { "d": "M9 18l0 3" }], ["path", { "d": "M13 18l0 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyBitcoinIcon
});
