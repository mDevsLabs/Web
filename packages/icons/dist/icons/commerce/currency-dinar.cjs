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
var currency_dinar_exports = {};
__export(currency_dinar_exports, {
  CurrencyDinarIcon: () => CurrencyDinarIcon
});
module.exports = __toCommonJS(currency_dinar_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDinarIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDinarIcon", [["path", { "d": "M14 20.01v-.01" }], ["path", { "d": "M6 13l2.386 -.9a1 1 0 0 0 -.095 -1.902l-1.514 -.404a1 1 0 0 1 -.102 -1.9l2.325 -.894" }], ["path", { "d": "M3 14v1a3 3 0 0 0 3 3h4.161a3 3 0 0 0 2.983 -3.32l-1.144 -10.68" }], ["path", { "d": "M16 17l1 1h2a2 2 0 0 0 1.649 -3.131l-2.653 -3.869" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDinarIcon
});
