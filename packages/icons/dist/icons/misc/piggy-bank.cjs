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
var piggy_bank_exports = {};
__export(piggy_bank_exports, {
  PiggyBankIcon: () => PiggyBankIcon
});
module.exports = __toCommonJS(piggy_bank_exports);
var import_create_icon = require("../../create-icon.cjs");
const PiggyBankIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PiggyBankIcon", [["path", { "d": "M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" }], ["path", { "d": "M16 10h.01" }], ["path", { "d": "M2 8v1a2 2 0 0 0 2 2h1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PiggyBankIcon
});
