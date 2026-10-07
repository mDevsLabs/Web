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
var currency_dong_exports = {};
__export(currency_dong_exports, {
  CurrencyDongIcon: () => CurrencyDongIcon
});
module.exports = __toCommonJS(currency_dong_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDongIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDongIcon", [["path", { "d": "M8 20h8" }], ["path", { "d": "M15 13a3 3 0 0 1 -3 3a3 3 0 0 1 -3 -3a3 3 0 0 1 3 -3a3 3 0 0 1 3 3" }], ["path", { "d": "M15 4v12" }], ["path", { "d": "M13 6h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDongIcon
});
