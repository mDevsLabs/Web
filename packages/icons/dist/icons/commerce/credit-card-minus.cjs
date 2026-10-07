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
var credit_card_minus_exports = {};
__export(credit_card_minus_exports, {
  CreditCardMinusIcon: () => CreditCardMinusIcon
});
module.exports = __toCommonJS(credit_card_minus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CreditCardMinusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CreditCardMinusIcon", [["path", { "d": "M22 13V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h8.536" }], ["path", { "d": "M22 10H2" }], ["path", { "d": "M6 14h2" }], ["path", { "d": "M16 17h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreditCardMinusIcon
});
