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
var credit_card_reader_exports = {};
__export(credit_card_reader_exports, {
  CreditCardReaderIcon: () => CreditCardReaderIcon
});
module.exports = __toCommonJS(credit_card_reader_exports);
var import_create_icon = require("../../create-icon.cjs");
const CreditCardReaderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CreditCardReaderIcon", [["path", { "d": "M15 16v1" }], ["path", { "d": "M16.963 7.734A1 1 0 0015.999 7H8.003a1 1 0 00-.964.734L4.073 18.467A2 2 0 006 21h12a2 2 0 001.927-2.532z" }], ["path", { "d": "M2.678 8.5A2 2 0 012 7V5a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 01-.676 1.499" }], ["path", { "d": "m9 21 2-14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreditCardReaderIcon
});
