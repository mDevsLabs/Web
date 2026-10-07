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
var currency_dirham_exports = {};
__export(currency_dirham_exports, {
  CurrencyDirhamIcon: () => CurrencyDirhamIcon
});
module.exports = __toCommonJS(currency_dirham_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDirhamIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDirhamIcon", [["path", { "d": "M8.5 19h-3.5" }], ["path", { "d": "M8.599 16.479a1.5 1.5 0 1 0 -1.099 2.521" }], ["path", { "d": "M7 4v9" }], ["path", { "d": "M15 13h1.888a1.5 1.5 0 0 0 1.296 -2.256l-2.184 -3.744" }], ["path", { "d": "M11 13.01v-.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDirhamIcon
});
